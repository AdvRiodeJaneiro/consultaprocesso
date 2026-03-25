import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';

export type LimitType = 'search' | 'process' | 'monitoring';

export function useSearchLimit() {
  const { user, profile, refreshProfile } = useAuth();
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [planSettings, setPlanSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch settings on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        // 1. Fetch Global Settings
        const { data: gData } = await supabase
          .from('system_settings')
          .select('*')
          .eq('id', 'global_limits')
          .maybeSingle();
        
        if (gData) setGlobalSettings(gData);

        // 2. Fetch Plan Settings if User is PRO
        if (profile?.current_plan_id) {
          const { data: pData } = await supabase
            .from('plans')
            .select('search_limit, process_limit, monitoring_limit')
            .eq('id', profile.current_plan_id)
            .maybeSingle();
          
          if (pData) setPlanSettings(pData);
        }
      } catch (err) {
        console.error("Error fetching limits:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, [profile?.current_plan_id]);

  /**
   * Identifica o limite atual baseado no nível do usuário
   */
  const getLimitForType = (type: LimitType) => {
    if (!globalSettings) return 999; // Fallback alto se falhar carregamento

    // 1. Visitante
    if (!user) {
      if (type === 'search') return globalSettings.guest_search_limit;
      return 0; // Outros usos bloqueados para visitante
    }

    // 2. PRO (Ativo)
    if (profile?.subscription_status === 'active') {
      if (!planSettings) return 999; // Fallback se o plano não carregou
      if (type === 'search') return planSettings.search_limit;
      if (type === 'process') return planSettings.process_limit;
      if (type === 'monitoring') return planSettings.monitoring_limit;
    }

    // 3. FREE (Logado s/ Plano)
    if (type === 'search') return globalSettings.free_search_limit;
    if (type === 'process') return globalSettings.free_process_limit;
    if (type === 'monitoring') return globalSettings.free_monitoring_limit;

    return 0;
  };

  /**
   * Busca o uso atual do usuário (Banco ou LocalStorage)
   */
  const getCurrentUsage = async (type: LimitType) => {
    // 1. Visitante (LocalStorage)
    if (!user) {
      if (type === 'search') {
        const stored = localStorage.getItem('guest_search_count');
        return stored ? parseInt(stored, 10) : 0;
      }
      return 999; // Bloqueado
    }

    // 2. Logado (Banco)
    if (type === 'search') return profile?.current_month_searches || 0;
    if (type === 'process') return profile?.current_month_process_consults || 0;
    
    if (type === 'monitoring') {
      const { count } = await supabase
        .from('monitored_processes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      return count || 0;
    }

    return 0;
  };

  /**
   * Verifica se o limite foi atingido antes de permitir a ação
   */
  const checkLimit = async (type: LimitType) => {
    const limit = getLimitForType(type);
    const current = await getCurrentUsage(type);
    return current < limit;
  };

  /**
   * Incrementa o uso após uma ação bem-sucedida
   */
  const incrementUsage = async (type: LimitType) => {
    // 1. Visitante
    if (!user) {
      if (type === 'search') {
        const current = await getCurrentUsage('search');
        localStorage.setItem('guest_search_count', (current + 1).toString());
      }
      return;
    }

    // 2. Logado
    if (type === 'search' || type === 'process') {
      const field = type === 'search' ? 'current_month_searches' : 'current_month_process_consults';
      const current = (profile as any)?.[field] || 0;
      
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: current + 1 })
        .eq('id', user.id);
      
      if (!error) refreshProfile();
    }
  };

  return {
    loading,
    checkLimit,
    incrementUsage,
    getLimitForType,
    getCurrentUsage
  };
}