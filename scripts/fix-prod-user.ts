import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

async function fixProdUser() {
    console.log('=== Fixing Production User ===\n');

    // The user credentials from environment variables
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        console.error('❌ Missing ADMIN_EMAIL or ADMIN_PASSWORD in environment variables.');
        console.error('Please add these to your .env file:');
        console.error('   ADMIN_EMAIL=your-email@example.com');
        console.error('   ADMIN_PASSWORD=your-password');
        process.exit(1);
    }

    try {
        // First, check if user already exists
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            console.error('Error listing users:', listError.message);
            process.exit(1);
        }

        const existingUser = existingUsers.users.find(u => u.email === email);

        if (existingUser) {
            console.log('User already exists with ID:', existingUser.id);
            console.log('Email confirmed:', existingUser.email_confirmed_at ? 'Yes' : 'No');

            if (!existingUser.email_confirmed_at) {
                // Confirm the email
                console.log('\nConfirming email...');
                const { error: updateError } = await supabase.auth.admin.updateUserById(
                    existingUser.id,
                    { email_confirm: true }
                );

                if (updateError) {
                    console.error('Error confirming email:', updateError.message);
                    process.exit(1);
                }
                console.log('✅ Email confirmed successfully!');
            }

            // Reset the password to ensure it matches
            console.log('\nResetting password...');
            const { error: passwordError } = await supabase.auth.admin.updateUserById(
                existingUser.id,
                { password: password }
            );

            if (passwordError) {
                console.error('Error resetting password:', passwordError.message);
                process.exit(1);
            }
            console.log('✅ Password reset successfully!');

            // Check if profile exists
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', existingUser.id)
                .single();

            if (profileError && profileError.code === 'PGRST116') {
                // Profile doesn't exist, create it
                console.log('\nCreating missing profile...');
                const { error: createProfileError } = await supabase.from('profiles').insert({
                    id: existingUser.id,
                    username: process.env.ADMIN_USERNAME || 'admin_user',
                    full_name: process.env.ADMIN_FULL_NAME || 'Admin User',
                    user_type: process.env.ADMIN_USER_TYPE || 'coach',
                    country: process.env.ADMIN_COUNTRY || 'Portugal',
                    subscription_tier: 'free',
                });

                if (createProfileError) {
                    console.error('Error creating profile:', createProfileError.message);
                } else {
                    console.log('✅ Profile created successfully!');
                }
            } else if (profile) {
                console.log('Profile exists:', profile.username);
            }

            console.log('\n🎉 User is ready! You can now log in.');
            return;
        }

        // User doesn't exist, create them
        console.log('Creating new user...');

        const username = process.env.ADMIN_USERNAME || 'admin_user';
        const fullName = process.env.ADMIN_FULL_NAME || 'Admin User';
        const userType = process.env.ADMIN_USER_TYPE || 'coach';
        const country = process.env.ADMIN_COUNTRY || 'Portugal';

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                full_name: fullName,
                username: username,
                user_type: userType,
            },
        });

        if (authError) {
            console.error('❌ Error creating auth user:', authError.message);
            process.exit(1);
        }

        console.log('✅ Auth user created successfully!');
        console.log('User ID:', authData.user.id);

        // Create profile
        const { error: profileError } = await supabase.from('profiles').insert({
            id: authData.user.id,
            username: username,
            full_name: fullName,
            user_type: userType,
            country: country,
            subscription_tier: 'free',
        });

        if (profileError) {
            console.error('⚠️  Warning: Error creating profile:', profileError.message);
            console.log('You may need to create the profile manually.');
        } else {
            console.log('✅ Profile created successfully!');
        }

        console.log('\n🎉 User setup complete! You can now log in with:');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixProdUser();