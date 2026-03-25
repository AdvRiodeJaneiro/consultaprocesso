import { useState, useEffect } from 'react';
import { fetchProcessData, fetchProcessesByInvolved, createMonitoring } from '../services/escavadorService';
import { useSearchStore } from '../store/searchStore';
import { useProcessStore } from '../store/processStore';
import { EscavadorProcesso } from '../types';
import { toast } from 'react-hot-toast';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export function useMonitor() {
  const { user, profile } = useAuth();
  const { query: storeQuery, results: storeResults, totalCount: storeTotal, setSearchData } = useSearchStore();
  
  // Inicializa o estado local com o que estiver na Store global
  const [query, setQuery] = useState(storeQuery || '');
  const [results, setResults] = useState<EscavadorProcesso[]>(storeResults || []);
  const [totalCount, setTotalCount] = useState(storeTotal || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedProcess, setSelectedProcess] = useState<EscavadorProcesso | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  
  const addProcess = useProcessStore(state => state.addProcess);

  // Sincroniza o estado local caso a Store mude (ex: transição vinda do Chat)
  useEffect(() => {
    if (storeQuery && storeResults.length > 0) {
      setQuery(storeQuery);
      setResults(storeResults);
      setTotalCount(storeTotal);
    }
  }, [storeQuery, storeResults, storeTotal]);

  const handleSearch = async (overrideQuery?: string): Promise<boolean> => {
    const searchTarget = overrideQuery || query;
    if (!searchTarget.trim()) return false;

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      // Verifica se é um CNJ (apenas números >= 11 dígitos para simplificar)
      const isCNJ = searchTarget.replace(/\D/g, '').length >= 11 && searchTarget.includes('-');
      
      let currentResults: EscavadorProcesso[] = [];
      let currentTotal = 0;
      let type: 'cnj' | 'involved' = 'involved';

      if (isCNJ) {
        type = 'cnj';
        const data = await fetchProcessData(searchTarget);
        if (data) {
          currentResults = [data];
          currentTotal = 1;
        } else {
          setError("Processo não encontrado.");
        }
      } else {
        type = 'involved';
        const data = await fetchProcessesByInvolved(searchTarget);
        if (data && data.items) {
          currentResults = data.items;
          currentTotal = data.total_encontrados;
        } else {
          setError("Nenhum processo encontrado para este envolvido.");
        }
      }

      setResults(currentResults);
      setTotalCount(currentTotal);
      
      // Atualiza a Store Global para persistência entre telas
      setSearchData(searchTarget, currentResults, type, currentTotal);
      return true;

    } catch (err: any) {
      console.error("[Search Error]:", err);
      setError(err.message);
      return false;
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