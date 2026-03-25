"use client";

import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import WhatsappModal from './components/WhatsappModal';
import ConfirmModal from './components/ConfirmModal';
import { ChatView } from './components/ChatView';
import { MaintenanceView } from './components/MaintenanceView';

import Auth from './pages/Auth';
import MyProcesses from './pages/MyProcesses';
import ProcessTimeline from './pages/ProcessTimeline';
import ZApiTest from './pages/ZApiTest';
import AdminSettings from './pages/AdminSettings';
import Pricing from './pages/Pricing';

import { useChat } from './hooks/useChat';
import { useSearchStore } from './store/searchStore';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './integrations/supabase/client';
import { toast } from 'react-hot-toast';
import { Loader2, Settings } from 'lucide-react';
import { Button } from './components/ui/button';

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
    if (profile?.whatsapp) {
      setWhatsappNumber(profile.whatsapp);
    }
  }, [profile, setWhatsappNumber]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getActiveTitle = () => {
    const isMobile = window.innerWidth < 768;
    switch(location.pathname) {
      case '/monitoramento': return 'Monitoramento';
      case '/meus-processos': return 'Meus Processos';
      case '/': return 'Consulta Processo';
      case '/configuracoes': return 'Configurações';
      case '/planos': return 'Assinaturas';
      case '/auth': return 'Autenticação';
      case '/z-api': return 'Integração WhatsApp';
      default:
        if (location.pathname.startsWith('/processo/')) {
            return isMobile ? 'Andamento' : 'Andamento do Processo';
        }
        return 'Dashboard';
    }
  };

  const handleNewSearch = () => {
    if (!showWelcome && (messages.length > 0 || activeProcess)) {
      setShowResetConfirm(true);
    }
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
        <div className="flex flex-col items-center gap-4">
           <Loader2 className="w-10 h-10 text-primary animate-spin" />
           <p className="text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">Verificando Acesso...</p>
        </div>
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
            <Route path="/" element={
              <ChatView 
                showWelcome={showWelcome}
                messages={messages}
                input={input}
                setInput={setInput}
                isProcessing={isProcessing}
                debugInfo={debugInfo}
                setDebugInfo={setDebugInfo}
                handleWelcomeSubmit={handleWelcomeSubmit}
                handleSend={handleSend}
                handleKeyDown={handleKeyDown}
                handleTransitionToMonitor={handleTransitionToMonitor}
              />
            } />
            <Route path="/auth" element={<Auth />} />
            <Route path="/meus-processos" element={<MyProcesses />} />
            <Route path="/processo/:cnj" element={<ProcessTimeline />} />
            <Route path="/z-api" element={<ZApiTest />} />
            <Route path="/planos" element={<Pricing />} />
            <Route path="/monitoramento" element={<MaintenanceView />} />
            <Route path="/configuracoes" element={
              profile?.is_admin ? (
                <AdminSettings />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950 min-h-screen">
                  <div className="max-w-md space-y-4">
                    <div className="bg-slate-900 p-10 rounded-3xl border border-slate-800 shadow-xl inline-block">
                      <Settings className="w-16 h-16 text-red-500 mx-auto mb-6 opacity-50" />
                      <h2 className="text-2xl font-bold text-white">Acesso Restrito</h2>
                      <p className="text-slate-400 mt-2 font-medium">Você não tem permissão para acessar as configurações de administrador.</p>
                      <Button onClick={() => navigate('/')} className="mt-6 bg-primary text-deep-indigo font-bold">Voltar para o Início</Button>
                    </div>
                  </div>
                </div>
              )
            } />
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
        onConfirm={() => {
          resetSearch();
          setShowResetConfirm(false);
        }}
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