import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-escavador-token',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const payload = await req.json();
    const eventType = payload.evento;
    const monitoramentoId = payload.monitoramento_id;
    const cnj = payload.processo?.numero_cnj || payload.numero_cnj;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: proc, error: dbError } = await supabase
      .from('monitored_processes')
      .select('*')
      .eq('escavador_monitoring_id', monitoramentoId)
      .maybeSingle();

    if (!proc) return new Response("OK", { status: 200 });

    // Se recebermos QUALQUER evento e o processo estiver PENDENTE, significa que ele foi "achado"
    const isFirstTime = proc.status === 'PENDENTE';

    if (eventType === 'nova_movimentacao' || isFirstTime) {
      const conteudoBruto = payload.data?.conteudo || payload.movimentacao?.conteudo || "Processo localizado e agora está sendo monitorado.";
      const dataMov = payload.data?.data || payload.movimentacao?.data || new Date().toLocaleDateString('pt-BR');

      // Tradução IA
      let resumoSimples = conteudoBruto;
      const geminiKey = Deno.env.get('GEMINI_API_KEY');
      
      if (geminiKey) {
        try {
          const prompt = isFirstTime 
            ? `Faça um resumo de boas-vindas curto (140 char) dizendo que o processo foi localizado e o estado atual é: "${conteudoBruto}"`
            : `Resuma esta movimentação jurídica para um cliente leigo em no máximo 140 caracteres: "${conteudoBruto}"`;
          
          const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`, {
            method: 'POST',
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          });
          const aiData = await aiRes.json();
          resumoSimples = aiData.candidates?.[0]?.content?.parts?.[0]?.text || resumoSimples;
        } catch (e) { 
          console.error("[escavador-webhook] Erro na IA (Gemini):", e); 
        }
      }

      // 1. SALVAR NOTIFICAÇÃO
      await supabase.from('process_notifications').insert({
        process_id: proc.id,
        user_id: proc.user_id,
        content: resumoSimples,
        movement_date: dataMov
      });

      // 2. DISPARO WHATSAPP (Z-API)
      const zInstance = Deno.env.get('ZAPI_INSTANCE_ID');
      const zToken = Deno.env.get('ZAPI_TOKEN');
      const zClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');

      if (zInstance && zToken && proc.whatsapp_number) {
        const header = isFirstTime ? "✅ *Processo Localizado!*" : "🔔 *Nova Atualização*";
        const msg = `${header}\n\n⚖️ *CNJ:* ${cnj}\n📅 *Data:* ${dataMov}\n\n📝 *Resumo:* ${resumoSimples}\n\n_Para detalhes, acesse seu painel._`;
        
        try {
          const waRes = await fetch(`https://api.z-api.io/instances/${zInstance}/token/${zToken}/send-text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'client-token': zClientToken || "" },
            body: JSON.stringify({ phone: proc.whatsapp_number.replace(/\D/g, ''), message: msg })
          });
          if (!waRes.ok) console.error("[escavador-webhook] Erro na integração da API do Whatsapp.");
        } catch (e) {
          console.error("[escavador-webhook] Erro técnico Z-API:", e);
        }
      }

      // 3. ATUALIZAR STATUS
      await supabase.from('monitored_processes').update({
        last_movement_summary: resumoSimples,
        last_movement_date: dataMov,
        status: 'ATIVO', // Muda de PENDENTE para ATIVO
        has_new_updates: true
      }).eq('id', proc.id);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) { 
    console.error("[escavador-webhook] Erro na integração com base de dados jurídica.", err);
    return new Response("Erro técnico processado.", { status: 500 }); 
  }
});