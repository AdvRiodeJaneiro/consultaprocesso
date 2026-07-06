import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // 1. AUTENTICAÇÃO SEGURA NO SERVIDOR
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const { userMessage, processData, isFirstInteraction } = await req.json()

    // 2. VERIFICAÇÃO DE CRÉDITOS
    const { data: hasLimit, error: limitError } = await supabaseAdmin.rpc('check_user_usage_limit', {
        target_user_id: user.id,
        usage_type: 'process'
    })

    if (limitError) {
        console.error("[process-analysis] Erro ao checar limite:", limitError)
    } else if (hasLimit === false) {
        return new Response(JSON.stringify({ error: 'Limit reached' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY')
    if (!DEEPSEEK_API_KEY) {
      console.error("[process-analysis] DEEPSEEK_API_KEY is missing in Secrets");
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const autorRaw = processData.titulo_polo_ativo || "Autor";
    const reuRaw = processData.titulo_polo_passivo || "Réu";
    const getFirstName = (fullName: string) => (fullName || "").split(' (')[0].split(' ')[0] || "Parte";
    const nomeAutor = getFirstName(autorRaw);
    const nomeReu = getFirstName(reuRaw);

    const basePersona = `
      IDENTIDADE: Você é o assistente virtual oficial da equipe do escritório **Magalhães e Gomes Advogados**.
      LINGUAGEM: Use linguagem simples e de amigo. Evite termos técnicos jurídicos.
      NOMES: Use os nomes **${nomeAutor}** e **${nomeReu}**.
    `;

    let systemInstruction = "";
    if (isFirstInteraction) {
      systemInstruction = `
        ${basePersona}
        TAREFA: Analise o processo e gere 3 partes separadas por "<<<SPLIT>>>".
        PARTE 1: Resumo estruturado com Número CNJ, Autor, Réu, Início, Unidade, Fase e Valor.
        PARTE 2: Detalhes da última movimentação (index 0).
        PARTE 3: Histórico anterior (index 1 em diante) em ordem cronológica inversa.
      `;
    } else {
      systemInstruction = `
        ${basePersona}
        TAREFA: Responda à dúvida do usuário sobre o processo de forma direta e empática.
      `;
    }

    // Chamada para DeepSeek V4 (OpenAI Compatibility Format)
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat", // Mapeia para deepseek-v4-flash
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: `Dados do Processo: ${JSON.stringify(processData)}\n\nPergunta: ${userMessage}` }
        ],
        // Ativamos o modo thinking apenas para análise inicial se necessário, 
        // mas o V4-Flash já é extremamente capaz.
        // DeepSeek V4-Flash suporta thinking mode via parâmetro extra ou modelo específico se disponível.
        // Por padrão, o deepseek-chat é o modelo chat puro.
        stream: false,
        user: user.id // Para KVCache Isolation e performance
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[process-analysis] DeepSeek API error:", errorText);
      return new Response(JSON.stringify({ error: `DeepSeek API Error` }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const result = await response.json();
    const text = result.choices?.[0]?.message?.content || "Não consegui gerar uma resposta.";

    // 3. COBRANÇA
    await supabaseAdmin.rpc('increment_user_usage', {
        target_user_id: user.id,
        usage_type: 'process'
    });

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    console.error("[process-analysis] Unexpected error:", err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
