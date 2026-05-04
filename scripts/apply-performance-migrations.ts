import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;

if (!supabaseUrl) {
    throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

async function applyMigrations() {
    console.log('Applying Supabase Performance & Best Practice Migrations');
    console.log('='.repeat(80));
    console.log('\n⚠️  This script displays the SQL to run in Supabase SQL Editor.');
    console.log('Please apply each migration in order:\n');

    const migrations = [
        {
            file: '00008_performance_optimizations.sql',
            description: 'Performance optimizations (composite indexes, partial indexes, GIN indexes)',
        },
        {
            file: '00009_optimize_rls_policies.sql',
            description: 'Optimize RLS policies with security definer functions',
        },
        {
            file: '00010_improve_rpc_error_handling.sql',
            description: 'Improve RPC functions with better error handling',
        },
    ];

    for (const migration of migrations) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`Migration: ${migration.file}`);
        console.log(`Description: ${migration.description}`);
        console.log(`${'='.repeat(80)}\n`);

        const migrationPath = join(__dirname, '../supabase/migrations', migration.file);
        const migrationSQL = readFileSync(migrationPath, 'utf-8');
        
        console.log(migrationSQL);
        console.log('\n' + '='.repeat(80));
        console.log('Copy the SQL above and paste it into Supabase SQL Editor, then click "Run"');
        console.log('Press Enter to continue to the next migration...');
        
        // Wait for user to press Enter (in a real terminal)
        // For now, just display all migrations
    }

    console.log('\n' + '='.repeat(80));
    console.log('All migrations displayed!');
    console.log('\nTo apply:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Navigate to your project');
    console.log('3. Open SQL Editor');
    console.log('4. Copy and paste each migration SQL above (in order)');
    console.log('5. Click "Run" to execute each migration');
    console.log('\nMigrations must be applied in order:');
    console.log('  1. 00008_performance_optimizations.sql');
    console.log('  2. 00009_optimize_rls_policies.sql');
    console.log('  3. 00010_improve_rpc_error_handling.sql');
}

applyMigrations().catch(console.error);
