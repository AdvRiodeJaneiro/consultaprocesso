
import { useState, useEffect } from 'react';
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
}

export function useMyProcesses() {
  const [processes, setProcesses] = useState<MonitoredProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchProcesses = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('monitored_processes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProcesses(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
  }, [user]);

  const cancelMonitoring = async (id: string, escavadorId: number) => {
    try {
      // Aqui no futuro chamaremos a Edge Function que fala com o Escavador
      // const { error: apiError } = await supabase.functions.invoke('cancel-monitoring', { body: { escavadorId } });
      
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
