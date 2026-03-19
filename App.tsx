"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { ChatBubble } from './components/ChatBubble';
import WelcomeScreen from './components/WelcomeScreen';
import Sidebar from './components/Sidebar';
import MonitorProcess from './components/MonitorProcess';
import Header from './components/Header';
import WhatsappModal from './components/WhatsappModal';
import ConfirmModal from './components/ConfirmModal';
import { DebugOverlay } from './components/DebugOverlay'; // Importado aqui
import Auth from './pages/Auth';
import MyProcesses from './pages/MyProcesses';
import ProcessTimeline from './pages/ProcessTimeline';
import ZApiTest from './pages/ZApiTest';
import { useChat } from './hooks/useChat';
import { useSearchStore } from './store/searchStore';

import { cn } from './lib/utils';
import { Settings, Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './integrations/supabase/client';
import { toast } from 'react-hot-toast';

function AppContent() {
  const { user, profile, refreshProfile, sessionLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const setSearchData = useSearchStore(state => state.setSearchData);
  
  const {
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
    isWhatsappModalOpen,
    setIsWhatsappModalOpen,
    resetSearch,
    handleWelcomeSubmit,
    handleSend
  } = useChat();

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (profile?.whatsapp) setWhatsappNumber(profile.whatsapp);
  }, [profile, setWhatsappNumber]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { scrollToBottom(); }, [messages, debugInfo]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const getActiveTitle = () => {
    const isMobile = window.innerWidth < 768;
    switch(location.pathname) {
      case '/monitoramento': return 'Monitoramento';
      case '/meus-processos': return 'Meus Processos';
      case '/': return 'Consulta Processo';
      case '/configuracoes': return 'Configurações';
      case '/auth': return 'Autenticação';
      case '/z-api': return 'Integração WhatsApp';
      default: return 'Dashboard';
    }
  };

  const handleNewSearch = () => {
    if (!showWelcome && (messages.length > 0 || activeProcess)) setShowResetConfirm(true);
  };

  const handleTransitionToMonitor = () => {
    if (activeProcess) {
      setSearchData(activeProcess.numero_cnj, [activeProcess], 'cnj', 1);
      navigate('/monitoramento');
    }
  };

  if (sessionLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background dark:bg-background-dark">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  const isAuthPage = location.pathname === '/auth';

  return (
    <div className="flex h-screen bg-background dark:bg-background-dark overflow-hidden font-sans transition-colors duration-200 relative">
      <Toaster position="top-right" reverseOrder={false} />
      {!isAuthPage && <Sidebar />}
      <div className="flex-1 h-full overflow-hidden relative flex flex-col">
        {!isAuthPage && (
          <Header 
            viewTitle={getActiveTitle()} 
            onWhatsappClick={() => setIsWhatsappModalOpen(true)}
            onNewSearchClick={handleNewSearch}
          />
        )}
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={showWelcome ? <WelcomeScreen onSubmit={handleWelcomeSubmit} /> : (
                <div className="flex flex-col h-full bg-slate-950 dark overflow-hidden relative">
                    <main className="flex-1 overflow-y-auto p-4 scrollbar-hide pb-24">
                        <div className="flex flex-col space-y-2 max-w-3xl mx-auto w-full">
                            {messages.map((msg) => (
                                <ChatBubble key={msg.id} message={msg} onMonitorClick={handleTransitionToMonitor} />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    </main>
                    <footer className="bg-slate-900/80 backdrop-blur-md p-6 border-t border-slate-800 sticky bottom-0">
                        <div className="max-w-3xl mx-auto flex items-end gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Pergunte algo sobre o processo..."
                                className="w-full bg-transparent border-none text-white focus:ring-0 resize-none py-3 px-2 text-sm"
                                rows={1}
                            />
                            <button onClick={handleSend} disabled={!input.trim() || isProcessing} className="p-3 rounded-lg bg-primary text-deep-indigo">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>
                            </button>
                        </div>
                    </footer>
                </div>
            )} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/meus-processos" element={<MyProcesses />} />
            <Route path="/processo/:cnj" element={<ProcessTimeline />} />
            <Route path="/z-api" element={<ZApiTest />} />
            <Route path="/monitoramento" element={<MonitorProcess whatsappNumber={whatsappNumber} onUpdateWhatsapp={setWhatsappNumber} />} />
          </Routes>
        </div>
      </div>

      {/* OVERLAY DE DEBUG VISUAL (BOTÃO NO CANTO INFERIOR DIREITO) */}
      <DebugOverlay />

      <WhatsappModal
         isOpen={isWhatsappModalOpen}
         onClose={() => setIsWhatsappModalOpen(false)}
         onSave={async (phone) => {
            if (user) {
              await supabase.from('profiles').update({ whatsapp: phone }).eq('id', user.id);
              refreshProfile();
              setIsWhatsappModalOpen(false);
            } else {
              setIsWhatsappModalOpen(false);
              navigate('/auth', { state: { mode: 'signup', whatsapp: phone } });
            }
         }}
         initialValue={whatsappNumber}
      />

      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={() => { resetSearch(); setShowResetConfirm(false); }}
        title="Nova consulta?"
        description="Deseja limpar essa consulta e começar outra?"
        confirmLabel="Sim, começar nova"
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