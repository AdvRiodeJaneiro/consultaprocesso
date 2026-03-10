import { useState } from 'react';
import { EscavadorProcesso } from '../types';
import { fetchProcessesByInvolved, fetchProcessData } from '../services/escavadorService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { parseCNJ, formatCNJ } from '../utils/cnjParser';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'react-hot-toast';
import { useProcessStore } from '../store/processStore';

export function useMonitor() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EscavadorProcesso[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const addProcessToStore = useProcessStore(state => state.addProcess);
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<EscavadorProcesso | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const logDebug = (message: string, type: 'info' | 'error' | 'success' = 'info', data?: any) => {
    if ((window as any).addDebugLog) {
      (window as any).addDebugLog({ message, type, data });
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return false;
    setIsLoading(true);
    setError(null);
    setResults([]);
    logDebug(`Iniciando busca para: ${query}`);
    
    try {
      const cnjParts = parseCNJ(query);
      if (cnjParts) {
        const formattedCNJ = formatCNJ(cnjParts);
        logDebug(`CNJ Detectado: ${formattedCNJ}`);
        const data = await fetchProcessData(formattedCNJ);
        if (data) {
          logDebug(`Processo encontrado!`, 'success', data);
          setResults([data]);
          return true;
        } else {
          logDebug(`Processo não encontrado no Escavador`, 'error');
          setError("Processo não encontrado no Escavador.");
          return false;
        }
      } else {
        logDebug(`Busca por Envolvido iniciada...`);
        const data = await fetchProcessesByInvolved(query);
        if (data && data.items) {
          logDebug(`Busca finalizada: ${data.items.length} resultados`, 'success');
          setResults(data.items);
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
    logDebug(`Iniciando fluxo de persistência no Supabase...`);

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

      logDebug(`Payload de inserção preparado`, 'info', payload);

      const { data, error: dbError } = await supabase
        .from('monitored_processes')
        .insert([payload])
        .select();

      if (dbError) {
        logDebug(`ERRO SUPABASE: ${dbError.message}`, 'error', dbError);
        throw new Error(dbError.message);
      }

      logDebug(`Persistência concluída com sucesso!`, 'success', data);
      
      // ATUALIZAÇÃO DO CACHE: Injetamos o novo processo na store global imediatamente
      if (data && data[0]) {
        addProcessToStore(data[0]);
        logDebug(`Cache local (Zustand) atualizado com sucesso!`, 'success');
      }

      toast.dismiss(loadingToast);
      toast.success('Monitoramento iniciado com sucesso!');
      
      setIsConfirmModalOpen(false);
      
      // Redireciona para a lista que agora já terá o item na memória
      setTimeout(() => {
        navigate('/meus-processos');
      }, 500);

    } catch (err: any) {
      toast.dismiss(loadingToast);
      logDebug(`Falha crítica ao salvar: ${err.message}`, 'error', err);
      toast.error('Erro ao salvar: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsSaving(false);
    }
  };

  return {
    query, setQuery, results, setResults, isLoading, error,
    isConfirmModalOpen, setIsConfirmModalOpen,
    selectedProcess, setSelectedProcess, isSaving,
    handleSearch,
    handleMonitorClick: (p: EscavadorProcesso) => {
      if (!user) { navigate('/auth'); return; }
      setSelectedProcess(p);
      setIsConfirmModalOpen(true);
    },
    confirmMonitoring
  };
}