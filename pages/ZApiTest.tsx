"use client";

import React, { useState } from 'react';
import { useZApiStore } from '../integrations/zapi/store';
import { useAuth } from '../contexts/AuthContext';
import { checkZApiStatus, sendZApiText } from '../integrations/zapi/service';
import { listActiveMonitorings } from '../services/escavadorService';
import { 
  Settings, Send, Activity, Trash2, Terminal, CheckCircle2, 
  AlertCircle, Smartphone, Info, Gavel, Search, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export default function ZApiTest() {
  const { profile } = useAuth();
  const { credentials, setCredentials, logs, clearLogs } = useZApiStore();
  
  const [testMessage, setTestMessage] = useState("Olá! Este é um teste do sistema *Consulta Processo IA* via Z-API. 🤪");
  const [isLoading, setIsLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<any>(null);
  const [escavadorMonitorings, setEscavadorMonitorings] = useState<any[]>([]);

  const handleUpdateCreds = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ [e.target.name]: e.target.value });
  };

  const onCheckStatus = async () => {
    setIsLoading(true);
    try {
      const res = await checkZApiStatus();
      setStatusResult(res);
      if (res.connected) toast.success("WhatsApp conectado!");
    } catch (err) { toast.error("Erro no status WA."); }
    finally { setIsLoading(false); }
  };

  const onFetchEscavador = async () => {
      setIsLoading(true);
      try {
          const res = await listActiveMonitorings();
          if (res && res.items) {
              setEscavadorMonitorings(res.items);
              toast.success(`${res.items.length} monitoramentos ativos na API!`);
          } else {
              setEscavadorMonitorings([]);
              toast.error("Nenhum monitoramento encontrado na API.");
          }
      } catch (err: any) {
          toast.error("Erro ao ler API do Escavador.");
      } finally { setIsLoading(false); }
  };

  const onSendTest = async () => {
    if (!profile?.whatsapp) { toast.error("WhatsApp não configurado."); return; }
    setIsLoading(true);
    try {
      await sendZApiText(profile.whatsapp, testMessage);
      toast.success("Mensagem enviada!");
    } catch (err) { toast.error("Erro no envio."); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-4 md:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        
        <div>
          <h2 className="text-3xl font-black text-deep-indigo dark:text-white">Painel de Diagnóstico</h2>
          <p className="text-slate-500 font-medium">Verifique em tempo real o status das integrações (Z-API & Escavador).</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* ESCAVADOR DIAGNOSIS */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Gavel size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-deep-indigo dark:text-white">Status Escavador</h3>
                </div>
                <button 
                    onClick={onFetchEscavador}
                    disabled={isLoading}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-all"
                >
                    <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                </button>
              </div>

              <div className="flex-1 min-h-[200px] border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col p-4">
                  {escavadorMonitorings.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                          <Search size={32} className="mb-2" />
                          <p className="text-xs font-bold">Clique para ler monitoramentos ativos na API</p>
                      </div>
                  ) : (
                      <div className="space-y-3">
                          {escavadorMonitorings.map((m, i) => (
                              <div key={i} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                  <div className="min-w-0">
                                      <p className="text-[10px] font-black text-primary uppercase">ID: {m.id}</p>
                                      <p className="text-xs font-bold text-deep-indigo dark:text-white truncate">{m.valor}</p>
                                  </div>
                                  <div className="flex flex-col items-end shrink-0">
                                      <span className="text-[9px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">ATIVO</span>
                                      <span className="text-[9px] text-slate-400">{m.frequencia}</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>

          {/* WHATSAPP (Z-API) DIAGNOSIS */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                  <Smartphone size={20} />
                </div>
                <h3 className="text-lg font-bold text-deep-indigo dark:text-white">WhatsApp (Z-API)</h3>
              </div>
              
              <div className="space-y-3">
                  <button onClick={onCheckStatus} className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">
                      <Activity size={14} /> Verificar Conexão Instance
                  </button>
                  <button onClick={onSendTest} className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-deep-indigo rounded-xl text-xs font-black shadow-md">
                      <Send size={14} /> Enviar Mensagem de Teste
                  </button>
              </div>

              {statusResult && (
                <div className={cn("mt-4 p-3 rounded-xl border flex items-center gap-3 text-xs", statusResult.connected ? "bg-green-50 border-green-100 text-green-700" : "bg-red-50 border-red-100 text-red-700")}>
                  {statusResult.connected ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <p className="font-bold">{statusResult.connected ? "WhatsApp Conectado" : "Desconectado"}</p>
                </div>
              )}
          </div>
        </div>

        {/* LOG CONSOLE */}
        <div className="bg-slate-950 rounded-[32px] overflow-hidden border border-slate-800 flex flex-col h-[300px]">
          <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
              <Terminal size={14} /> <span>Logs do Console em Tempo Real</span>
            </div>
            <button onClick={clearLogs} className="p-2 text-slate-500 hover:text-red-400"><Trash2 size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 font-mono text-[10px] space-y-3 scrollbar-hide">
             {logs.length === 0 ? <p className="text-center text-slate-800 mt-20">Aguardando atividades...</p> : logs.map((log, i) => (
                <div key={i} className={cn("p-2 rounded border-l-2", log.status === 'success' ? "border-green-500 bg-green-500/5 text-slate-300" : "border-red-500 bg-red-500/5 text-red-300")}>
                    <div className="flex justify-between opacity-50 mb-1">
                        <span>{log.method} {log.endpoint}</span>
                        <span>{log.timestamp}</span>
                    </div>
                    <pre className="overflow-x-auto">{JSON.stringify(log.responseBody, null, 2)}</pre>
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}