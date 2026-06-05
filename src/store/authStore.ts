import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  /** Set to true when Supabase fires a PASSWORD_RECOVERY event (user clicked reset link). */
  recoveryMode: boolean;
  init: () => () => void;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  clearRecoveryMode: () => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  recoveryMode: false,
  init: () => {
    // Hydrate the current session from local storage, then subscribe to changes.
    supabase.auth.getSession().then(({ data }) => {
      set({ user: data.session?.user ?? null, loading: false });
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      set({ user: session?.user ?? null, loading: false });
      // When the user clicks a password-reset link, Supabase fires this event.
      if (event === 'PASSWORD_RECOVERY') {
        set({ recoveryMode: true });
      }
    });
    return () => subscription.subscription.unsubscribe();
  },
  signInWithPassword: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  },
  signUpWithPassword: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  },
  signInWithMagicLink: async (email) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    return { error: error?.message ?? null };
  },
  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    return { error: error?.message ?? null };
  },
  updatePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) {
      set({ recoveryMode: false });
    }
    return { error: error?.message ?? null };
  },
  clearRecoveryMode: () => set({ recoveryMode: false }),
  signOut: async () => {
    await supabase.auth.signOut();
  },
}));
