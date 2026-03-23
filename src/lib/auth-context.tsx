import {
  createContext,
  useContext,
  useEffect,
  useState,
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

  // Fetch profile from database
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth
      .getSession()
      .then(async ({ data: { session: initialSession } }) => {
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          const profileData = await fetchProfile(initialSession.user.id);
          setProfile(profileData);
        }

        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        const profileData = await fetchProfile(newSession.user.id);
        setProfile(profileData);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
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
        // Provide more helpful error messages
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

  // Sign out
  const signOut = async () => {
    try {
      // Clear local state immediately to prevent race conditions
      setUser(null);
      setSession(null);
      setProfile(null);

      const { error } = await supabase.auth.signOut({ scope: "global" });
      // Even if Supabase returns an error, the local state is cleared
      // which effectively signs the user out. The lock error is a known
      // Supabase issue when onAuthStateChange fires during signOut.
      if (error && error.message?.includes("lock")) {
        // Lock errors can be ignored since we already cleared state
        return { error: null };
      }
      if (error) return { error: new Error(error.message) };
      return { error: null };
    } catch (error) {
      // Catch lock timeout errors - these can be ignored since state is cleared
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
