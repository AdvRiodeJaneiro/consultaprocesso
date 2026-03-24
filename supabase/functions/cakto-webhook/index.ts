import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cakto-signature',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  let rawBody = "";
  try {
    rawBody = await req.text();
    console.log("[cakto-webhook] Raw Request Body:", rawBody);

    // Tentar converter para JSON
    const payload = JSON.parse(rawBody);
    console.log("[cakto-webhook] Evento:", payload.event || payload.eventType || "desconhecido");

    // Validação Opcional da Chave (X-Cakto-Signature)
    const signature = req.headers.get('x-cakto-signature') || req.headers.get('x-cakto-token');
    const expectedKey = Deno.env.get('CAKTO_WEBHOOK_KEY');
    
    if (expectedKey && signature && signature !== expectedKey) {
       console.warn("[cakto-webhook] Assinatura inválida detectada. Verifique as chaves.");
       // Não bloqueamos aqui por enquanto para você conseguir testar, apenas logamos.
    }

    const event = payload.event || payload.eventType || payload.status; 
    const customerEmail = payload.data?.customer?.email || payload.customer?.email;
    const productName = payload.data?.product?.name || payload.product?.name;
    const productId = payload.data?.product?.id || payload.product?.id;

    if (!customerEmail) {
      console.log("[cakto-webhook] Evento ignorado (sem e-mail de cliente).");
      return new Response(JSON.stringify({ status: "ignored", reason: "no email" }), { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Localizar o Plano (Nome ou ID)
    const { data: plan } = await supabase
      .from('plans')
      .select('id')
      .or(`cakto_product_id.eq.${productId},name.eq."${productName}"`)
      .maybeSingle();

    // 2. Localizar o Perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', customerEmail)
      .maybeSingle();

    if (!profile) {
      console.error(`[cakto-webhook] Usuário ${customerEmail} não encontrado no banco.`);
      return new Response("User not found", { status: 200 });
    }

    // 3. Processar Sucesso de Pagamento
    const successEvents = ['purchase_approved', 'subscription_renewed', 'paid', 'approved'];
    
    if (successEvents.includes(event)) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 32); 

      await supabase.from('profiles').update({
        subscription_status: 'active',
        current_plan_id: plan?.id || null,
        subscription_expires_at: expiresAt.toISOString()
      }).eq('id', profile.id);

      console.log(`[cakto-webhook] Assinatura ATIVADA para ${customerEmail}`);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });

  } catch (err) {
    console.error("[cakto-webhook] Erro CRÍTICO:", err.message, "Body:", rawBody);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});