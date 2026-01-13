import { createClient } from '@supabase/supabase-js';

// Hardcoded for debugging
const supabaseUrl = 'https://dbzfjoonimkbrsajtkwf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiemZqb29uaW1rYnJzYWp0a3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg2MTM5NCwiZXhwIjoyMDgwNDM3Mzk0fQ.h49v9LU_RCDgUREVkjL7lX4XqB0abCW6ytiZLM43zmw';

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables for server');
}

console.log('Initializing Supabase Admin with URL:', supabaseUrl);

/**
 * Supabase client for server-side operations
 * Use this in API routes and server components
 * Has elevated permissions via service role key
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
