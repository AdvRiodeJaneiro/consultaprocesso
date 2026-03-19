import { useState } from 'react';
import { fetchProcessData, fetchProcessesByInvolved, createMonitoring } from '../services/escavadorService';
import { useProcessStore } from '../store/processStore';
import { EscavadorProcesso } from '../types';
import { toast } from 'react-hot-toast';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export function useMonitor() {
  const { user, profile } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EscavadorProcesso[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedProcess, setSelectedProcess] = useState<EscavadorProcesso | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  
  const addProcess = useProcessStore(state => state.addProcess);

  const handleSearch = async (overrideQuery?: string) => {
    const searchTarget = overrideQuery || query;
    if (!searchTarget.trim()) return;

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      // Verifica se é um CNJ (apenas números >= 11 dígitos para simplificar)
      const isCNJ = searchTarget.replace(/\D/g, '').length >= 11 && searchTarget.includes('-');
      
      if (isCNJ) {
        const data = await fetchProcessData(searchTarget);
        if (data) {
          setResults([data]);
          setTotalCount(1);
        } else {
          setError("Processo não encontrado.");
        }
      } else {
        const data = await fetchProcessesByInvolved(searchTarget);
        if (data && data.items) {
          setResults(data.items);
          setTotalCount(data.total_encontrados);
        } else {
          setError("Nenhum processo encontrado para este envolvido.");
        }
      }
    } catch (err: any) {
      console.error("[Search Error]:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMonitorClick = (process: EscavadorProcesso) => {
    setSelectedProcess(process);
    setIsConfirmModalOpen(true);
  };

  const confirmMonitoring = async () => {
    if (!user || !profile?.whatsapp || !selectedProcess) {
      toast.error("Verifique sua conexão e dados do WhatsApp.");
      return;
    }

    const toastId = toast.loading("Ativando monitoramento real...");
    try {
      // 1. CRIAR MONITORAMENTO REAL NO ESCAVADOR
      const escavadorRes = await createMonitoring(selectedProcess.numero_cnj);
      
      if (!escavadorRes || !escavadorRes.id) {
          throw new Error("Falha ao registrar monitoramento no tribunal.");
      }

      // 2. SALVAR NO NOSSO BANCO COM O ID REAL
      const { data, error: dbError } = await supabase
        .from('monitored_processes')
        .insert({
          user_id: user.id,
          process_number: selectedProcess.numero_cnj,
          escavador_monitoring_id: escavadorRes.id,
          whatsapp_number: profile.whatsapp,
          title_polo_ativo: selectedProcess.titulo_polo_ativo,
          title_polo_passivo: selectedProcess.titulo_polo_passivo,
          status: escavadorRes.status || 'PENDENTE'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      addProcess(data);
      toast.success("Monitoramento real ativado!", { id: toastId });
      setIsConfirmModalOpen(false);
      setSelectedProcess(null);
    } catch (err: any) {
      console.error("[Monitor Error]:", err);
      toast.error(err.message, { id: toastId });
    }
  };

  return {
    query, setQuery,
    results, setResults,
    totalCount,
    isLoading,
    error, setError,
    selectedProcess,
    isConfirmModalOpen, setIsConfirmModalOpen,
    handleSearch,
    handleMonitorClick,
    confirmMonitoring
  };
}