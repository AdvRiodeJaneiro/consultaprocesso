import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const payload = await req.json();
    
    // Log do payload para debug no painel do Supabase
    console.log("[cakto-webhook] Payload recebido:", JSON.stringify(payload, null, 2));

    /**
     * Estrutura esperada baseada na documentação Cakto:
     * payload.event: 'purchase_approved', 'subscription_renewed', 'subscription_canceled', etc.
     * payload.data.customer.email: e-mail do comprador
     * payload.data.product.id: ID do produto na Cakto
     */
    
    const event = payload.event || payload.eventType; // Ajustar conforme o real campo da Cakto
    const customerEmail = payload.data?.customer?.email;
    const productId = payload.data?.product?.id;

    if (!customerEmail) {
      console.error("[cakto-webhook] E-mail do cliente não encontrado no payload");
      return new Response("Email not found", { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Buscar o usuário pelo e-mail na tabela profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', customerEmail)
      .maybeSingle();

    let userId = profile?.id;
    
    // Fallback caso o e-mail não esteja no profile por algum motivo
    if (!userId) {
      console.log(`[cakto-webhook] E-mail ${customerEmail} não achado na tabela profiles. Tentando auth...`);
      const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
      const user = users.find(u => u.email === customerEmail);
      if (user) userId = user.id;
    }

    if (!userId) {
      console.error(`[cakto-webhook] Usuário com e-mail ${customerEmail} não encontrado no sistema.`);
      return new Response("User not found", { status: 200 }); // Retornamos 200 para a Cakto não ficar tentando reenviar
    }

    // 2. Buscar o plano correspondente no nosso banco pelo ID do produto Cakto
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id')
      .eq('cakto_product_id', productId)
      .maybeSingle();

    // 3. Processar o evento
    if (event === 'purchase_approved' || event === 'subscription_renewed' || event === 'paid') {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 32); // Adicionamos 32 dias (30 do mês + 2 de margem)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          current_plan_id: plan?.id || null,
          subscription_expires_at: expiresAt.toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;
      console.log(`[cakto-webhook] Plano ativado para ${customerEmail}`);
      
    } else if (event === 'subscription_canceled' || event === 'refund' || event === 'chargeback') {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'inactive'
        })
        .eq('id', userId);

      if (updateError) throw updateError;
      console.log(`[cakto-webhook] Assinatura cancelada para ${customerEmail}`);
    }

    return new Response(JSON.stringify({ success: true }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error("[cakto-webhook] Erro processando webhook:", err);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
