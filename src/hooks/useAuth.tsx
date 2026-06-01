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

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_ACTION_TIMEOUT_MS = 12000;

const authErrorText = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String((error as { message?: unknown }).message ?? "");
  return String(error ?? "");
};

const isAuthLockOrNetworkError = (error: unknown) => {
  const message = authErrorText(error).toLowerCase();
  return message.includes("lock") || message.includes("failed to fetch") || message.includes("aborterror");
};

const clearSupabaseAuthStorage = () => {
  try {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const url = import.meta.env.VITE_SUPABASE_URL;
    const projectRef = projectId || (url ? new URL(url).hostname.split(".")[0] : "");
    const keys = new Set<string>(projectRef ? [`sb-${projectRef}-auth-token`] : []);
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith("sb-") && key.endsWith("-auth-token")) keys.add(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {}
};

const withAuthTimeout = async <T,>(promise: Promise<T>, message: string): Promise<T> => {
  let timeoutId: ReturnType<typeof window.setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error(message)), AUTH_ACTION_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const suppressRecoverableAuthLock = (event: PromiseRejectionEvent) => {
      if (isAuthLockOrNetworkError(event.reason)) event.preventDefault();
    };
    window.addEventListener("unhandledrejection", suppressRecoverableAuthLock);
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
      window.removeEventListener("unhandledrejection", suppressRecoverableAuthLock);
      window.clearTimeout(loadingFallback);
      subscription.unsubscribe();
    };
  }, []);

  const signInWithMagicLink = async (email: string, metadata?: Record<string, string>) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { data: metadata, emailRedirectTo: window.location.origin + "/challenger-dashboard" },
    });
    return { error };
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, string>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata, emailRedirectTo: window.location.origin + "/challenger-dashboard" },
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const attempt = () => withAuthTimeout(
      supabase.auth.signInWithPassword({ email, password }),
      "Sign in took too long. Please try again."
    );

    try {
      const result = await attempt();
      if (result.error && isAuthLockOrNetworkError(result.error)) {
        clearSupabaseAuthStorage();
        return await attempt();
      }
      return result;
    } catch (error) {
      if (isAuthLockOrNetworkError(error)) {
        clearSupabaseAuthStorage();
        try {
          return await attempt();
        } catch (retryError) {
          return { data: null, error: retryError };
        }
      }
      return { data: null, error };
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
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
