// src/auth/auth.ts

import { supabase } from "../lib/superbaseClient";

export const signIn = async (email: string) => {
  // Add Infosys domain validation here (move it from UI to auth layer)
  if (!email.endsWith('@infocusp.com')) {
    throw new Error('Access restricted to Infocusp employees only');
  }

  const { error } = await supabase.auth.signInWithOtp({ 
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/`, // Redirect after email confirmation
    }
  });
  if (error) throw error;
};

export const signOut = () => supabase.auth.signOut();

export const getSession = () => supabase.auth.getSession();

export const onSession = (cb: (user: any | null) => void) =>
  supabase.auth.onAuthStateChange((_, sess) => cb(sess?.user ?? null));

// Helper function to get current user info
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};