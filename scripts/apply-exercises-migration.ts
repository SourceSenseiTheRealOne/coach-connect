import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function check() {
    // Check exercise_likes table
    console.log('Checking if exercise_likes table exists...');
    const { data: likesData, error: likesError } = await supabase
        .from('exercise_likes')
        .select('id')
        .limit(1);

    if (likesError) {
        console.log('❌ exercise_likes table does NOT exist.');
        console.log('\nPlease apply the migration via Supabase Dashboard SQL Editor:');
        console.log('https://supabase.com/dashboard/project/dyyjtwlslyfxmitlrvka/sql');
        console.log('\nPaste the contents of: supabase/migrations/00002_exercises_setup.sql');
    } else {
        console.log('✅ exercise_likes table EXISTS.');
    }

    // Check exercises
    console.log('\nChecking exercises...');
    const { count, error: exError } = await supabase
        .from('exercises')
        .select('*', { count: 'exact', head: true });

    if (exError) {
        console.log('❌ Error checking exercises:', exError.message);
    } else {
        console.log(`✅ Found ${count} exercises in the database.`);
    }

    // Check RPC functions
    console.log('\nChecking RPC functions...');
    const { error: rpcError } = await supabase.rpc('increment_exercise_likes', {
        exercise_id: '00000000-0000-0000-0000-000000000000',
    });
    if (rpcError && rpcError.message.includes('does not exist')) {
        console.log('❌ RPC functions do NOT exist. Migration needs to be applied.');
    } else {
        console.log('✅ RPC functions exist (or migration already applied).');
    }
}

check();