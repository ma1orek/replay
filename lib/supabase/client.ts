import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client for local development without Supabase
    console.warn('[Supabase] No credentials found - using mock client');
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithOAuth: async () => ({ data: null, error: { message: 'Mock: Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local' } }),
        signInWithOtp: async () => ({ data: null, error: { message: 'Mock: Configure Supabase to enable auth' } }),
        signInWithPassword: async () => ({ data: null, error: { message: 'Mock: Configure Supabase to enable auth' } }),
        signUp: async () => ({ data: null, error: { message: 'Mock: Configure Supabase to enable auth' } }),
        signOut: async () => ({ error: null }),
        verifyOtp: async () => ({ data: null, error: { message: 'Mock: Configure Supabase to enable auth' } }),
      },
      from: () => ({
        select: () => ({ data: null, error: null }),
        insert: () => ({ data: null, error: null }),
        update: () => ({ data: null, error: null }),
        delete: () => ({ data: null, error: null }),
      }),
    } as any;
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
