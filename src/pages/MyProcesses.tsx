"use client";

import React from 'react';
import { Search, Gavel, Calendar, Trash2, ChevronRight, BellOff, Loader2 } from 'lucide-react';
import { useMyProcesses, MonitoredProcess } from '../hooks/useMyProcesses';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { EmptyStateAnimation } from '../components/EmptyStateAnimation';

const MyProcesses: React.FC = () => {
  const { processes, loading, cancelMonitoring } = useMyProcesses();
  const { user, loading: authLoading } = useAuth();
  const [search, setSearch] = React.useState('');
  const [isCancelling, setIsCancelling] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const filteredProcesses = processes.filter(p =>
    p.process_number.includes(search)
  );

  const handleCancel = async (process: MonitoredProcess) => {
    if (window.confirm(`Deseja realmente cancelar o monitoramento do processo ${process.process_number}?`)) {
      setIsCancelling(process.id);
      const result = await cancelMonitoring(process.id, process.escavador_monitoring_id);
      if (result.success) {
        toast.success('Monitoramento cancelado com sucesso');
      } else {
        toast.error('Erro ao cancelar: ' + result.error);
      }
      setIsCancelling(null);
    }
  };

  // Se estiver carregando a autenticação, mostra um spinner centralizado simples
  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background dark:bg-background-dark">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  // Se não estiver logado, mostra tela vazia com animação
  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background dark:bg-background-dark">
        <EmptyStateAnimation 
          title="Monitore o andamento do seu processo e receba a atualização no seu Whatsapp."
          description="Faça login para gerenciar seus processos monitorados e acompanhar cada movimentação em tempo real."
          buttonText="Começar"
          onButtonClick={() => navigate('/monitoramento')}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background dark:bg-background-dark overflow-y-auto">
      <div className="p-8 max-w-6xl mx-auto w-full">
        {/* Title Section */}
        <div className="mb-10">
          <h2 className="text-3xl font-black text-deep-indigo dark:text-white tracking-tight">Meus Processos</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Gerencie os processos que você está monitorando no momento.</p>
        </div>

        {/* Search Bar - Match MonitorProcess UI */}
        <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 mb-10 flex flex-col md:flex-row gap-2">
          <div className="flex-1 flex items-center px-4 gap-3 bg-slate-50 dark:bg-slate-800 rounded-xl h-14 border border-transparent focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-0 transition-all">
            <Search className="text-slate-300" size={20} />
            <input
              className="w-full bg-transparent border-none focus:ring-0 text-deep-indigo dark:text-white placeholder:text-slate-400 font-medium outline-none"
              placeholder="Filtrar meus processos por número..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="mt-4 text-slate-500 font-medium">Carregando seus processos...</p>
          </div>
        ) : filteredProcesses.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
            {filteredProcesses.map((proc) => (
              <div key={proc.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all p-6 flex flex-col justify-between group overflow-hidden relative">
                
                {/* Status Badge */}
                <div className="absolute top-0 right-0 px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black rounded-bl-2xl uppercase">
                  {proc.status}
                </div>

                <div className="mb-6">
                  <div className="flex gap-4 mb-4">
                    <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                      <Gavel size={24} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Número CNJ</p>
                      <h4 className="text-lg font-bold text-deep-indigo dark:text-white truncate">{proc.process_number}</h4>
                    </div>
                  </div>

                  {/* Highlight Section: Last Movement */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar size={14} className="text-primary" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Última Movimentação</span>
                      <span className="text-[10px] font-bold text-primary ml-auto">{proc.last_movement_date || 'Aguardando atualização'}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {proc.last_movement_summary || 'O robô está verificando o tribunal. Você será avisado assim que surgir uma novidade.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <button 
                    onClick={() => handleCancel(proc)}
                    disabled={isCancelling === proc.id}
                    className="flex items-center gap-2 text-slate-400 hover:text-red-500 transition-colors px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 text-xs font-bold"
                  >
                    {isCancelling === proc.id ? <Loader2 size={16} className="animate-spin" /> : <BellOff size={16} />}
                    <span>Cancelar Monitoramento</span>
                  </button>

                  <button 
                    onClick={() => navigate(`/processo/${proc.process_number}`)}
                    className="flex items-center gap-2 bg-primary text-deep-indigo px-5 py-2.5 rounded-xl text-sm font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                  >
                    <span>Veja o andamento</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyStateAnimation 
            title="Monitore o andamento do seu processo e receba a atualização no seu Whatsapp."
            description="Você ainda não tem processos em sua lista de monitoramento."
            buttonText="Começar"
            onButtonClick={() => navigate('/monitoramento')}
          />
        )}
      </div>
    </div>
  );
};

export default MyProcesses;