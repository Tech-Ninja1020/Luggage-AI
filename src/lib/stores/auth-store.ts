import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

function mapUser(user: User): UserProfile {
  return {
    id: user.id,
    email: user.email ?? "",
    displayName:
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email?.split("@")[0] ??
      "User",
    avatarUrl: user.user_metadata?.avatar_url ?? user.user_metadata?.picture,
  };
}

interface AuthState {
  user: UserProfile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  /** Initialize auth state from Supabase session. Call once at app start. */
  initialize: () => Promise<void>;

  /**
   * Sign in with a Google ID token obtained from expo-auth-session.
   * The actual OAuth prompt is handled in the UI (Profile screen) via
   * Google.useAuthRequest. This method receives the resulting id_token
   * and exchanges it with Supabase Auth.
   */
  signInWithGoogle: (idToken: string) => Promise<void>;

  /** Sign out and clear session. */
  signOut: () => Promise<void>;

  /** Set loading state (used by UI during OAuth prompt). */
  setLoading: (loading: boolean) => void;

  /** Clear error. */
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true, // true initially while we check for existing session
  error: null,

  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        set({
          user: mapUser(session.user),
          session,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }

      // Listen for auth state changes (token refresh, sign-out from another tab, etc.)
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          set({
            user: mapUser(session.user),
            session,
            isAuthenticated: true,
          });
        } else {
          set({
            user: null,
            session: null,
            isAuthenticated: false,
          });
        }
      });
    } catch {
      set({ isLoading: false, error: "Failed to restore session" });
    }
  },

  signInWithGoogle: async (idToken: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });

      if (error) {
        set({ isLoading: false, error: error.message });
        return;
      }

      if (data.user) {
        set({
          user: mapUser(data.user),
          session: data.session,
          isAuthenticated: true,
          isLoading: false,
        });
      }
    } catch (e) {
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : "Sign-in failed",
      });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),
  clearError: () => set({ error: null }),
}));
