import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json();
    console.log("[escavador-webhook] Payload recebido:", JSON.stringify(payload));

    // 1. Identificar o tipo de evento
    const eventType = payload.evento; // nova_movimentacao, processo_encontrado, etc
    const monitoramentoId = payload.monitoramento_id;
    const cnj = payload.processo?.numero_cnj || payload.numero_cnj;

    if (!monitoramentoId) {
       return new Response(JSON.stringify({ error: "Monitoramento ID não encontrado no payload" }), { status: 400 });
    }

    // 2. Inicializar cliente Supabase com Service Role para bypass RLS interno
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Buscar o processo e o dono no nosso banco de dados
    const { data: processRecord, error: dbError } = await supabase
      .from('monitored_processes')
      .select('*, user_id')
      .eq('escavador_monitoring_id', monitoramentoId)
      .single();

    if (dbError || !processRecord) {
      console.error("[escavador-webhook] Processo não encontrado no banco:", dbError);
      return new Response("Processo não monitorado no sistema", { status: 404 });
    }

    // 4. Lógica para Nova Movimentação (Onde entra a IA e o WhatsApp)
    if (eventType === 'nova_movimentacao') {
      const movimentoBruto = payload.data?.conteudo || payload.movimentacao?.conteudo || "Nova movimentação registrada.";
      const dataMov = payload.data?.data || payload.movimentacao?.data || new Date().toLocaleDateString('pt-BR');

      // --- CHAMADA PARA O GEMINI (TRADUÇÃO) ---
      const geminiKey = Deno.env.get('GEMINI_API_KEY');
      let resumoIA = movimentoBruto;

      if (geminiKey) {
        try {
          const prompt = `Traduza esta movimentação jurídica para uma linguagem extremamente simples e curta (máximo 150 caracteres) para uma pessoa leiga entender o que aconteceu no processo dela. Não use termos técnicos. Se for algo irrelevante, diga apenas "O processo teve um andamento técnico de rotina".\n\nMovimentação: "${movimentoBruto}"`;
          
          const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`, {
            method: 'POST',
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          });
          const aiData = await aiResponse.json();
          resumoIA = aiData.candidates?.[0]?.content?.parts?.[0]?.text || movimentoBruto;
        } catch (e) {
          console.error("[escavador-webhook] Erro ao chamar Gemini:", e);
        }
      }

      // --- DISPARO PARA O WHATSAPP (Z-API) ---
      const zapiInstance = Deno.env.get('ZAPI_INSTANCE_ID');
      const zapiToken = Deno.env.get('ZAPI_TOKEN');
      
      if (zapiInstance && zapiToken && processRecord.whatsapp_number) {
        try {
          const message = `*Atualização de Processo*\n\n⚖️ *Processo:* ${cnj}\n📅 *Data:* ${dataMov}\n\n💡 *O que aconteceu:* ${resumoIA}\n\n_Para ver detalhes, acesse seu painel no app._`;
          
          await fetch(`https://api.z-api.io/instances/${zapiInstance}/token/${zapiToken}/send-text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: processRecord.whatsapp_number.replace(/\D/g, ''),
              message: message
            })
          });
          console.log("[escavador-webhook] Mensagem enviada para WhatsApp");
        } catch (e) {
          console.error("[escavador-webhook] Erro ao disparar Z-API:", e);
        }
      }

      // 5. Atualizar o banco de dados com a novidade
      await supabase
        .from('monitored_processes')
        .update({
          last_movement_summary: resumoIA,
          last_movement_date: dataMov,
          status: 'ATUALIZADO',
          last_known_movement_id: payload.data?.id || null
        })
        .eq('id', processRecord.id);
    }

    // 6. Lógica para Processo Encontrado (Primeira sincronização)
    if (eventType === 'processo_encontrado') {
        await supabase
          .from('monitored_processes')
          .update({ status: 'MONITORANDO' })
          .eq('id', processRecord.id);
    }

    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    });

  } catch (error) {
    console.error("[escavador-webhook] Erro crítico:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
})