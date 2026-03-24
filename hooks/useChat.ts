import { useState, useCallback } from 'react';
import { Message, EscavadorProcesso } from '../types';
import { parseCNJ, formatCNJ } from '../utils/cnjParser';
import { fetchProcessData, fetchProcessMovements } from '../services/escavadorService';
import { generateLegalAnalysis } from '../services/geminiService';

export function useChat() {
  const [activeView, setActiveView] = useState('search-number');
  const [showWelcome, setShowWelcome] = useState(true);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeProcess, setActiveProcess] = useState<EscavadorProcesso | null>(null);
  const [debugInfo, setDebugInfo] = useState<{type: 'error' | 'info', content: string} | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);

  const resetSearch = useCallback(() => {
    setActiveProcess(null);
    setDebugInfo(null);
    setMessages([]);
    setShowWelcome(true);
  }, []);

  const processInput = useCallback(async (userText: string) => {
    if (!userText.trim() || isProcessing) return;
    
    setIsProcessing(true);
    setDebugInfo(null);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      if (!activeProcess) {
        const cnjParts = parseCNJ(userText);
        if (!cnjParts) {
          setIsProcessing(false);
          return; 
        }
        
        const formattedCNJ = formatCNJ(cnjParts);
        const loadingId = 'loading-' + Date.now();

        setMessages(prev => [...prev, {
          id: loadingId,
          role: 'assistant',
          content: 'Buscando informações do processo... Isso pode levar até 1 minuto.',
          timestamp: new Date(),
          isLoading: true
        }]);

        // 1. Busca Dados da Capa
        const processData = await fetchProcessData(formattedCNJ);

        if (!processData) {
          setMessages(prev => prev.map(m => m.id === loadingId ? {
            ...m,
            isLoading: false,
            content: `🔍 Não encontrei o processo **${formattedCNJ}** na base do Escavador.\n\nPossíveis motivos:\n- O processo corre em segredo de justiça.\n- O número digitado está incorreto.\n- O processo é muito recente e ainda não foi indexado.`
          } : m));
          setIsProcessing(false);
          return;
        }

        if (!processData.numero_cnj) {
          const jsonStr = JSON.stringify(processData, null, 2);
          setDebugInfo({ 
            type: 'info', 
            content: `API retornou dados incompletos:\n${jsonStr}` 
          });
          setMessages(prev => prev.map(m => m.id === loadingId ? {
            ...m,
            isLoading: false,
            content: "Recebi uma resposta da API, mas os dados parecem incompletos. Veja o debug acima."
          } : m));
          setIsProcessing(false);
          return;
        }

        // 2. NUTRIÇÃO: Busca Movimentações Detalhadas para a IA ter o que explicar
        try {
          const movementsRes = await fetchProcessMovements(formattedCNJ);
          if (movementsRes && movementsRes.items) {
            processData.movimentacoes = movementsRes.items;
          }
        } catch (movErr) {
          console.warn("Erro ao nutrir consulta simples:", movErr);
        }

        setActiveProcess(processData);

        // 3. Gera Análise com o objeto agora "Nutrido"
        const fullAnalysis = await generateLegalAnalysis("Analise este processo.", processData, true);

        const parts = fullAnalysis.split('<<<SPLIT>>>');
        const summaryPart = parts[0] || "Resumo indisponível.";
        const latestMovePart = parts[1] || "";
        const historyPart = parts[2] || "";

        setMessages(prev => prev.map(m => m.id === loadingId ? {
          ...m,
          isLoading: false,
          content: summaryPart.trim()
        } : m));

        let delay = 600;

        if (latestMovePart.trim().length > 5) {
          setTimeout(() => {
            setMessages(prev => [...prev, {
              id: Date.now().toString() + '-latest',
              role: 'assistant',
              content: `### 🚨 Movimentação Mais Recente\n\n${latestMovePart.trim()}`,
              timestamp: new Date()
            }]);
          }, delay);
          delay += 800; 
        }

        if (historyPart.trim().length > 5 && !historyPart.includes("Sem mais movimentações")) {
          setTimeout(() => {
            setMessages(prev => [...prev, {
              id: Date.now().toString() + '-history',
              role: 'assistant',
              content: `### 📜 Histórico Anterior\n\n${historyPart.trim()}`,
              timestamp: new Date()
            }]);
          }, delay);
          delay += 800;
        }

        // Sugestão de Monitoramento
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now().toString() + '-monitor-suggest',
            role: 'assistant',
            content: "Deseja monitorar esse processo e receber os andamentos sobre ele direto no seu Whatsapp?",
            timestamp: new Date(),
            isMonitorSuggestion: true
          }]);
        }, delay);
        delay += 600;

        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now().toString() + '-contact',
            role: 'assistant',
            content: "Dúvidas, fale com um advogado de nossa equipe:",
            timestamp: new Date(),
            isContact: true
          }]);
        }, delay);

      } else {
        const loadingId = 'loading-' + Date.now();
        setMessages(prev => [...prev, {
          id: loadingId,
          role: 'assistant',
          content: 'Analisando...',
          timestamp: new Date(),
          isLoading: true
        }]);

        const answer = await generateLegalAnalysis(userText, activeProcess, false);

        setMessages(prev => prev.map(m => m.id === loadingId ? {
          ...m,
          isLoading: false,
          content: answer
        } : m));
      }

    } catch (error: any) {
      console.error(error);
      setDebugInfo({ 
        type: 'error', 
        content: `Erro: ${error.message}\n\n${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}` 
      });

      setMessages(prev => {
        const loadingMsg = prev.find(m => m.isLoading);
        if (loadingMsg) {
          return prev.map(m => m.isLoading ? {
            ...m,
            isLoading: false,
            content: "⚠️ Ocorreu um erro técnico. Verifique a área de informações acima."
          } : m);
        } else {
          return [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: "⚠️ Ocorreu um erro técnico. Verifique a área de informações acima.",
            timestamp: new Date()
          }];
        }
      });
    } finally {
      setIsProcessing(false);
    }
  }, [activeProcess, isProcessing]);

  const handleWelcomeSubmit = useCallback((text: string) => {
    setShowWelcome(false);
    processInput(text);
  }, [processInput]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isProcessing) return;
    const text = input;
    setInput('');
    await processInput(text);
  }, [input, isProcessing, processInput]);

  return {
    activeView,
    setActiveView,
    showWelcome,
    setShowWelcome,
    input,
    setInput,
    messages,
    isProcessing,
    activeProcess,
    debugInfo,
    setDebugInfo,
    whatsappNumber,
    setWhatsappNumber,
    isWhatsappModalOpen,
    setIsWhatsappModalOpen,
    resetSearch,
    handleWelcomeSubmit,
    handleSend
  };
}