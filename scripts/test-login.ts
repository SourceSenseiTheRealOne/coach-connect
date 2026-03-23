import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables (ES module compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

// Use anon key (like the client does)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
    console.log('=== Testing Login (like production client) ===\n');

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        console.error('❌ Missing ADMIN_EMAIL or ADMIN_PASSWORD in environment variables.');
        process.exit(1);
    }

    console.log(`Testing login with:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('');

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('❌ Login failed:', error.message);
        console.error('Error code:', error.status);
        process.exit(1);
    }

    console.log('✅ Login successful!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('Session expires at:', new Date(data.session?.expires_at ?? 0).toISOString());
}

testLogin();