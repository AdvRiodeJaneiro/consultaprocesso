import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

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
}

export function useMyProcesses() {
  const [processes, setProcesses] = useState<MonitoredProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  const fetchProcesses = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('monitored_processes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProcesses(data || []);
    } catch (err: any) {
      console.error("Erro ao buscar processos:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchProcesses();
    }
  }, [user, authLoading, fetchProcesses]);

  const cancelMonitoring = async (id: string, escavadorId: number) => {
    try {
      const { error: dbError } = await supabase
        .from('monitored_processes')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;
      
      setProcesses(prev => prev.filter(p => p.id !== id));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    processes,
    loading,
    error,
    refresh: fetchProcesses,
    cancelMonitoring
  };
}