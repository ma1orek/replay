import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Mock client for build time when env vars aren't set
const mockClient = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    exchangeCodeForSession: async () => ({ data: null, error: null }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null }),
      }),
    }),
    update: () => ({
      eq: async () => ({ data: null, error: null }),
    }),
    insert: async () => ({ data: null, error: null }),
  }),
  rpc: async () => ({ data: null, error: null }),
} as any;

export async function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return mockClient;
  }
  
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // Handle cookies in Server Component
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch (error) {
          // Handle cookies in Server Component
        }
      },
    },
  });
}

// Admin client with service role key for server-side operations (bypasses RLS)
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("CRITICAL: Missing SUPABASE_SERVICE_ROLE_KEY - generations will not save!");
    console.error("Add SUPABASE_SERVICE_ROLE_KEY to Vercel env vars (from Supabase → Settings → API → service_role)");
    // Return null so callers can check
    return null;
  }
  
  // Use standard client with service role key (bypasses RLS)
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Check if admin client is available
export function isAdminClientAvailable(): boolean {
  return !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

