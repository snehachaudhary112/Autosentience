// Simple test page to check environment variables
export default function TestPage() {
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const hasGroqKey = !!process.env.GROQ_API_KEY;

    return (
        <div className="p-8 bg-black text-white min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Environment Variables Test</h1>
            <div className="space-y-2">
                <p>NEXT_PUBLIC_SUPABASE_URL: {hasSupabaseUrl ? '✅ Set' : '❌ Missing'}</p>
                <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {hasSupabaseKey ? '✅ Set' : '❌ Missing'}</p>
                <p>GROQ_API_KEY: {hasGroqKey ? '✅ Set' : '❌ Missing'}</p>

                {hasSupabaseUrl && (
                    <p className="mt-4 text-sm text-gray-400">
                        Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)}...
                    </p>
                )}
            </div>
        </div>
    );
}
