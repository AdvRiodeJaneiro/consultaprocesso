import { useState } from 'react';
import { EscavadorProcesso } from '../types';
import { fetchProcessesByInvolved, fetchProcessData } from '../services/escavadorService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { parseCNJ, formatCNJ } from '../utils/cnjParser';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'react-hot-toast';
import { useProcessStore } from '../store/processStore';
import { useSearchStore } from '../store/searchStore';

export function useMonitor() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const addProcessToStore = useProcessStore(state => state.addProcess);
  
  // Seletores individuais para estabilidade
  const query = useSearchStore(state => state.query);
  const results = useSearchStore(state => state.results);
  const setSearchData = useSearchStore(state => state.setSearchData);
  const setResults = useSearchStore(state => state.setResults);

  const [localQuery, setLocalQuery] = useState(query);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<EscavadorProcesso | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const logDebug = (message: string, type: 'info' | 'error' | 'success' = 'info', data?: any) => {
    if ((window as any).addDebugLog) {
      (window as any).addDebugLog({ message, type, data });
    }
  };

  const handleSearch = async (searchQuery: string = localQuery) => {
    if (!searchQuery.trim()) return false;
    setIsLoading(true);
    setError(null);
    logDebug(`Iniciando busca para: ${searchQuery}`);
    
    try {
      const cnjParts = parseCNJ(searchQuery);
      if (cnjParts) {
        const formattedCNJ = formatCNJ(cnjParts);
        logDebug(`CNJ Detectado: ${formattedCNJ}`);
        const data = await fetchProcessData(formattedCNJ);
        if (data) {
          logDebug(`Processo encontrado!`, 'success', data);
          setSearchData(searchQuery, [data], 'cnj');
          return true;
        } else {
          setError("Processo não encontrado no Escavador.");
          return false;
        }
      } else {
        logDebug(`Busca por Envolvido iniciada...`);
        const data = await fetchProcessesByInvolved(searchQuery);
        if (data && data.items) {
          logDebug(`Busca finalizada: ${data.items.length} resultados`, 'success');
          setSearchData(searchQuery, data.items, 'involved');
          if (data.items.length === 0) setError("Nenhum processo encontrado.");
          return data.items.length > 0;
        }
        return false;
      }
    } catch (err: any) {
      logDebug(`Erro na busca: ${err.message}`, 'error', err);
      setError("Erro na busca técnica.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const confirmMonitoring = async () => {
    if (!selectedProcess || !user) {
      toast.error("Você precisa estar logado para monitorar.");
      return;
    }

    setIsSaving(true);
    const loadingToast = toast.loading('Iniciando monitoramento...');

    try {
      const mockEscavadorId = Math.floor(Math.random() * 1000000);
      const waNumber = profile?.whatsapp || "Não Informado";

      const payload = {
        user_id: user.id,
        escavador_monitoring_id: mockEscavadorId,
        process_number: selectedProcess.numero_cnj,
        whatsapp_number: waNumber,
        status: 'PENDENTE',
        last_movement_summary: 'Aguardando sincronização com o tribunal...'
      };

      const { data, error: dbError } = await supabase
        .from('monitored_processes')
        .insert([payload])
        .select();

      if (dbError) throw new Error(dbError.message);

      if (data && data[0]) {
        addProcessToStore(data[0]);
      }

      toast.dismiss(loadingToast);
      toast.success('Monitoramento iniciado com sucesso!');
      setIsConfirmModalOpen(false);
      
      setTimeout(() => {
        navigate('/meus-processos');
      }, 500);

    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error('Erro ao salvar: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsSaving(false);
    }
  };

  return {
    query: localQuery, 
    setQuery: setLocalQuery, 
    results, 
    isLoading, 
    error,
    setError,
    setResults,
    isConfirmModalOpen, 
    setIsConfirmModalOpen,
    selectedProcess, 
    setSelectedProcess, 
    isSaving,
    handleSearch,
    handleMonitorClick: (p: EscavadorProcesso) => {
      if (!user) { navigate('/auth'); return; }
      setSelectedProcess(p);
      setIsConfirmModalOpen(true);
    },
    confirmMonitoring
  };
}