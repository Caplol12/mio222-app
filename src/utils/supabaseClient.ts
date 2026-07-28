// Clean client helper for Supabase REST API without external dependencies
const getSupabaseConfig = () => {
  // Check standard window runtime env fallback if injected by Vercel/HTML
  const winEnv = (typeof window !== 'undefined' && (window as any).__ENV__) || {};
  
  const url = (
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
    winEnv.VITE_SUPABASE_URL ||
    winEnv.SUPABASE_URL ||
    ''
  ).replace(/\/$/, '');

  const key = (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.SUPABASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY ||
    winEnv.VITE_SUPABASE_ANON_KEY ||
    winEnv.SUPABASE_ANON_KEY ||
    ''
  );

  return { url, key };
};

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key);
};

export async function supabaseRequest(endpoint: string, options: RequestInit = {}) {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    throw new Error('تنظیمات Supabase (VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY) هنوز ست نشده‌اند.');
  }

  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(`${url}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.msg || errorData.message || errorData.error_description || `خطای دیتابیس Supabase (${response.status})`);
  }

  return response.json();
}
