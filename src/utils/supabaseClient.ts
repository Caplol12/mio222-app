// Supabase REST Client lightweight implementation (No heavy SDK dependency)

interface SupabaseConfig {
  url: string;
  key: string;
}

const getSupabaseConfig = (): SupabaseConfig => {
  const winEnv = (typeof window !== 'undefined' && (window as any).__ENV__) || {};
  
  const url = (
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
    winEnv.VITE_SUPABASE_URL ||
    winEnv.SUPABASE_URL ||
    'https://fusztvpoasvabehjurhm.supabase.co'
  ).replace(/\/$/, '');

  const key = (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.SUPABASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY ||
    winEnv.VITE_SUPABASE_ANON_KEY ||
    winEnv.SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1c3p0dnBvYXN2YWJlaGp1cmhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyNDAzMDgsImV4cCI6MjEwMDgxNjMwOH0.uu9Kjsup--EjJetSFYnWvexyRRKnprT9YYK6yNGtrOU'
  );

  return { url, key };
};

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key);
};

export interface RequestOptions extends RequestInit {
  authToken?: string; // Optional user JWT token for RLS authorized requests
}

/**
 * Universal lightweight Supabase REST & Auth fetch wrapper
 */
export async function supabaseRequest<T = any>(
  endpoint: string, 
  options: RequestOptions = {}
): Promise<T> {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    throw new Error('تنظیمات Supabase (VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY) ست نشده‌اند.');
  }

  const { authToken, headers: customHeaders, ...fetchOptions } = options;

  // Use user token if available, otherwise fall back to anon key for Authorization header
  const authHeader = authToken ? `Bearer ${authToken}` : `Bearer ${key}`;

  const headers: HeadersInit = {
    'apikey': key,
    'Authorization': authHeader,
    'Content-Type': 'application/json',
    ...(customHeaders || {})
  };

  const response = await fetch(`${url}${endpoint}`, {
    ...fetchOptions,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = 
      errorData.msg || 
      errorData.message || 
      errorData.error_description || 
      errorData.details || 
      `خطای Supabase (${response.status})`;
    throw new Error(message);
  }

  // Handle HTTP 204 No Content or empty response body (e.g., Prefer: return=minimal)
  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}
