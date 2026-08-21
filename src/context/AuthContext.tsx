import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Participant, UserRole } from '../types/events';

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}

export interface AuthSession {
  user: AuthUser | null;
  access_token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  participant: Participant | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchParticipantProfile = async (userId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('participants')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching participant profile:', error);
        return;
      }

      if (data) {
        setParticipant(data as Participant);
      } else {
        const currentMeta = user?.user_metadata || {};
        setParticipant({
          id: userId,
          email: user?.email || '',
          full_name: currentMeta.full_name || '',
          role: (currentMeta.role as UserRole) || 'participant',
          created_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchParticipantProfile(user.id);
    }
  };

  useEffect(() => {
    // 1. Cargar sesión inicial
    const authObj = (supabase as any).auth;
    if (authObj?.getSession) {
      authObj.getSession().then(({ data }: any) => {
        const s = data?.session ?? null;
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user?.id) {
          fetchParticipantProfile(s.user.id);
        }
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }

    // 2. Escuchar cambios de autenticación
    if (authObj?.onAuthStateChange) {
      const { data: subscriptionData } = authObj.onAuthStateChange(async (_event: any, session: any) => {
        setSession(session ?? null);
        setUser(session?.user ?? null);
        if (session?.user?.id) {
          await fetchParticipantProfile(session.user.id);
        } else {
          setParticipant(null);
        }
        setIsLoading(false);
      });

      return () => {
        subscriptionData?.subscription?.unsubscribe?.();
      };
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    const authObj = (supabase as any).auth;
    const { data, error } = await authObj.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data?.user) {
      setUser(data.user);
      await fetchParticipantProfile(data.user.id);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: UserRole = 'participant') => {
    const authObj = (supabase as any).auth;
    const { data, error } = await authObj.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role
        }
      }
    });

    if (error) throw error;

    if (data?.user) {
      const { error: profileError } = await (supabase as any)
        .from('participants')
        .upsert([
          {
            id: data.user.id,
            email: email,
            full_name: fullName,
            role: role
          }
        ]);

      if (profileError) console.error('Error creating participant row:', profileError);

      setUser(data.user);
      await fetchParticipantProfile(data.user.id);
    }
  };

  const signOut = async () => {
    const authObj = (supabase as any).auth;
    if (authObj?.signOut) {
      await authObj.signOut();
    }
    setUser(null);
    setSession(null);
    setParticipant(null);
  };

  const isAdmin = participant?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        participant,
        isAdmin,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
