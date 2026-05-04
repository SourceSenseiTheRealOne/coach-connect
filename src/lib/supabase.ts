import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables at module load time
if (!supabaseUrl) {
    console.error("VITE_SUPABASE_URL is not set. Check your environment variables.");
    throw new Error("VITE_SUPABASE_URL is not configured. Please set this environment variable in Vercel.");
}

if (!supabaseAnonKey) {
    console.error("VITE_SUPABASE_ANON_KEY is not set. Check your environment variables.");
    throw new Error("VITE_SUPABASE_ANON_KEY is not configured. Please set this environment variable in Vercel.");
}

// Validate URL format
try {
    new URL(supabaseUrl);
} catch (e) {
    console.error("VITE_SUPABASE_URL is not a valid URL:", supabaseUrl);
    throw new Error("VITE_SUPABASE_URL is not a valid URL format.");
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
    if (!supabaseInstance) {
        supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
            },
            db: {
                schema: 'public',
            },
            global: {
                headers: {
                    'x-client-info': 'coach-connect',
                },
            },
        });
    }
    return supabaseInstance;
}

export const supabase = getSupabaseClient();
