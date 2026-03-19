import { useState } from 'react';
import { EscavadorProcesso } from '../types';
import { fetchProcessesByInvolved, fetchProcessData, createProcessMonitoring } from '../services/escavadorService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { parseCNJ, formatCNJ } from '../utils/cnjParser';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'react-hot-toast';
import { useProcessStore } from '../store/processStore';
import { useSearchStore } from '../store/searchStore';
import { useLogStore } from '../store/logStore';

export function useMonitor() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const addProcessToStore = useProcessStore(state => state.addProcess);
  const addLog = useLogStore(state => state.addLog);
  
  const query = useSearchStore(state => state.query);
  const results = useSearchStore(state => state.results);
  const totalCount = useSearchStore(state => state.totalCount);
  const setSearchData = useSearchStore(state => state.setSearchData);

  const [localQuery, setLocalQuery] = useState(query);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<EscavadorProcesso | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSearch = async (searchQuery: string = localQuery) => {
    if (!searchQuery.trim()) return false;
    setIsLoading(true);
    setError(null);
    
    try {
      const cnjParts = parseCNJ(searchQuery);
      if (cnjParts) {
        const formattedCNJ = formatCNJ(cnjParts);
        const data = await fetchProcessData(formattedCNJ);
        if (data) {
          setSearchData(searchQuery, [data], 'cnj', 1);
          return true;
        } else {
          setError("Processo não encontrado no Escavador.");
          return false;
        }
      } else {
        const data = await fetchProcessesByInvolved(searchQuery);
        if (data && data.items) {
          setSearchData(searchQuery, data.items, 'involved', data.total_encontrados);
          return data.items.length > 0;
        }
        return false;
      }
    } catch (err: any) {
      setError(err.message);
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
    const loadingToast = toast.loading('Registrando monitoramento no tribunal...');

    try {
      // 1. CHAMADA REAL PARA O ESCAVADOR (POST /monitoramentos/processos)
      addLog("Iniciando requisição POST ao Escavador...", "info", { cnj: selectedProcess.numero_cnj });
      const escavadorRes = await createProcessMonitoring(selectedProcess.numero_cnj);
      
      if (!escavadorRes || !escavadorRes.id) {
          throw new Error("O tribunal não devolveu um ID de monitoramento válido.");
      }

      addLog("Monitoramento criado no Escavador com sucesso!", "success", escavadorRes);

      const waNumber = profile?.whatsapp || "Não Informado";

      // 2. SALVAR NO NOSSO BANCO DE DADOS
      const payload = {
        user_id: user.id,
        escavador_monitoring_id: escavadorRes.id, // ID REAL AQUI
        process_number: selectedProcess.numero_cnj,
        whatsapp_number: waNumber,
        status: 'PENDENTE',
        last_movement_summary: 'Aguardando primeira sincronização...',
        title_polo_ativo: selectedProcess.titulo_polo_ativo,
        title_polo_passivo: selectedProcess.titulo_polo_passivo
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
      toast.success('Monitoramento Ativado! Você receberá o aviso no WhatsApp em breve.');
      setIsConfirmModalOpen(false);
      
      setTimeout(() => navigate('/meus-processos'), 500);

    } catch (err: any) {
      addLog("Falha ao ativar monitoramento", "error", err);
      toast.dismiss(loadingToast);
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    query: localQuery, 
    setQuery: setLocalQuery, 
    results, 
    totalCount,
    isLoading, 
    error,
    setError,
    isConfirmModalOpen, 
    setIsConfirmModalOpen,
    selectedProcess, 
    handleMonitorClick: (p: EscavadorProcesso) => {
      if (!user) { navigate('/auth'); return; }
      setSelectedProcess(p);
      setIsConfirmModalOpen(true);
    },
    confirmMonitoring
  };
}