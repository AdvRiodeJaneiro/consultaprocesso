"use client";

import React from 'react';
import { AlertCircle, Gavel, Eye, Bell, Search } from 'lucide-react';
import MonitorConfirmModal from './MonitorConfirmModal';
import SearchBar from './SearchBar';
import { useMonitor } from '../hooks/useMonitor';

interface MonitorProcessProps {
  whatsappNumber: string;
  onUpdateWhatsapp: (phone: string) => void;
}

const MonitorProcess: React.FC<MonitorProcessProps> = ({ whatsappNumber, onUpdateWhatsapp }) => {
  const {
    query,
    setQuery,
    results,
    isLoading,
    error,
    isConfirmModalOpen,
    setIsConfirmModalOpen,
    selectedProcess,
    monitoringSuccess,
    handleSearch,
    handleMonitorClick,
    confirmMonitoring
  } = useMonitor();

  return (
    <div className="flex-1 flex flex-col h-full bg-background dark:bg-background-dark overflow-y-auto">
      <div className="p-8 max-w-6xl mx-auto w-full">
        {/* Title Section */}
        <div className="mb-10">
          <h2 className="text-3xl font-black text-deep-indigo dark:text-white tracking-tight">Monitoramento de Processo</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Acompanhe seus processos em tempo real com notificações automáticas.</p>
        </div>

        {/* Search Section */}
        <SearchBar 
          value={query}
          onChange={setQuery}
          onSearch={handleSearch}
          isLoading={isLoading}
          className="mb-10"
          placeholder="Busque por CPF, CNPJ, Nome ou Número do Processo"
        />

        {/* Status Messages */}
        {monitoringSuccess && (
          <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3 text-green-600 font-bold animate-in slide-in-from-top-2">
            <Bell size={18} /> Monitoramento configurado com sucesso!
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-500 font-bold">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {/* Results Info */}
        {(results.length > 0 || isLoading) && (
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-bold text-deep-indigo dark:text-white">
              {isLoading ? 'Buscando...' : 'Resultados Encontrados'}
            </h3>
            {!isLoading && results.length > 0 && (
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-500 uppercase tracking-tighter">
                {results.length} Processos encontrados
              </span>
            )}
          </div>
        )}

        {/* Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
          {results.map((proc) => (
            <div key={proc.numero_cnj} className="bg-white dark:bg-slate-900 rounded-2xl border-l-4 border-accent-gold shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col justify-between group">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3">
                    <div className="mt-1 text-accent-gold group-hover:scale-110 transition-transform">
                      <Gavel size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Número do Processo</p>
                      <h4 className="text-lg font-bold text-deep-indigo dark:text-white break-all">{proc.numero_cnj}</h4>
                    </div>
                  </div>
                  <span className="bg-accent-gold/10 text-accent-gold text-[10px] font-black px-2 py-1 rounded-md uppercase shrink-0">
                    {proc.fontes?.[0]?.sigla || 'CNJ'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
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
              <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between gap-4">
                <span className="text-[10px] text-slate-400 italic">
                  Última mov: {proc.data_ultima_movimentacao}
                </span>
                <button 
                  onClick={() => handleMonitorClick(proc)}
                  className="flex items-center gap-2 bg-deep-indigo dark:bg-primary text-white dark:text-deep-indigo px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-all shrink-0"
                >
                  <Eye size={16} />
                  <span>Quero monitorar</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {!isLoading && results.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-6 shadow-inner">
              <Search size={40} className="animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-deep-indigo dark:text-white">Inicie uma nova busca</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">Busque pelo seu processo para ativar notificações no WhatsApp e ser avisado de qualquer movimentação.</p>
          </div>
        )}
      </div>

      <MonitorConfirmModal 
         isOpen={isConfirmModalOpen}
         onClose={() => setIsConfirmModalOpen(false)}
         onConfirm={confirmMonitoring}
         process={selectedProcess}
      />
    </div>
  );
};

export default MonitorProcess;