import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useUserStore } from '../store/userStore';
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
  
  const setGlobalProfile = useUserStore(state => state.setProfile);
  const clearGlobalProfile = useUserStore(state => state.clearProfile);

  const fetchProfile = async (userId: string) => {
    setProfileLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      // --- LÓGICA DE SELF-HEALING (Limpeza de Expiração no Login) ---
      const now = new Date();
      const expiresAt = data.subscription_expires_at ? new Date(data.subscription_expires_at) : null;
      
      if (data.subscription_status === 'active' && expiresAt && now > expiresAt) {
        console.log("[AuthContext] Assinatura expirada detectada. Realizando limpeza...");
        
        // Faz o downgrade imediato no banco de dados
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'inactive',
            current_plan_id: null,
            subscription_expires_at: null
          })
          .eq('id', userId);

        if (!updateError) {
          // Recarrega os dados já "limpos"
          const { data: cleanedData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (cleanedData) {
            setProfile(cleanedData);
            setGlobalProfile(cleanedData);
          }
        }
      } else {
        // Fluxo normal
        setProfile(data);
        setGlobalProfile(data); 
      }
    }
    setProfileLoading(false);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setSessionLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        clearGlobalProfile();
      }

      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
        setSessionLoading(false);
      }
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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};