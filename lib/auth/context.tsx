"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { trackCompleteRegistration } from "@/lib/fb-tracking";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<{ error: string | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        // Track CompleteRegistration for NEW users
        if (event === "SIGNED_IN" && session?.user) {
          const user = session.user;
          
          // Check if we already tracked this user (prevent duplicates across sessions)
          const trackedKey = `replay_fb_tracked_${user.id}`;
          const alreadyTracked = localStorage.getItem(trackedKey);
          
          if (!alreadyTracked) {
            // Check if this is a new user (created in last 5 minutes)
            // This catches both OAuth and email/password signups
            const createdAt = new Date(user.created_at);
            const now = new Date();
            const ageInMinutes = (now.getTime() - createdAt.getTime()) / 1000 / 60;
            
            // If user was created recently (< 5 min), it's a new signup
            // If user is older, it's a returning user logging in - don't track
            if (ageInMinutes < 5) {
              try {
                trackCompleteRegistration(user.email, user.id);
                localStorage.setItem(trackedKey, new Date().toISOString());
                console.log("[FB Tracking] CompleteRegistration sent for NEW user:", user.email, `(age: ${ageInMinutes.toFixed(1)} min)`);
              } catch (e) {
                console.warn("[FB Tracking] Failed:", e);
              }
            } else {
              // Mark as tracked anyway to avoid future checks
              localStorage.setItem(trackedKey, "returning-user");
              console.log("[FB Tracking] Skipping returning user:", user.email, `(age: ${ageInMinutes.toFixed(1)} min)`);
            }
          } else {
            console.log("[FB Tracking] User already tracked, skipping:", user.email);
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error("Google sign in error:", error);
      throw error;
    }
  }, [supabase.auth]);

  const signInWithGitHub = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error("GitHub sign in error:", error);
      throw error;
    }
  }, [supabase.auth]);

  const signInWithEmail = useCallback(async (email: string) => {
    // Use OTP code (not magic link) for more reliable login
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Don't use redirect - we'll verify the code in the app
        shouldCreateUser: true,
      },
    });
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  }, [supabase.auth]);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { error: error.message };
    }
    if (data.session) {
      setSession(data.session);
      setUser(data.session.user);
    }
    return { error: null };
  }, [supabase.auth]);

  const signUpWithPassword = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      return { error: error.message };
    }
    // DO NOT auto-login here! We need the user to verify their email OTP first.
    // After OTP verification, handleRegister calls signInWithPassword which sets session.
    // If we set session here, the user skips email verification entirely.
    if (data.session) {
      // Sign out immediately to prevent auto-login before OTP verification
      await supabase.auth.signOut();
    }
    console.log("[FB Tracking] Signup initiated, waiting for email verification before tracking:", email);
    return { error: null };
  }, [supabase.auth]);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) {
      return { error: error.message };
    }
    // Update session and user
    if (data.session) {
      setSession(data.session);
      setUser(data.session.user);
    }
    return { error: null };
  }, [supabase.auth]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    // Redirect to home page after sign out
    window.location.href = "/";
  }, [supabase.auth]);

  const refreshSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setUser(session?.user ?? null);
  }, [supabase.auth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signInWithGoogle,
        signInWithGitHub,
        signInWithEmail,
        signInWithPassword,
        signUpWithPassword,
        verifyOtp,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

