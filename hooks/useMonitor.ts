import { useState } from 'react';
import { EscavadorProcesso } from '../types';
import { fetchProcessesByInvolved, fetchProcessData } from '../services/escavadorService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { parseCNJ, formatCNJ } from '../utils/cnjParser';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'react-hot-toast';

export function useMonitor() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EscavadorProcesso[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<EscavadorProcesso | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return false;
    setIsLoading(true);
    setError(null);
    setResults([]);
    
    try {
      const cnjParts = parseCNJ(query);
      if (cnjParts) {
        const formattedCNJ = formatCNJ(cnjParts);
        const data = await fetchProcessData(formattedCNJ);
        if (data) {
          setResults([data]);
          return true;
        } else {
          setError("Processo não encontrado no Escavador.");
          return false;
        }
      } else {
        const data = await fetchProcessesByInvolved(query);
        if (data && data.items) {
          setResults(data.items);
          if (data.items.length === 0) setError("Nenhum processo encontrado.");
          return data.items.length > 0;
        }
        return false;
      }
    } catch (err) {
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
      
      // WhatsApp é obrigatório na tabela, se não tiver no perfil, usamos um placeholder
      const waNumber = profile?.whatsapp || "Não Informado";

      const { data, error: dbError } = await supabase
        .from('monitored_processes')
        .insert([{
          user_id: user.id,
          escavador_monitoring_id: mockEscavadorId,
          process_number: selectedProcess.numero_cnj,
          whatsapp_number: waNumber,
          status: 'PENDENTE',
          last_movement_summary: 'Aguardando sincronização com o tribunal...'
        }])
        .select();

      if (dbError) {
        console.error("Erro Supabase:", dbError);
        throw new Error(dbError.message);
      }

      toast.dismiss(loadingToast);
      toast.success('Monitoramento iniciado com sucesso!');
      
      setIsConfirmModalOpen(false);
      
      // Pequeno delay para garantir que o toast apareça antes de mudar de página
      setTimeout(() => {
        navigate('/meus-processos');
      }, 500);

    } catch (err: any) {
      toast.dismiss(loadingToast);
      console.error("Erro ao salvar:", err);
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