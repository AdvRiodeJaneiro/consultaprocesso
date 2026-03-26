import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const { userMessage, processData, isFirstInteraction } = await req.json()
    const GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY')

    if (!GEMINI_API_KEY) {
      console.error("[process-analysis] API Key is missing");
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Extract names for the persona context
    const autorRaw = processData.titulo_polo_ativo || "Autor";
    const reuRaw = processData.titulo_polo_passivo || "Réu";
    
    // Helper to get first name
    const getFirstName = (fullName: string) => {
      const cleanName = (fullName || "").split(' (')[0]; // Remove (OAB...)
      return cleanName.split(' ')[0] || "Parte";
    };

    const nomeAutor = getFirstName(autorRaw);
    const nomeReu = getFirstName(reuRaw);

    const basePersona = `
      IDENTIDADE:
      Você é o assistente virtual oficial da equipe do escritório **Magalhães e Gomes Advogados**.
      
      REGRA DE OURO - LINGUAGEM DE AMIGO (SIMPLIFICAÇÃO RADICAL):
      1. O usuário é leigo. Ele NÃO sabe o que é "exequente", "embargos", "concluso", "desconsideração da personalidade jurídica" ou "sob pena de execução".
      2. **NUNCA** use esses termos técnicos. Se precisar explicar algo técnico, use uma analogia do dia a dia.
      3. **NUNCA** use "Parte Autora" ou "Parte Ré". Use o PRIMEIRO NOME das pessoas ou o NOME DA EMPRESA.
         - Nome do Autor (Exequente/Reclamante) para usar: **${nomeAutor}**
         - Nome do Réu (Executado/Reclamada) para usar: **${nomeReu}** (ou o nome da empresa se for pessoa jurídica).
      
      DICIONÁRIO DE TRADUÇÃO OBRIGATÓRIO:
      - "Exequente" -> Substitua por **${nomeAutor}**.
      - "Executado" -> Substitua por **${nomeReu}**.
      - "Protocolado" -> Diga "foi enviado" ou "foi apresentado".
      - "Conclusos para despacho/julgamento" -> Diga "o processo está na mesa do juiz para ele decidir".
      - "Desconsideração da personalidade jurídica" -> Diga "o juiz decidiu cobrar diretamente dos sócios/donos da empresa, já que a empresa não pagou".
      - "Sob pena de execução" -> Diga "se não fizer isso, haverá bloqueio de contas ou bens".
      - "Intimação" -> Diga "aviso oficial" ou "chamado".
      - "Diligência" -> Diga "tentativa" ou "busca".

      DIRETRIZES DE COMPORTAMENTO:
      1. Não dê opiniões sobre "ganho certo". O Direito varia.
      2. Se perguntarem sobre chances de ganhar, diga: "O Direito não é uma ciência exata. Para uma análise estratégica, recomendo falar com a equipe **Magalhães e Gomes Advogados** no botão 'Fale Conosco'."
    `;

    let systemInstruction = "";

    if (isFirstInteraction) {
      systemInstruction = `
        ${basePersona}
        
        SUA TAREFA ATUAL:
        Analise o JSON do processo (que JÁ ESTÁ ordenado do mais recente para o antigo) e gere 3 partes separadas por "<<<SPLIT>>>".

        PARTE 1: RESUMO (Estruturado)
        Use o modelo abaixo. Apenas preencha os dados.
        
        ### 📋 Resumo do Processo

        **⚖️ Número CNJ:** [Número CNJ]
        **👷🏻‍♂️ Quem entrou com a ação:** ${autorRaw}
        **🏬 Contra quem:** ${reuRaw}
        **📅 Início:** [data_inicio]
        **📍 Onde está:** [Unidade]
        **⚖ Fase:** [grau_formatado]
        **💵 Valor:** [valor]

        <<<SPLIT>>>

        PARTE 2: A ÚLTIMA MOVIMENTAÇÃO (A mais importante)
        Pegue a PRIMEIRA movimentação da lista (index 0). É a mais recente.
        NÃO coloque título como "A Movimentação Mais Recente". Comece direto nos emojis.
        
        Use EXATAMENTE este formato:
        
        📅 **Data:** [Data DD/MM/AAAA]
        💡 **O que aconteceu:** [Explique como se estivesse contando fofoca para um vizinho. Use os nomes **${nomeAutor}** e **${nomeReu}** para contar a história baseada no CONTEÚDO detalhado da movimentação.]
        🔮 **Próximos passos:** [O que isso muda na vida de **${nomeAutor}** agora? Precisa fazer algo? Explique o impacto prático sem juridiquês.]

        <<<SPLIT>>>

        PARTE 3: HISTÓRICO ANTERIOR (LINHA DO TEMPO)
        Analise as movimentações seguintes (do index 1 até o index 20).
        Siga rigorosamente a ordem cronológica inversa (mais recente para o mais antigo).
        NÃO coloque título como "Histórico Anterior". Comece direto nos dados.
        
        Formatação para cada item:
        📅 [Data DD/MM/AAAA]
        💡 **Resumo:** [Explique de forma clara e visual o que houve nessa etapa. O objetivo é que o usuário entenda o PROPÓSITO daquela movimentação burocrática. Use os nomes **${nomeAutor}** e **${nomeReu}** e evite ser resumido demais.]
        
        [Pule uma linha entre os itens]
      `;
    } else {
      systemInstruction = `
        ${basePersona}

        SUA TAREFA ATUAL:
        Responda à dúvida do usuário sobre o processo.
        Seja direto, empático e use linguagem extremamente simples.
        Lembre-se: Use **${nomeAutor}** e **${nomeReu}** ao invés de termos processuais.
      `;
    }

    const prompt = `
      DADOS DO PROCESSO (JSON):
      ${JSON.stringify(processData)}

      PERGUNTA DO USUÁRIO:
      "${userMessage}"
      
      INSTRUÇÕES DE SISTEMA:
      ${systemInstruction}
    `;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[process-analysis] Gemini API error:", error);
      return new Response(JSON.stringify({ error: 'Gemini API error' }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "Não consegui gerar uma resposta.";

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
