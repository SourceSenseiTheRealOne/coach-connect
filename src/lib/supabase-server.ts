import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables for server client');
}

/**
 * Server-side Supabase client with service role key
 * This client bypasses Row Level Security and should only be used on the server
 */
export const supabaseServer = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

/**
 * Get the server-side Supabase client
 * Use this for admin operations that need to bypass RLS
 */
export function getSupabaseServerClient() {
    return supabaseServer;
}