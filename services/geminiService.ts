import { supabase } from '../integrations/supabase/client';
import { EscavadorProcesso } from '../types';

/**
 * Gemini Service - Centralizado no Supabase Edge Functions (Blindagem de Chave)
 * Não há mais chaves de API do Gemini ou instruções sensíveis aqui por segurança.
 */

export const generateLegalAnalysis = async (
  userMessage: string,
  processData: EscavadorProcesso,
  isFirstInteraction: boolean
): Promise<string> => {
  const { data, error } = await supabase.functions.invoke('process-analysis', {
    body: { userMessage, processData, isFirstInteraction }
  });

  if (error) {
    console.error("[Gemini Analysis Error]:", error);
    // Propaga o erro real para o chamador tratar (por exemplo, limite excedido)
    throw error;
  }

  return data?.text || "Não consegui gerar uma resposta.";
};