"use client";

import React, { useRef, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ChatBubble } from './components/ChatBubble';
import WelcomeScreen from './components/WelcomeScreen';
import Sidebar from './components/Sidebar';
import MonitorProcess from './components/MonitorProcess';
import Header from './components/Header';
import WhatsappModal from './components/WhatsappModal';
import Auth from './pages/Auth';
import MyProcesses from './pages/MyProcesses';
import ProcessTimeline from './pages/ProcessTimeline';
import { useChat } from './hooks/useChat';

import { cn } from './lib/utils';
import { Settings } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './integrations/supabase/client';
import { toast } from 'react-hot-toast';

function AppContent() {
  const { user, profile, refreshProfile } = useAuth();
  const location = useLocation();
  const {
    showWelcome,
    input,
    setInput,
    messages,
    isProcessing,
    debugInfo,
    setDebugInfo,
    whatsappNumber,
    setWhatsappNumber,
    isWhatsappModalOpen,
    setIsWhatsappModalOpen,
    handleWelcomeSubmit,
    handleSend
  } = useChat();

  // Sync whatsapp number from profile
  useEffect(() => {
    if (profile?.whatsapp) {
      setWhatsappNumber(profile.whatsapp);
    }
  }, [profile, setWhatsappNumber]);
  
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

  const getActiveTitle = () => {
    switch(location.pathname) {
      case '/monitoramento': return 'Monitoramento';
      case '/meus-processos': return 'Meus Processos';
      case '/busca-nome': return 'Busca por Nome/CPF';
      case '/': return 'Consulta Processo';
      case '/configuracoes': return 'Configurações';
      case '/auth': return 'Autenticação';
      default:
        if (location.pathname.startsWith('/processo/')) return 'Andamento do Processo';
        return 'Dashboard';
    }

  };

  const RenderConsulta = () => {
    if (showWelcome) {
      return <WelcomeScreen onSubmit={handleWelcomeSubmit} />;
    }

    return (
      <div className="flex flex-col h-full bg-background dark:bg-background-dark overflow-hidden relative">
        <main className="flex-1 overflow-y-auto p-4 scrollbar-hide">
          <div className="flex flex-col space-y-2 max-w-3xl mx-auto w-full pb-24">
             {debugInfo && (
               <div className="w-full rounded-xl p-4 mb-6 text-xs font-mono overflow-x-auto border border-red-200 bg-red-50 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-red-200/50">
                      <span className="font-bold uppercase tracking-wider">DEBUG API</span>
                      <button onClick={() => setDebugInfo(null)} className="hover:opacity-50 font-bold">&times;</button>
                  </div>
                  <pre className="whitespace-pre-wrap">{debugInfo.content}</pre>
               </div>
             )}

            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </main>

        <footer className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 z-10">
          <div className="max-w-3xl mx-auto w-full">
            <div className="relative flex items-end gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-200">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pergunte algo sobre o processo..."
                className="w-full bg-transparent border-none text-deep-indigo dark:text-white placeholder-slate-400 focus:ring-0 resize-none max-h-32 py-3 px-2 text-sm md:text-base scrollbar-hide leading-relaxed font-medium"
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isProcessing}
                className={cn(
                  "p-3 rounded-lg flex-shrink-0 mb-0.5 transition-all duration-200",
                  input.trim() && !isProcessing
                    ? "bg-primary text-deep-indigo shadow-lg hover:scale-105"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                )}
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
  };

  const RenderEmpty = ({ title }: { title: string }) => (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md space-y-4">
        <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl inline-block">
           <Settings className="w-16 h-16 text-primary mx-auto mb-6 opacity-20" />
           <h2 className="text-2xl font-bold text-deep-indigo dark:text-white">Página em construção</h2>
           <p className="text-slate-500 mt-2 font-medium">
             Estamos preparando a tela de "{title}" para você.
           </p>
        </div>
      </div>
    </div>
  );

  const isAuthPage = location.pathname === '/auth';

  return (
    <div className="flex h-screen bg-background dark:bg-background-dark overflow-hidden font-sans transition-colors duration-200">
      <Toaster position="top-right" reverseOrder={false} />
      {!isAuthPage && <Sidebar />}
      <div className="flex-1 h-full overflow-hidden relative flex flex-col">
        {!isAuthPage && (
          <Header 
            viewTitle={getActiveTitle()} 
            onWhatsappClick={() => setIsWhatsappModalOpen(true)}
          />
        )}
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<RenderConsulta />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/meus-processos" element={<MyProcesses />} />
            <Route path="/processo/:cnj" element={<ProcessTimeline />} />
            <Route path="/monitoramento" element={

              <MonitorProcess
                whatsappNumber={whatsappNumber}
                onUpdateWhatsapp={setWhatsappNumber}
              />
            } />
            <Route path="/configuracoes" element={<RenderEmpty title="Configurações" />} />
          </Routes>
        </div>
      </div>

      <WhatsappModal
         isOpen={isWhatsappModalOpen}
         onClose={() => setIsWhatsappModalOpen(false)}
         onSave={async (phone) => {
            if (user) {
              const { error } = await supabase
                .from('profiles')
                .update({ whatsapp: phone })
                .eq('id', user.id);
              
              if (error) {
                toast.error('Erro ao salvar WhatsApp no perfil');
              } else {
                toast.success('WhatsApp atualizado!');
                refreshProfile();
              }
            }
            setWhatsappNumber(phone);
            setIsWhatsappModalOpen(false);
         }}
         initialValue={whatsappNumber}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}