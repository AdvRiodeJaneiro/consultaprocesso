"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useUserStore } from '../store/userStore';
import { useLogStore } from '../store/logStore';
import { Profile } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  sessionLoading: boolean; 
  profileLoading: boolean; 
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  
  const { addLog } = useLogStore();
  const setGlobalProfile = useUserStore(state => state.setProfile);
  const clearGlobalProfile = useUserStore(state => state.clearProfile);

  const fetchProfile = async (userId: string) => {
    setProfileLoading(true);
    addLog(`Buscando perfil para o usuário: ${userId}`, 'info');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      addLog("Erro ao carregar perfil do banco de dados", 'error', error);
      console.error("[AuthContext] Erro no perfil:", error);
    }

    if (data) {
      addLog("Perfil carregado com sucesso", 'success', { is_admin: data.is_admin, email: data.email });
      setProfile(data);
      setGlobalProfile(data); 
    }
    setProfileLoading(false);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setSessionLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      addLog(`Evento de Autenticação: ${event}`, 'info');
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        clearGlobalProfile();
      }

      setSessionLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    clearGlobalProfile();
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      profile, 
      sessionLoading, 
      profileLoading, 
      signOut, 
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};