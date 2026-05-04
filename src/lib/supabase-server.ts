import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseServer: SupabaseClient | null = null;

if (!supabaseUrl || !serviceRoleKey) {
    console.warn(
        'Missing Supabase environment variables (VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY). ' +
        'Server-side Supabase client is unavailable. tRPC authenticated routes will not work.'
    );
} else {
    /**
     * Server-side Supabase client with service role key
     * This client bypasses Row Level Security and should only be used on the server
     */
    supabaseServer = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
        db: {
            schema: 'public',
        },
        global: {
            headers: {
                'x-client-info': 'coach-connect-server',
            },
        },
    });
}

/**
 * Get the server-side Supabase client
 * Use this for admin operations that need to bypass RLS
 */
export function getSupabaseServerClient(): SupabaseClient {
    if (!supabaseServer) {
        throw new Error(
            'Server-side Supabase client is not available. ' +
            'Ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file.'
        );
    }
    return supabaseServer;
}
