"use client";

import React, { useRef, useEffect } from 'react';
import { ChatBubble } from './components/ChatBubble';
import WelcomeScreen from './components/WelcomeScreen';
import Sidebar from './components/Sidebar';
import MonitorProcess from './components/MonitorProcess';
import { GlowingButton } from './components/GlowingButton';
import { Search } from 'lucide-react';
import { useChat } from './hooks/useChat';

export default function App() {
  const {
    activeView,
    setActiveView,
    showWelcome,
    input,
    setInput,
    messages,
    isProcessing,
    activeProcess,
    debugInfo,
    setDebugInfo,
    whatsappNumber,
    setWhatsappNumber,
    resetSearch,
    handleWelcomeSubmit,
    handleSend
  } = useChat();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, debugInfo]);

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