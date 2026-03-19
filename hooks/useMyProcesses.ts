import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useProcessStore } from '../store/processStore';
import { deleteMonitoring } from '../services/escavadorService';

export interface MonitoredProcess {
  id: string;
  escavador_monitoring_id: number;
  process_number: string;
  whatsapp_number: string;
  status: string;
  last_movement_summary?: string;
  last_movement_date?: string;
  created_at: string;
  debug_logs?: string;
  title_polo_ativo?: string;
  title_polo_passivo?: string;
}

export function useMyProcesses() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Zustand Store
  const { 
    myProcesses, 
    hasLoadedOnce, 
    setProcesses, 
    removeProcess, 
    setHasLoaded 
  } = useProcessStore();

  const fetchProcesses = useCallback(async (force = false) => {
    // Se já carregamos uma vez e não é um force refresh, não faz nada (Cache Hit)
    if (hasLoadedOnce && !force) return;
    if (!user) return;
    
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('monitored_processes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setProcesses(data || []);
      setHasLoaded(true);
    } catch (err: any) {
      console.error("Erro ao buscar processos:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, hasLoadedOnce, setProcesses, setHasLoaded]);

  useEffect(() => {
    if (user && !hasLoadedOnce) {
      fetchProcesses();
    }
  }, [user, hasLoadedOnce, fetchProcesses]);

  const cancelMonitoring = async (id: string, escavadorId: number) => {
    try {
      // 1. Chamar API do Escavador para parar o monitoramento real
      await deleteMonitoring(escavadorId);

      // 2. Remover do nosso banco de dados
      const { error: dbError } = await supabase
        .from('monitored_processes')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;
      
      // Atualiza o cache local imediatamente
      removeProcess(id);
      return { success: true };
    } catch (err: any) {
      console.error("[cancelMonitoring] Erro:", err);
      return { success: false, error: err.message };
    }
  };

  return {
    processes: myProcesses,
    loading: loading && !hasLoadedOnce, // Só mostra loading na primeira vez
    isRefreshing: loading, // Para spinners de background se necessário
    error,
    refresh: () => fetchProcesses(true),
    cancelMonitoring
  };
}