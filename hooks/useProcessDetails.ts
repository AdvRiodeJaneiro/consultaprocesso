import { useState, useEffect, useCallback } from 'react';
import { EscavadorProcesso, Message } from '../types';
import { fetchProcessData } from '../services/escavadorService';
import { generateLegalAnalysis } from '../services/geminiService';
import { supabase } from '../integrations/supabase/client';

export function useProcessDetails(cnj: string | undefined) {
  const [processData, setProcessData] = useState<EscavadorProcesso | null>(null);
  const [aiMessages, setAiMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!cnj) return;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Buscar dados reais do Escavador
      const liveData = await fetchProcessData(cnj);
      if (!liveData) {
        setError("Processo não encontrado na base de dados.");
        setIsLoading(false);
        return;
      }
      setProcessData(liveData);

      // 2. Verificar no Supabase se já temos análise em cache para este processo
      const { data: dbProc, error: dbError } = await supabase
        .from('monitored_processes')
        .select('ai_analysis_cache, last_known_movement_id')
        .eq('process_number', cnj)
        .maybeSingle();

      const latestMoveId = liveData.movimentacoes?.[0]?.data || liveData.data_ultima_movimentacao;
      
      // Lógica de Inteligência: Re-gerar se houver nova movimentação ou se não houver cache
      const needsNewAnalysis = !dbProc?.ai_analysis_cache || dbProc?.last_known_movement_id !== latestMoveId;

      if (needsNewAnalysis) {
        // Gerar nova análise via Gemini
        const analysis = await generateLegalAnalysis("Analise este processo monitorado.", liveData, true);
        const parts = analysis.split('<<<SPLIT>>>');
        
        const cacheObj = {
          summary: parts[0] || "Resumo indisponível.",
          latest: parts[1] || "",
          history: parts[2] || ""
        };

        // Salvar no banco para a próxima vez
        await supabase
          .from('monitored_processes')
          .update({
            ai_analysis_cache: cacheObj,
            last_known_movement_id: latestMoveId,
            last_movement_summary: parts[1]?.substring(0, 200) || parts[0]?.substring(0, 200)
          })
          .eq('process_number', cnj);

        formatMessagesFromCache(cacheObj);
      } else {
        // Usar cache existente
        formatMessagesFromCache(dbProc.ai_analysis_cache);
      }

    } catch (err: any) {
      console.error("Erro nos detalhes:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [cnj]);

  const formatMessagesFromCache = (cache: any) => {
    const newMsgs: Message[] = [];
    
    if (cache.summary) {
      newMsgs.push({
        id: 'summary',
        role: 'assistant',
        content: cache.summary,
        timestamp: new Date()
      });
    }

    if (cache.latest && cache.latest.length > 10) {
      newMsgs.push({
        id: 'latest',
        role: 'assistant',
        content: `### 🚨 Movimentação Mais Recente\n\n${cache.latest}`,
        timestamp: new Date()
      });
    }

    if (cache.history && cache.history.length > 10) {
      newMsgs.push({
        id: 'history',
        role: 'assistant',
        content: `### 📜 Histórico Anterior\n\n${cache.history}`,
        timestamp: new Date()
      });
    }

    setAiMessages(newMsgs);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { processData, aiMessages, isLoading, error };
}