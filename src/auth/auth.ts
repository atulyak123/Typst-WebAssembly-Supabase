// src/auth/auth.ts

import { supabase } from "../lib/superbaseClient";

export const signIn = async (email: string) => {
  // Add Infosys domain validation here (move it from UI to auth layer)
  if (!email.endsWith('@infocusp.com')) {
    throw new Error('Access restricted to Infocusp employees only');
  }

  const redirectUrl = `${window.location.origin}/Typst-WebAssembly-Supabase/`;
  console.log('🔗 Sending magic link with redirect URL:', redirectUrl);

  const { error } = await supabase.auth.signInWithOtp({ 
    email,
    options: {
      emailRedirectTo: redirectUrl, // ✅ Now redirects to your app!
    }
  });
  if (error) throw error;
  
  console.log('✅ Magic link sent successfully');
};

export const signOut = () => supabase.auth.signOut();

export const getSession = () => supabase.auth.getSession();

export const onSession = (cb: (user: any | null) => void) =>
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔄 Auth state change:', event, session?.user ? 'user logged in' : 'no user');
    cb(session?.user ?? null);
  });

// Helper function to get current user info
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Debug function to check URL for auth tokens
export const debugAuthUrl = () => {
  const url = window.location.href;
  const hash = window.location.hash;
  console.log('🔍 Current URL:', url);
  console.log('🔍 Current hash:', hash);
  console.log('🔍 Has access_token:', hash.includes('access_token'));
  console.log('🔍 Has error:', hash.includes('error'));
};