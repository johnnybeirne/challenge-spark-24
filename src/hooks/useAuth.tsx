import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { bindAttributionToUser } from "@/lib/attribution";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithMagicLink: (email: string, metadata?: Record<string, string>) => Promise<{ error: any }>;
  signUp: (email: string, password: string, metadata?: Record<string, string>) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AUTH_REQUEST_TIMEOUT_MS = 15000;
const AUTH_TIMEOUT_MESSAGE = "Auth request timed out. Check Supabase project health and try again.";

const withAuthTimeout = async <T,>(request: Promise<T>): Promise<T> => {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(AUTH_TIMEOUT_MESSAGE)), AUTH_REQUEST_TIMEOUT_MS);
  });

  try {
    return await Promise.race([request, timeout]);
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  }
};

const normalizeAuthError = (error: unknown) =>
  error instanceof Error ? error : new Error("Authentication request failed. Please try again.");

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadingFallback = window.setTimeout(() => {
      if (mounted) setLoading(false);
    }, 3500);

    // Honor a post-login redirect target set by admin "View as" before Supabase
    // hydrates the session from the URL hash. Runs regardless of which auth
    // event fires (SIGNED_IN vs INITIAL_SESSION) and survives the Site-URL
    // fallback when redirect_to isn't allow-listed.
    const consumeRedirect = () => {
      try {
        const target = localStorage.getItem("leadio_post_login_redirect");
        if (!target) return false;
        localStorage.removeItem("leadio_post_login_redirect");
        // Clean any auth hash so it doesn't re-trigger on the next page
        if (window.location.hash.includes("access_token")) {
          history.replaceState(null, "", window.location.pathname + window.location.search);
        }
        window.location.replace(target);
        return true;
      } catch {
        return false;
      }
    };

    // 1) Subscribe FIRST so we don't miss an event
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
        const uid = newSession?.user?.id;
        if (uid) {
          // Defer to avoid running inside the auth callback context
          setTimeout(() => { bindAttributionToUser(uid).catch(() => {}); }, 0);
        }
        if (_event === "SIGNED_IN") {
          try { sessionStorage.setItem("leadio_just_logged_in", "1"); } catch {}
        }
        if (uid && (_event === "SIGNED_IN" || _event === "INITIAL_SESSION")) {
          consumeRedirect();
        }
      }
    );

    // 2) Then hydrate from storage
    supabase.auth.getSession()
      .then(({ data: { session: existing } }) => {
        if (!mounted) return;
        setSession(existing);
        setUser(existing?.user ?? null);
        const uid = existing?.user?.id;
        if (uid) consumeRedirect();
        if (uid) {
          setTimeout(() => { bindAttributionToUser(uid).catch(() => {}); }, 0);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setSession(null);
        setUser(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      window.clearTimeout(loadingFallback);
      subscription.unsubscribe();
    };
  }, []);

  const signInWithMagicLink = async (email: string, metadata?: Record<string, string>) => {
    try {
      const { error } = await withAuthTimeout(supabase.auth.signInWithOtp({
        email,
        options: { data: metadata, emailRedirectTo: window.location.origin + "/challenger-dashboard" },
      }));
      return { error };
    } catch (error) {
      return { error: normalizeAuthError(error) };
    }
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, string>) => {
    try {
      const { data, error } = await withAuthTimeout(supabase.auth.signUp({
        email,
        password,
        options: { data: metadata, emailRedirectTo: window.location.origin + "/challenger-dashboard" },
      }));
      return { data, error };
    } catch (error) {
      return { data: null, error: normalizeAuthError(error) };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await withAuthTimeout(supabase.auth.signInWithPassword({ email, password }));
      return { data, error };
    } catch (error) {
      return { data: null, error: normalizeAuthError(error) };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await withAuthTimeout(supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      }));
      return { error };
    } catch (error) {
      return { error: normalizeAuthError(error) };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await withAuthTimeout(supabase.auth.updateUser({ password }));
      return { error };
    } catch (error) {
      return { error: normalizeAuthError(error) };
    }
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithMagicLink, signUp, signIn, resetPassword, updatePassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
