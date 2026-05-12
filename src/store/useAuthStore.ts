import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'manager' | 'artist';
  phone: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: 'manager' | 'artist') => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true, // start loading initially to check session
  
  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (data) {
          set({ user: data });
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email: string, password?: string) => {
    set({ isLoading: true });
    try {
      // If password is provided, use real Supabase Auth
      if (password) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (authError) throw authError;

        if (authData.user) {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();
            
          if (error) throw error;
          if (data) set({ user: data });
        }
      } else {
        // Fallback to legacy mock login for demo accounts without password
        if (email !== 'manager@test.com' && email !== 'artist1@test.com') {
          throw new Error('Password is required for non-demo accounts.');
        }

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();
          
        if (error) throw error;
        if (data) {
          set({ user: data });
          localStorage.setItem('tattoo_auth_user', JSON.stringify(data));
        }
      }
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signup: async (email: string, password: string, name: string, role: 'manager' | 'artist') => {
    set({ isLoading: true });
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) throw authError;

      if (authData.user) {
        // 2. Create public user profile
        const { data, error } = await supabase
          .from('users')
          .insert([{
            id: authData.user.id,
            email,
            name,
            role
          }])
          .select()
          .single();
          
        if (error) throw error;
        if (data) {
          set({ user: data });
          localStorage.setItem('tattoo_auth_user', JSON.stringify(data));
        }
      }
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('tattoo_auth_user');
      set({ user: null });
    }
  },

  setUser: (user) => set({ user }),
}));
