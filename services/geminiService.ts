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
  
  try {
    const { data, error } = await supabase.functions.invoke('process-analysis', {
      body: { userMessage, processData, isFirstInteraction }
    });

    if (error) {
      console.error("[Gemini Analysis Error]:", error);
      throw new Error(error.message || "Não foi possível gerar a análise jurídica.");
    }

    return data?.text || "Não consegui gerar uma resposta.";

  } catch (error: any) {
    console.error("Gemini Error:", error);
    return "Desculpe, tive um problema ao processar sua solicitação no servidor. Tente novamente.";
  }
};