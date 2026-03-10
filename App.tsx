"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Message, EscavadorProcesso } from './types';
import { ChatBubble } from './components/ChatBubble';
import WelcomeScreen from './components/WelcomeScreen';
import Sidebar from './components/Sidebar';
import MonitorProcess from './components/MonitorProcess';
import { parseCNJ, formatCNJ } from './utils/cnjParser';
import { fetchProcessData } from './services/escavadorService';
import { generateLegalAnalysis } from './services/geminiService';
import { GlowingButton } from './components/GlowingButton';
import { Search, Eye } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState('search-number');
  const [showWelcome, setShowWelcome] = useState(true);
  
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [activeProcess, setActiveProcess] = useState<EscavadorProcesso | null>(null);
  const [debugInfo, setDebugInfo] = useState<{type: 'error' | 'info', content: string} | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, debugInfo]);

  const resetSearch = () => {
    setActiveProcess(null);
    setDebugInfo(null);
    setMessages([]);
    setShowWelcome(true);
  };

  const processInput = async (userText: string) => {
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

             setActiveProcess(processData);
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
  };

  const handleWelcomeSubmit = (text: string) => {
    setShowWelcome(false);
    processInput(text);
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    const text = input;
    setInput('');
    await processInput(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderContent = () => {
    if (activeView === 'monitor-new' || activeView === 'search-person') {
      return (
        <MonitorProcess
          whatsappNumber={whatsappNumber}
          onUpdateWhatsapp={setWhatsappNumber}
        />
      );
    }

    if (activeView === 'search-number') {

      if (showWelcome) {
        return <WelcomeScreen onSubmit={handleWelcomeSubmit} />;
      }

      return (
        <div className="flex flex-col h-full bg-slate-900 overflow-hidden relative">
          <header className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between z-10 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-slate-800 p-1.5 rounded-lg shadow-md border border-slate-700">
                <img 
                  src="http://advogadoriodejaneiro.com/wp-content/uploads/2025/12/Icon.png" 
                  alt="Logo" 
                  className="w-7 h-7 object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-100 tracking-tight">Consulta Processo IA</h1>
                <p className="text-xs text-[#dfa968] font-medium">Seu tradutor jurídico pessoal</p>
              </div>
            </div>
            <GlowingButton onClick={resetSearch}>
                 Nova Consulta
            </GlowingButton>
          </header>

          <main className="flex-1 overflow-y-auto p-4 bg-slate-900 scrollbar-hide">
            <div className="flex flex-col space-y-2 max-w-3xl mx-auto w-full">
               {debugInfo && (
                 <div className={`w-full rounded-md p-3 mb-4 text-xs font-mono overflow-x-auto border whitespace-pre-wrap ${
                   debugInfo.type === 'error' 
                     ? 'bg-red-900/20 border-red-800 text-red-200' 
                     : 'bg-slate-800 border-slate-700 text-slate-300'
                 }`}>
                    <div className="flex justify-between items-center mb-1 pb-1 border-b border-white/10">
                        <span className="font-bold uppercase tracking-wider">{debugInfo.type === 'error' ? '❌ Erro da API' : 'ℹ️ Info da API'}</span>
                        <button onClick={() => setDebugInfo(null)} className="text-lg leading-none font-bold hover:opacity-50">&times;</button>
                    </div>
                    {debugInfo.content}
                 </div>
               )}

              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </main>

          <footer className="bg-slate-900 p-4 border-t border-slate-800 z-10">
            <div className="max-w-3xl mx-auto w-full">
              {activeProcess && messages.length > 2 && (
                   <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
                     {["Qual a próxima etapa?", "Existem riscos?", "Quanto tempo pode demorar?"].map(q => (
                       <button 
                          key={q}
                          onClick={() => { setInput(q); }} 
                          className="whitespace-nowrap text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                       >
                         {q}
                       </button>
                     ))}
                   </div>
              )}

              <div className="relative flex items-end gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700 focus-within:border-[#dfa968] focus-within:ring-1 focus-within:ring-[#dfa968]/20 transition-all duration-200">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pergunte algo sobre o processo..."
                  className="w-full bg-transparent border-none text-slate-100 placeholder-slate-500 focus:ring-0 resize-none max-h-32 py-3 px-2 text-sm md:text-base scrollbar-hide leading-relaxed"
                  rows={1}
                  style={{ minHeight: '44px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isProcessing}
                  className={`p-3 rounded-lg flex-shrink-0 mb-0.5 transition-all duration-200 ${
                    input.trim() && !isProcessing
                      ? 'bg-[#dfa968] text-slate-900 shadow-lg hover:bg-[#c99557] hover:scale-105 active:scale-95'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                  </svg>
                </button>
              </div>
            </div>
          </footer>
        </div>
      );
    }

    // Placeholder for other views
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-900">
        <div className="max-w-md space-y-4">
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm inline-block mb-4">
             <Search className="w-12 h-12 text-[#dfa968] mx-auto mb-4" />
             <h2 className="text-2xl font-bold text-white">Funcionalidade em breve</h2>
             <p className="text-slate-400 mt-2">
               Estamos trabalhando para trazer a consulta "{activeView}" o mais rápido possível.
             </p>
          </div>
          <button 
            onClick={() => setActiveView('search-number')}
            className="text-[#dfa968] hover:underline text-sm font-medium"
          >
            Voltar para consulta por número
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <div className="flex-1 h-full overflow-hidden relative border-l border-slate-800 shadow-2xl">
        {renderContent()}
      </div>
    </div>
  );
}