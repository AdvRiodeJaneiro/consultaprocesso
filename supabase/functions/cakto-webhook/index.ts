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

    const payload = JSON.parse(rawBody);
    
    // Mapeamento de Campos
    const event = payload.event || payload.eventType || payload.status; 
    const customerEmail = payload.data?.customerEmail || payload.data?.customer?.email || payload.customer?.email;
    const productName = payload.data?.product?.name || payload.product?.name;
    const productId = payload.data?.product?.id || payload.product?.id;

    console.log(`[cakto-webhook] Evento: ${event} | Cliente: ${customerEmail}`);

    if (!customerEmail) {
      return new Response(JSON.stringify({ status: "ignored", reason: "no email found" }), { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Localizar o Plano
    const { data: plan } = await supabase
      .from('plans')
      .select('id')
      .or(`cakto_product_id.eq.${productId},name.eq."${productName}"`)
      .maybeSingle();

    // 2. Localizar o Usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', customerEmail)
      .maybeSingle();

    if (!profile) {
      console.warn(`[cakto-webhook] Usuário ${customerEmail} não encontrado.`);
      return new Response(JSON.stringify({ status: "user_not_found" }), { status: 200 });
    }

    // --- LÓGICA DE ESTADOS DA ASSINATURA ---

    // Eventos de SUCESSO (Ativa/Renova)
    const successEvents = [
      'purchase_approved', 
      'subscription_renewed', 
      'paid', 
      'approved', 
      'order_approved',
      'payment_approved'
    ];
    
    // Eventos de FALHA ou CANCELAMENTO (Desativa imediatamente)
    const failureEvents = [
      'subscription_canceled',
      'canceled',
      'payment_failed',
      'refunded',
      'chargeback',
      'dispute'
    ];

    if (successEvents.includes(event)) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 32); // Ciclo de 32 dias

      await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          current_plan_id: plan?.id || null,
          subscription_expires_at: expiresAt.toISOString()
        })
        .eq('id', profile.id);

      console.log(`[cakto-webhook] ✅ Assinatura ATIVADA para ${customerEmail}`);
      
    } else if (failureEvents.includes(event)) {
      // Limpa os dados do plano imediatamente
      await supabase
        .from('profiles')
        .update({
          subscription_status: 'inactive',
          current_plan_id: null,
          subscription_expires_at: null
        })
        .eq('id', profile.id);

      console.log(`[cakto-webhook] ❌ Assinatura DESATIVADA por cancelamento/falha para ${customerEmail}`);
    }

    return new Response(JSON.stringify({ success: true, event }), { status: 200, headers: corsHeaders });

  } catch (err) {
    console.error("[cakto-webhook] Erro:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});