import { useState } from 'react';
import { fetchProcessData, createMonitoring } from '../services/escavadorService';
import { useProcessStore } from '../store/processStore';
import { EscavadorProcesso } from '../types';
import { toast } from 'react-hot-toast';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export function useMonitor(onUpdateWhatsapp: (phone: string) => void) {
  const { user, profile } = useAuth();
  const [cnj, setCnj] = useState('');
  const [loading, setLoading] = useState(false);
  const [processData, setProcessData] = useState<EscavadorProcesso | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const addProcess = useProcessStore(state => state.addProcess);

  const handleSearch = async () => {
    if (!cnj.trim()) return;
    setLoading(true);
    try {
      const data = await fetchProcessData(cnj);
      if (data) setProcessData(data);
      else toast.error("Processo não encontrado.");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const startMonitoring = async () => {
    if (!user || !profile?.whatsapp || !processData) {
      toast.error("Verifique seus dados e o número do processo.");
      return;
    }

    setIsMonitoring(true);
    try {
      // 1. CRIAR MONITORAMENTO REAL NO ESCAVADOR
      const escavadorRes = await createMonitoring(processData.numero_cnj);
      
      if (!escavadorRes || !escavadorRes.id) {
          throw new Error("Falha ao registrar monitoramento no tribunal.");
      }

      // 2. SALVAR NO NOSSO BANCO COM O ID REAL
      const { data, error } = await supabase
        .from('monitored_processes')
        .insert({
          user_id: user.id,
          process_number: processData.numero_cnj,
          escavador_monitoring_id: escavadorRes.id, // ID REAL DA API
          whatsapp_number: profile.whatsapp,
          title_polo_ativo: processData.titulo_polo_ativo,
          title_polo_passivo: processData.titulo_polo_passivo,
          status: escavadorRes.status || 'PENDENTE'
        })
        .select()
        .single();

      if (error) throw error;

      addProcess(data);
      toast.success("Monitoramento real ativado com sucesso!");
      setShowConfirmModal(false);
      setProcessData(null);
      setCnj('');
    } catch (error: any) {
      toast.error(error.message || "Erro ao iniciar monitoramento.");
      console.error(error);
    } finally {
      setIsMonitoring(false);
    }
  };

  return {
    cnj, setCnj,
    loading,
    processData, setProcessData,
    showConfirmModal, setShowConfirmModal,
    isMonitoring,
    handleSearch,
    startMonitoring,
    user,
    profile
  };
}