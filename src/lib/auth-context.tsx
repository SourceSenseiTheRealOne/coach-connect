import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { Profile } from "../shared/types";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    metadata: { full_name: string; username: string; user_type: string },
  ) => Promise<{ error: Error | null; requiresEmailConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile cache to avoid redundant fetches
  const profileCacheRef = useRef<Profile | null>(null);
  const profileFetchInProgressRef = useRef<string | null>(null);

  // Fetch profile from database with deduplication
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    // Return cached profile if available and user matches
    if (profileCacheRef.current && profileCacheRef.current.id === userId) {
      return profileCacheRef.current;
    }

    // Deduplicate concurrent fetches for the same user
    if (profileFetchInProgressRef.current === userId) {
      // Wait for the in-flight fetch to complete
      return new Promise((resolve) => {
        const check = () => {
          if (profileCacheRef.current?.id === userId) {
            resolve(profileCacheRef.current);
          } else if (profileFetchInProgressRef.current !== userId) {
            resolve(null);
          } else {
            setTimeout(check, 50);
          }
        };
        check();
      });
    }

    profileFetchInProgressRef.current = userId;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, username, full_name, avatar_url, user_type, bio, city, district, country, uefa_license, is_verified, subscription_tier, stripe_customer_id, subscription_expires_at, cover_image_url, profile_views, created_at, updated_at",
        )
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        profileFetchInProgressRef.current = null;
        return null;
      }

      const profile = data as Profile;
      profileCacheRef.current = profile;
      profileFetchInProgressRef.current = null;
      return profile;
    } catch (error) {
      console.error("Error fetching profile:", error);
      profileFetchInProgressRef.current = null;
      return null;
    }
  };

  // Refresh profile data (forces re-fetch, bypasses cache)
  const refreshProfile = async () => {
    if (user) {
      profileCacheRef.current = null;
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Timeout fallback: if session loading takes too long, stop loading
    // to prevent infinite spinner (e.g., IndexedDB lock after dev server restart)
    const loadingTimeout = setTimeout(() => {
      if (mounted) {
        console.warn("Auth session loading timed out, clearing loading state");
        setLoading(false);
      }
    }, 5000);

    // Get initial session — single source of truth for initial load
    supabase.auth
      .getSession()
      .then(async ({ data: { session: initialSession } }) => {
        clearTimeout(loadingTimeout);
        if (!mounted) return;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          const profileData = await fetchProfile(initialSession.user.id);
          if (!mounted) return;
          setProfile(profileData);
        }

        setLoading(false);
      })
      .catch((error) => {
        clearTimeout(loadingTimeout);
        if (!mounted) return;
        console.error("Failed to get session:", error);
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      // INITIAL_SESSION is already handled by getSession() above — skip to avoid
      // double profile fetch and state flicker
      if (event === "INITIAL_SESSION") return;

      // For TOKEN_REFRESHED, just update session/user — no need to refetch profile
      if (event === "TOKEN_REFRESHED") {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        return;
      }

      setSession(newSession);
      setUser(newSession?.user ?? null);

      // Only fetch profile on events where identity changes (sign in / user update)
      if (
        newSession?.user &&
        (event === "SIGNED_IN" || event === "USER_UPDATED")
      ) {
        // Invalidate cache on identity change
        profileCacheRef.current = null;
        const profileData = await fetchProfile(newSession.user.id);
        if (!mounted) return;
        setProfile(profileData);
      } else if (!newSession?.user) {
        // Signed out or session removed
        profileCacheRef.current = null;
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Sign up with email and password
  const signUp = async (
    email: string,
    password: string,
    metadata: { full_name: string; username: string; user_type: string },
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) return { error: new Error(error.message) };

      // If session exists (email confirmation disabled), create profile
      if (data.session?.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user!.id,
          email,
          username: metadata.username,
          full_name: metadata.full_name,
          user_type: metadata.user_type,
          country: "Portugal",
        } as never);

        if (profileError) {
          console.error("Error creating profile:", profileError);
        }
      }

      return {
        error: null,
        requiresEmailConfirmation: !data.session,
      };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let message = error.message;
        if (error.message.includes("Invalid login credentials")) {
          message =
            "Invalid email or password. Please check your credentials and try again.";
        } else if (error.message.includes("Email not confirmed")) {
          message =
            "Please check your email and click the confirmation link before signing in.";
        } else if (error.message.includes("Too many requests")) {
          message =
            "Too many login attempts. Please wait a moment and try again.";
        }
        return { error: new Error(message) };
      }
      return { error: null };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during sign in.";
      return { error: new Error(message) };
    }
  };

  // Sign out — clears state immediately, then tries Supabase signOut
  // with robust fallback for lock errors
  const signOut = async () => {
    try {
      // Clear local state and cache immediately
      setUser(null);
      setSession(null);
      setProfile(null);
      profileCacheRef.current = null;

      const { error } = await supabase.auth.signOut({ scope: "global" });

      if (error) {
        console.warn("Supabase signOut returned error:", error.message);
        // If signOut partially failed, forcefully clear persisted session
        // to prevent re-authentication on refresh
        try {
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("sb-") && key.includes("-auth-token")) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((key) => localStorage.removeItem(key));
        } catch {
          // Ignore storage access errors
        }

        // Lock errors are a known Supabase issue — state is already cleared
        if (
          error.message?.includes("lock") ||
          error.message?.includes("Lock")
        ) {
          return { error: null };
        }
      }
      return { error: null };
    } catch (error) {
      // Catch lock timeout errors — state already cleared above
      if (error instanceof Error && error.message?.includes("Lock")) {
        return { error: null };
      }
      return { error: error as Error };
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const frontendUrl =
        import.meta.env.VITE_FRONTEND_URL || window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${frontendUrl}/reset-password`,
      });

      if (error) return { error: new Error(error.message) };
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Update password
  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return { error: new Error(error.message) };
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const frontendUrl =
        import.meta.env.VITE_FRONTEND_URL || window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${frontendUrl}/auth/callback`,
        },
      });

      if (error) return { error: new Error(error.message) };
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    signInWithGoogle,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
