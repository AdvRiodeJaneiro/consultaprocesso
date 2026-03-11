"use client";

import React, { useEffect, useState } from 'react';
import { AlertCircle, Gavel, Eye, Bell, Search, RefreshCcw, X, Check, History, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MonitorConfirmModal from './MonitorConfirmModal';
import LimitModal from './LimitModal';
import SearchBar from './SearchBar';
import { HistorySidebar } from './HistorySidebar';
import { ToastAlert } from './ui/ToastAlert';
import { useMonitor } from '../hooks/useMonitor';
import { useSearchLimit } from '../hooks/useSearchLimit';
import { useSearchHistory, SearchEntry } from '../hooks/useSearchHistory';
import { useMyProcesses } from '../hooks/useMyProcesses';
import { cn } from '../lib/utils';

interface MonitorProcessProps {
  whatsappNumber: string;
  onUpdateWhatsapp: (phone: string) => void;
}

const MonitorProcess: React.FC<MonitorProcessProps> = ({ whatsappNumber, onUpdateWhatsapp }) => {
  const navigate = useNavigate();
  const {
    query,
    setQuery,
    results,
    setResults,
    isLoading,
    error,
    setError,
    isConfirmModalOpen,
    setIsConfirmModalOpen,
    selectedProcess,
    handleSearch,
    handleMonitorClick,
    confirmMonitoring
  } = useMonitor();

  const { isLimitReached, incrementSearch, checkLimitBeforeSearch } = useSearchLimit();
  const { history, addToHistory, deleteEntry, clearHistory } = useSearchHistory();
  const { processes } = useMyProcesses();
  
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showAlreadyMonitoredAlert, setShowAlreadyMonitoredAlert] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('todos');

  const monitoredNumbers = processes.map(p => p.process_number);

  const onSearchSubmit = async () => {
    if (!checkLimitBeforeSearch()) {
      setShowLimitModal(true);
      return;
    }
    setActiveFilter('todos'); 
    await handleSearch();
  };

  useEffect(() => {
    if (results.length > 0 && query.trim() && !isLoading) {
      const type = query.replace(/[^\d]/g, '').length >= 11 ? 'cnj' : 'involved';
      addToHistory(query, type, results.length);
      incrementSearch();
    }
  }, [results, isLoading]);

  const handleEntrySelect = (entry: SearchEntry) => {
    setQuery(entry.query);
    setActiveFilter(entry.query); 
    handleSearch(entry.query);
  };

  // Função que realmente limpa tudo
  const resetAll = () => {
    setActiveFilter('todos');
    setQuery('');
    setResults([]);
    setError(null);
  };

  const recentTags = history.slice(0, 3);

  return (
    <div className="flex-1 flex flex-col h-full bg-background dark:bg-background-dark overflow-y-auto scrollbar-hide">
      <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
        <div className="mb-8 md:mb-10 flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-deep-indigo dark:text-white tracking-tight">Monitoramento de Processo</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm md:text-lg font-medium">Busque e escolha o processo para receber atualizações no Whatsapp</p>
          </div>
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-xs font-black text-deep-indigo dark:text-white shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <History size={16} className="text-primary" />
            Histórico de buscas
          </button>
        </div>

        <div className="space-y-6 mb-10">
            <SearchBar 
              value={query}
              onChange={setQuery}
              onSearch={onSearchSubmit}
              isLoading={isLoading}
              placeholder="Busque por CPF, CNPJ, Nome ou Número do Processo"
            />

            <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
                <button
                    onClick={resetAll}
                    className={cn(
                        "whitespace-nowrap flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all border shadow-sm",
                        activeFilter === 'todos' 
                          ? 'bg-deep-indigo text-white border-deep-indigo dark:bg-white dark:text-deep-indigo dark:border-white shadow-lg' 
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300'
                    )}
                >
                    Todos
                </button>
                
                {recentTags.map((entry, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleEntrySelect(entry)}
                        className={cn(
                            "whitespace-nowrap flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all border shadow-sm",
                            activeFilter === entry.query 
                                ? 'bg-deep-indigo text-white border-deep-indigo dark:bg-white dark:text-deep-indigo dark:border-white shadow-lg' 
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300'
                        )}
                    >
                        {entry.query}
                    </button>
                ))}
            </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-500 font-bold">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {(results.length > 0 || isLoading) && (
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg md:text-xl font-black text-deep-indigo dark:text-white">
              {isLoading ? 'Buscando processos...' : 'Resultados Encontrados'}
            </h3>
            {!isLoading && (
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {results.length} Encontrados
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
          {results.map((proc) => {
            const isMonitored = monitoredNumbers.includes(proc.numero_cnj);
            return (
              <div key={proc.numero_cnj} className="bg-white dark:bg-slate-900 rounded-2xl border-l-4 border-accent-gold shadow-sm hover:shadow-xl transition-all p-6 flex flex-col justify-between group">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3 min-w-0">
                      <div className="mt-1 text-accent-gold group-hover:scale-110 transition-transform shrink-0">
                        <Gavel size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Número do Processo</p>
                        <h4 className="text-base md:text-lg font-bold text-deep-indigo dark:text-white break-all">{proc.numero_cnj}</h4>
                      </div>
                    </div>
                    <span className="bg-accent-gold/10 text-accent-gold text-[10px] font-black px-2 py-1 rounded-md uppercase shrink-0">
                      {proc.fontes?.[0]?.sigla || 'CNJ'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Polo Ativo</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 line-clamp-2">{proc.titulo_polo_ativo || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Polo Passivo</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 line-clamp-2">{proc.titulo_polo_passivo || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-[10px] text-slate-400 italic">
                    Última mov: {proc.data_ultima_movimentacao}
                  </span>
                  
                  {isMonitored ? (
                    <button 
                      onClick={() => setShowAlreadyMonitoredAlert(true)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-400 px-4 py-2 rounded-lg text-sm font-bold cursor-default shrink-0"
                    >
                      <Check size={16} />
                      <span>Monitorando...</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleMonitorClick(proc)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-deep-indigo dark:bg-primary text-white dark:text-deep-indigo px-5 py-2.5 rounded-xl text-sm font-black hover:opacity-90 transition-all shadow-md active:scale-95"
                    >
                      <Eye size={16} />
                      <span>Quero monitorar</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {results.length >= 10 && !isLoading && (
          <div className="flex justify-center pb-20">
             <button className="flex items-center gap-2 px-8 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-black text-deep-indigo dark:text-white hover:bg-slate-50 transition-all shadow-sm">
                Carregar mais processos
                <ChevronDown size={18} className="text-primary" />
             </button>
          </div>
        )}

        {!isLoading && results.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-6 shadow-inner">
              <Search size={40} className="animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-deep-indigo dark:text-white">Inicie uma nova busca</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm font-medium">Busque por Nome, CPF ou CNPJ para localizar seus processos e ativar o monitoramento.</p>
          </div>
        )}
      </div>

      <HistorySidebar 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelect={handleEntrySelect}
        onDeleteEntry={deleteEntry}
        onClear={clearHistory}
      />

      <MonitorConfirmModal 
         isOpen={isConfirmModalOpen}
         onClose={() => setIsConfirmModalOpen(false)}
         onConfirm={confirmMonitoring}
         process={selectedProcess}
      />

      <LimitModal 
        isOpen={showLimitModal} 
        onClose={() => setShowLimitModal(false)} 
      />

      <ToastAlert 
        isOpen={showAlreadyMonitoredAlert}
        onClose={() => setShowAlreadyMonitoredAlert(false)}
        title="Esse processo já está sendo monitorado. Deseja ir para a tela de processos monitorados?"
        actionLabel="Sim"
        onAction={() => navigate('/meus-processos')}
      />
    </div>
  );
};

export default MonitorProcess;