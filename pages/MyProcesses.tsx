"use client";

import React, { useEffect, useState } from 'react';
import { Search, Gavel, Calendar, Trash2, ChevronRight, BellOff, Loader2, Bug, Scan, Activity } from 'lucide-react';
import { useMyProcesses, MonitoredProcess } from '../hooks/useMyProcesses';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { EmptyStateAnimation } from '../components/EmptyStateAnimation';
import { motion, AnimatePresence } from 'framer-motion';

const MyProcesses: React.FC = () => {
  const { processes, loading, cancelMonitoring } = useMyProcesses();
  const { user, loading: authLoading } = useAuth();
  const [search, setSearch] = useState('');
  const [isCancelling, setIsCancelling] = useState<string | null>(null);
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

  if (authLoading) return <div className="flex-1 flex items-center justify-center h-full"><Loader2 className="animate-spin text-primary" /></div>;

  if (!user) {
    return (
      <div className="flex-1 bg-background dark:bg-background-dark p-8">
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
    <div className="flex-1 bg-background dark:bg-background-dark p-8 overflow-y-auto scrollbar-hide">
      <div className="max-w-6xl mx-auto w-full">
        {/* Title Section */}
        <div className="mb-10">
          <h2 className="text-3xl font-black text-deep-indigo dark:text-white tracking-tight">Meus Processos</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Gerencie os processos que você está monitorando no momento.</p>
        </div>

        {/* Search Bar */}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
            {[1,2,3,4].map(i => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 animate-pulse">
                    <div className="flex gap-4 mb-6">
                        <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800" />
                        <div className="flex-1 space-y-2 py-1">
                            <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded" />
                            <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded" />
                        </div>
                    </div>
                    <div className="h-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-6" />
                    <div className="flex justify-between items-center pt-4 border-t border-slate-50 dark:border-slate-800">
                        <div className="w-20 h-8 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                        <div className="w-32 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                    </div>
                </div>
            ))}
          </div>
        ) : filteredProcesses.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
            {filteredProcesses.map((proc) => {
              const isPendente = proc.status === 'PENDENTE';
              return (
                <motion.div 
                  layout
                  key={proc.id} 
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all p-6 flex flex-col justify-between group overflow-hidden relative"
                >
                  
                  {/* Status Badge */}
                  <div className={`absolute top-0 right-0 px-4 py-1.5 text-[10px] font-black rounded-bl-2xl uppercase flex items-center gap-1.5 ${isPendente ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}>
                    <Activity size={10} className={isPendente ? 'animate-pulse' : ''} />
                    {isPendente ? 'NOVO' : proc.status}
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-4">
                        <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                          <Gavel size={24} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Número CNJ</p>
                          <h4 className="text-lg font-bold text-deep-indigo dark:text-white truncate">{proc.process_number}</h4>
                        </div>
                      </div>
                    </div>

                    {/* Scanner Animation Section */}
                    <div className="mb-4 bg-slate-900 rounded-2xl p-4 border border-slate-800 relative overflow-hidden group/scanner">
                       <div className="flex items-center gap-3 relative z-10">
                          <div className="size-8 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                             <Scan size={18} className="animate-pulse" />
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-primary uppercase tracking-widest">Em Monitoramento</p>
                             <p className="text-xs text-slate-400 font-medium">Fique tranquilo. Estamos monitorando esse processo e as movimentações vão ser enviadas no seu Whatsapp.</p>
                          </div>
                       </div>
                       
                       {/* Scanner Line Effect */}
                       <motion.div 
                         animate={{ left: ['-10%', '110%'] }}
                         transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                         className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-primary/50 to-transparent shadow-[0_0_15px_rgba(223,184,42,0.5)] z-0"
                       />
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
                      <span>Cancelar</span>
                    </button>

                    <button 
                      onClick={() => navigate(`/processo/${proc.process_number}`)}
                      className="flex items-center gap-2 bg-primary text-deep-indigo px-5 py-2.5 rounded-xl text-sm font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                    >
                      <span>Detalhes</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
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