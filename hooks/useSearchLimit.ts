import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';

export type LimitType = 'search' | 'process' | 'monitoring';

/**
 * useSearchLimit - Blindagem dos limites no backend.
 * O frontend apenas consulta os dados do perfil e os limites globais.
 * O incremento real acontece agora via Edge Functions (Search / Analysis / Monitoring).
 */
export function useSearchLimit() {
  const { user, profile, refreshProfile } = useAuth();
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [planSettings, setPlanSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Estado interno para forçar a re-leitura dos limites quando algo muda
  const [updateCounter, setUpdateCounter] = useState(0);

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
  const getLimitForType = useCallback((type: LimitType) => {
    if (!globalSettings) return 999;

    // 1. Visitante
    if (!user) {
      if (type === 'search') return globalSettings.guest_search_limit || 0;
      if (type === 'process') return globalSettings.guest_process_limit || 0;
      if (type === 'monitoring') return globalSettings.guest_monitoring_limit || 0;
      return 0;
    }

    // 2. PRO (Ativo)
    if (profile?.subscription_status === 'active') {
      if (!planSettings) return 999;
      if (type === 'search') return planSettings.search_limit;
      if (type === 'process') return planSettings.process_limit;
      if (type === 'monitoring') return planSettings.monitoring_limit;
    }

    // 3. FREE (Logado s/ Plano)
    if (type === 'search') return globalSettings.free_search_limit;
    if (type === 'process') return globalSettings.free_process_limit;
    if (type === 'monitoring') return globalSettings.free_monitoring_limit;

    return 0;
  }, [globalSettings, planSettings, user, profile]);

  /**
   * Busca o uso atual do usuário (Banco ou LocalStorage)
   */
  const getCurrentUsage = useCallback(async (type: LimitType) => {
    // 1. Visitante (LocalStorage)
    if (!user) {
      const storageKeys: Record<LimitType, string> = {
        search: 'guest_search_count',
        process: 'guest_process_count',
        monitoring: 'guest_monitoring_count'
      };
      
      const stored = localStorage.getItem(storageKeys[type]);
      return stored ? parseInt(stored, 10) : 0;
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
  }, [user, profile, updateCounter]); 

  /**
   * Verifica se o limite foi atingido antes de permitir a ação
   */
  const checkLimit = useCallback(async (type: LimitType) => {
    const limit = getLimitForType(type);
    const current = await getCurrentUsage(type);
    return current < limit;
  }, [getLimitForType, getCurrentUsage]);

  /**
   * Incrementa o uso (Apenas para visitantes ou para atualização de UI)
   */
  const incrementUsage = useCallback(async (type: LimitType) => {
    // 1. Visitante (LocalStorage ainda é necessário pois não há backend)
    if (!user) {
      const storageKeys: Record<LimitType, string> = {
        search: 'guest_search_count',
        process: 'guest_process_count',
        monitoring: 'guest_monitoring_count'
      };
      
      const stored = localStorage.getItem(storageKeys[type]);
      const current = stored ? parseInt(stored, 10) : 0;
      
      localStorage.setItem(storageKeys[type], (current + 1).toString());
      setUpdateCounter(prev => prev + 1);
      return;
    }

    // 2. Logado - Não incrementamos mais via frontend por segurança.
    // As Edge Functions agora fazem isso no banco via security definer.
    // Apenas solicitamos um refresh do perfil para atualizar o contador na UI.
    refreshProfile();
    setUpdateCounter(prev => prev + 1);

  }, [user, refreshProfile]);

  return {
    loading,
    checkLimit,
    incrementUsage,
    getLimitForType,
    getCurrentUsage
  };
}