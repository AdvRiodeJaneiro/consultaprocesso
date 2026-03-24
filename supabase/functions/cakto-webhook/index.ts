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
    
    // Mapeamento Robusto de Campos (Logs Reais vs Documentação)
    const event = payload.event || payload.eventType || payload.status; 
    const customerEmail = payload.data?.customerEmail || payload.data?.customer?.email || payload.customer?.email;
    const productName = payload.data?.product?.name || payload.product?.name;
    const productId = payload.data?.product?.id || payload.product?.id;

    console.log(`[cakto-webhook] Processando Evento: ${event} | Cliente: ${customerEmail}`);

    if (!customerEmail) {
      console.log("[cakto-webhook] Evento ignorado (Campo de e-mail não identificado).");
      return new Response(JSON.stringify({ status: "ignored", reason: "no email found in mapping" }), { status: 200 });
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

    // 2. Localizar o Perfil do Usuário pelo E-mail
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', customerEmail)
      .maybeSingle();

    if (!profile) {
      console.warn(`[cakto-webhook] Usuário ${customerEmail} não encontrado no banco de dados.`);
      return new Response(JSON.stringify({ status: "user_not_found", email: customerEmail }), { status: 200 });
    }

    // 3. Eventos de Sucesso que ativam a assinatura
    const successEvents = [
      'purchase_approved', 
      'subscription_renewed', 
      'paid', 
      'approved', 
      'order_approved',
      'payment_approved'
    ];
    
    if (successEvents.includes(event)) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 32); // Adiciona 32 dias de acesso

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          current_plan_id: plan?.id || null,
          subscription_expires_at: expiresAt.toISOString()
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error("[cakto-webhook] Erro ao atualizar perfil:", updateError);
        return new Response("Update error", { status: 500 });
      }

      console.log(`[cakto-webhook] ✅ Assinatura ATIVADA com sucesso para ${customerEmail}`);
    } else {
      console.log(`[cakto-webhook] Evento informativo (${event}) recebido para ${customerEmail}. Nenhuma ação necessária.`);
    }

    return new Response(JSON.stringify({ success: true, event_processed: event }), { status: 200, headers: corsHeaders });

  } catch (err) {
    console.error("[cakto-webhook] Erro Crítico de Processamento:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});