"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Profile } from '../types';
import { useLogStore } from '../store/logStore';

export interface AdminUser extends Profile {
  plan_name?: string;
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { addLog } = useLogStore();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    addLog("Iniciando busca de perfis na tabela 'profiles'...", 'info');

    try {
      const { data, error: dbError, status, statusText } = await supabase
        .from('profiles')
        .select(`
          *,
          plans:current_plan_id (
            name
          )
        `)
        .order('updated_at', { ascending: false });

      // Log completo da resposta para inspeção
      addLog("Resposta do Supabase recebida", 'info', { 
        status, 
        statusText, 
        count: data?.length || 0,
        error: dbError 
      });

      if (dbError) {
        addLog("Erro na query de usuários", 'error', dbError);
        throw dbError;
      }

      if (data && data.length === 0) {
        addLog("Atenção: A tabela 'profiles' retornou 0 registros. Verifique se os usuários do Auth possuem entrada correspondente em public.profiles.", 'error');
      }

      const formattedUsers: AdminUser[] = (data || []).map((u: any) => ({
        ...u,
        plan_name: u.plans?.name || 'Free'
      }));

      setUsers(formattedUsers);
    } catch (err: any) {
      console.error("[useAdminUsers] Erro:", err);
      setError(err.message);
      addLog("Falha crítica ao carregar usuários", 'error', { message: err.message });
    } finally {
      setLoading(false);
    }
  }, [addLog]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${user.first_name} ${user.last_name || ''}`.toLowerCase();
    const email = (user.email || '').toLowerCase();
    return fullName.includes(searchLower) || email.includes(searchLower);
  });

  return {
    users: filteredUsers,
    totalCount: users.length,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    refresh: fetchUsers
  };
}