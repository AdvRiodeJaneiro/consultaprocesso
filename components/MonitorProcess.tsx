"use client";

import React, { useState, useEffect } from 'react';
import { Search, Info, CheckCircle2, AlertCircle, Phone, Bell, ArrowRight, Gavel, Users, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { fetchProcessesByInvolved } from '../services/escavadorService';
import { EscavadorProcesso } from '../types';
import WhatsappModal from './WhatsappModal';
import MonitorConfirmModal from './MonitorConfirmModal';

interface MonitorProcessProps {
  whatsappNumber: string;
  onUpdateWhatsapp: (phone: string) => void;
}

const MonitorProcess: React.FC<MonitorProcessProps> = ({ whatsappNumber, onUpdateWhatsapp }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EscavadorProcesso[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<EscavadorProcesso | null>(null);
  const [monitoringSuccess, setMonitoringSuccess] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setResults([]);
    
    try {
      const data = await fetchProcessesByInvolved(query);
      if (data && data.items) {
        setResults(data.items);
        if (data.items.length === 0) {
          setError("Nenhum processo encontrado para esta busca.");
        }
      } else {
        setError("Nenhum processo encontrado.");
      }
    } catch (err: any) {
      setError("Ocorreu um erro ao buscar os processos. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMonitorClick = (process: EscavadorProcesso) => {
    setSelectedProcess(process);
    setIsConfirmModalOpen(true);
  };

  const confirmMonitoring = () => {
    setIsConfirmModalOpen(false);
    // Em uma aplicação real, aqui chamaríamos uma API para salvar o monitoramento
    setMonitoringSuccess(true);
    setTimeout(() => setMonitoringSuccess(false), 5000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden">
      {/* Header section */}
      <div className="p-8 border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">Monitoramento de Processo</h1>
            <p className="text-slate-400 max-w-lg">
              Receba notificações em tempo real no seu WhatsApp sempre que houver novidades em seus processos.
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Button 
                onClick={() => setIsWhatsappModalOpen(true)}
                className={`group relative overflow-hidden transition-all duration-300 py-6 px-8 rounded-xl ${
                  whatsappNumber 
                    ? 'bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30' 
                    : 'bg-[#dfa968] hover:bg-[#c99557] text-slate-900 font-bold shadow-lg shadow-[#dfa968]/20'
                }`}
            >
               <div className="flex items-center gap-2">
                  {whatsappNumber ? <CheckCircle2 className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                  <span className="font-bold">{whatsappNumber ? 'WhatsApp configurado' : 'Configurar WhatsApp'}</span>
               </div>
            </Button>
            {whatsappNumber && (
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                    Notificações para: <span className="text-slate-300">{whatsappNumber}</span>
                </p>
            )}
            {!whatsappNumber && (
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider animate-pulse">
                    Necessário para receber alertas
                </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-hide">
        <div className="max-w-4xl mx-auto space-y-10 pb-20">
          
          {/* Search Bar */}
          <div className="space-y-4">
            <div className="relative group">
               <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-slate-500 group-focus-within:text-[#dfa968] transition-colors" />
               </div>
               <input 
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Busque por CPF, CNPJ ou Nome da parte..."
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-6 pl-14 pr-36 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#dfa968]/50 focus:border-[#dfa968]/50 transition-all text-lg shadow-inner"
               />
               <div className="absolute inset-y-2.5 right-2.5 flex items-center">
                  <Button 
                    onClick={handleSearch}
                    disabled={isLoading || !query.trim()}
                    className="bg-[#dfa968] hover:bg-[#c99557] text-slate-900 rounded-xl px-8 h-full font-bold shadow-md"
                  >
                     {isLoading ? 'Buscando...' : 'Buscar'}
                  </Button>
               </div>
            </div>
            
            <div className="flex items-center gap-2 px-2">
               <Info className="w-4 h-4 text-slate-500" />
               <p className="text-xs text-slate-500">
                  Dica: Buscas por CPF/CNPJ são mais precisas e retornam resultados diretos.
               </p>
            </div>
          </div>

          {/* Results Area */}
          <div className="space-y-6">
            {monitoringSuccess && (
               <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5 flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 shadow-lg">
                  <div className="bg-green-500 rounded-full p-1 shrink-0 shadow-lg shadow-green-500/30">
                     <CheckCircle2 className="w-4 h-4 text-slate-900" />
                  </div>
                  <p className="text-green-500 font-bold">Monitoramento configurado com sucesso! Você receberá um alerta em breve.</p>
               </div>
            )}

            {isLoading && (
               <div className="flex flex-col items-center justify-center py-24 space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-[#dfa968]/10 border-t-[#dfa968] rounded-full animate-spin"></div>
                    <Search className="w-6 h-6 text-[#dfa968] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-white font-bold tracking-tight">Consultando base de dados</p>
                    <p className="text-slate-500 text-sm">Buscando processos no Escavador...</p>
                  </div>
               </div>
            )}

            {error && !isLoading && (
               <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-10 text-center space-y-4">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto opacity-50" />
                  <div className="space-y-1">
                    <p className="text-red-400 font-bold text-lg">{error}</p>
                    <p className="text-slate-500 text-sm max-w-xs mx-auto">Verifique os dados digitados ou tente buscar por um termo diferente.</p>
                  </div>
                  <button onClick={() => setQuery('')} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs font-bold transition-colors">Limpar busca</button>
               </div>
            )}

            {!isLoading && results.length > 0 && (
               <div className="space-y-5">
                  <div className="flex justify-between items-center px-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Resultados encontrados ({results.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {results.map((proc) => (
                      <div key={proc.numero_cnj} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/60 hover:border-[#dfa968]/30 transition-all group overflow-hidden relative shadow-sm hover:shadow-xl hover:shadow-black/20">
                         <div className="flex flex-col md:flex-row justify-between gap-8">
                            <div className="space-y-6 flex-1">
                               <div className="flex items-center gap-3">
                                  <div className="bg-slate-700/50 p-2 rounded-xl group-hover:bg-[#dfa968]/20 transition-colors">
                                     <Gavel className="w-5 h-5 text-[#dfa968]" />
                                  </div>
                                  <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Número do Processo</p>
                                    <span className="text-lg md:text-xl font-bold text-white font-mono tracking-tight">{proc.numero_cnj}</span>
                                  </div>
                               </div>

                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/30 p-4 rounded-xl border border-slate-800/50">
                                  <div className="space-y-1.5">
                                     <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        Polo Ativo
                                     </div>
                                     <p className="text-sm text-slate-100 font-bold line-clamp-2 leading-relaxed">{proc.titulo_polo_ativo || 'Não identificado'}</p>
                                  </div>
                                  <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-slate-700/50 pt-4 md:pt-0 md:pl-6">
                                     <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                        Polo Passivo
                                     </div>
                                     <p className="text-sm text-slate-100 font-bold line-clamp-2 leading-relaxed">{proc.titulo_polo_passivo || 'Não identificado'}</p>
                                  </div>
                               </div>

                               <div className="flex items-center gap-6 pt-1">
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                     <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                     <span className="text-xs font-medium text-slate-400">Distribuído em: <span className="text-slate-200">{proc.data_inicio}</span></span>
                                  </div>
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[#dfa968]/5 rounded-lg border border-[#dfa968]/20">
                                     <Bell className="w-3.5 h-3.5 text-[#dfa968]" />
                                     <span className="text-xs font-medium text-[#dfa968]">Última mov: <span className="font-bold">{proc.data_ultima_movimentacao}</span></span>
                                  </div>
                               </div>
                            </div>

                            <div className="flex items-center justify-end">
                               <Button 
                                  onClick={() => handleMonitorClick(proc)}
                                  className="w-full md:w-auto bg-slate-800 hover:bg-[#dfa968] hover:text-slate-900 text-slate-200 font-bold rounded-2xl px-8 py-8 transition-all group-hover:shadow-2xl group-hover:shadow-[#dfa968]/10 border border-slate-700/50 hover:border-[#dfa968]/50"
                               >
                                  <div className="flex items-center gap-3">
                                     <span className="text-lg">Quero monitorar</span>
                                     <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                  </div>
                               </Button>
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
               </div>
            )}

            {!isLoading && results.length === 0 && !error && (
               <div className="flex flex-col items-center justify-center py-24 text-center space-y-8 bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-800/50">
                  <div className="relative">
                    <div className="w-32 h-32 bg-slate-800/50 rounded-full flex items-center justify-center border border-slate-700/50 overflow-hidden shadow-inner">
                        <Search className="w-12 h-12 text-slate-600 animate-pulse" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-[#dfa968] p-2 rounded-xl shadow-lg">
                        <Bell className="w-5 h-5 text-slate-900" />
                    </div>
                  </div>
                  <div className="space-y-3 max-w-sm px-4">
                     <h3 className="text-2xl font-bold text-white tracking-tight">Encontre seu processo</h3>
                     <p className="text-slate-400 text-sm leading-relaxed">
                        Busque pelo seu processo para ativar notificações no WhatsApp e ser avisado de qualquer movimentação.
                     </p>
                  </div>
               </div>
            )}
          </div>
        </div>
      </div>

      <WhatsappModal 
         isOpen={isWhatsappModalOpen}
         onClose={() => setIsWhatsappModalOpen(false)}
         onSave={(phone) => {
            onUpdateWhatsapp(phone);
            setIsWhatsappModalOpen(false);
         }}
         initialValue={whatsappNumber}
      />

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
