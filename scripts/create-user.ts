import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as readline from 'readline';

// Load environment variables (ES module compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables. Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function createUser() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (prompt: string): Promise<string> => {
        return new Promise((resolve) => {
            rl.question(prompt, resolve);
        });
    };

    try {
        console.log('=== Create User with Confirmed Email ===\n');

        const email = await question('Email: ');
        const password = await question('Password: ');
        const fullName = await question('Full Name: ');
        const username = await question('Username: ');
        const userType = await question('User Type (coach/trainer/scout/club): ');

        rl.close();

        // Create auth user with confirmed email
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // This confirms the email automatically
            user_metadata: {
                full_name: fullName,
                username,
                user_type: userType,
            },
        });

        if (authError) {
            console.error('\n❌ Error creating auth user:', authError.message);
            process.exit(1);
        }

        console.log('\n✅ Auth user created successfully!');
        console.log('User ID:', authData.user.id);

        // Create profile
        const { error: profileError } = await supabase.from('profiles').insert({
            id: authData.user.id,
            email,
            username,
            full_name: fullName,
            user_type: userType,
            country: 'Portugal',
            subscription_tier: 'free',
        });

        if (profileError) {
            console.error('⚠️  Warning: Error creating profile:', profileError.message);
            console.log('You may need to create the profile manually or check the trigger.');
        } else {
            console.log('✅ Profile created successfully!');
        }

        console.log('\n🎉 User setup complete! You can now log in.');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createUser();