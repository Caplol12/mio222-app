import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGlassStyle } from '../contexts/SettingsContext';
import { isSupabaseConfigured, supabaseRequest } from '../utils/supabaseClient';

// Helper function to safely read supabase config directly inside component for debugging
const getSupabaseConfig = () => {
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
    winEnv.VITE_SUPABASE_ANON_KEY ||
    winEnv.SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1c3p0dnBvYXN2YWJlaGp1cmhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyNDAzMDgsImV4cCI6MjEwMDgxNjMwOH0.uu9Kjsup--EjJetSFYnWvexyRRKnprT9YYK6yNGtrOU'
  );
  return { url, key };
};
import { logger } from '../utils/logger';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login } = useAuth();
  const { getGlassStyle } = useGlassStyle();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    logger.info('ثبت‌نام/ورود', `شروع فرآیند ${isLogin ? 'ورود' : 'ثبت نام'} برای ایمیل: ${cleanEmail}`, { name, email: cleanEmail });

    try {
      const { url, key } = getSupabaseConfig();
      if (!url || !key) {
        const errorMsg = `تنظیمات Supabase ناقص است. \nURL: ${url ? 'دارد' : 'ندارد'} \nKey: ${key ? 'دارد' : 'ندارد'}`;
        logger.warn('ثبت‌نام/ورود', errorMsg);
        
        // Fallback to local auth if Supabase keys are not set yet
        const mockUser = {
          id: 'user_' + Math.random().toString(36).substring(2, 9),
          name: name.trim() || cleanEmail.split('@')[0],
          email: cleanEmail,
          picture: '',
          provider: 'local',
          isPremium: false
        };
        await login('local-token', mockUser);
        navigate('/');
        return;
      }

      if (isLogin) {
        logger.info('Supabase-Auth', `ارسال درخواست ورود به Supabase Auth برای ${cleanEmail}`);
        
        // 1. Auth Login via Supabase REST API
        const authRes = await supabaseRequest('/auth/v1/token?grant_type=password', {
          method: 'POST',
          body: JSON.stringify({ email: cleanEmail, password })
        });

        const token = authRes.access_token;
        const userId = authRes.user?.id;

        logger.success('Supabase-Auth', `ورود کاربر از طریق Supabase Auth موفقیت‌آمیز بود`, { userId });

        // Build User Object
        const user = {
          id: userId || 'sb_' + Math.random().toString(36).substring(2, 9),
          name: authRes.user?.user_metadata?.name || cleanEmail.split('@')[0],
          email: cleanEmail,
          picture: authRes.user?.user_metadata?.picture || '',
          provider: 'email',
          isPremium: false
        };

        await login(token, user);
        navigate('/');
      } else {
        logger.info('Supabase-Auth', `ارسال درخواست ثبت‌نام کاربر جدید به Supabase Auth`, { name: name.trim(), email: cleanEmail });
        
        // 1. SignUp via Supabase Auth REST API
        const authRes = await supabaseRequest('/auth/v1/signup', {
          method: 'POST',
          body: JSON.stringify({
            email: cleanEmail,
            password,
            data: { name: name.trim() || 'کاربر جدید' }
          })
        });

        const registeredUser = authRes.user;
        const userId = registeredUser?.id;
        const token = authRes.access_token || '';

        logger.success('Supabase-Auth', `اکانت کاربر در Supabase Auth ساخته شد`, { userId, email: cleanEmail });

        if (userId) {
          logger.info('Supabase-DB', `ارسال درخواست درج سطر کاربر به جدول public.profiles در دیتابیس Supabase`, { userId });
          
          // 2. Insert profile record into public.profiles with upsert header & Auth bearer token
          try {
            await supabaseRequest('/rest/v1/profiles', {
              method: 'POST',
              authToken: token, // Pass user JWT token if session was created
              headers: {
                'Prefer': 'resolution=merge-duplicates,return=minimal'
              },
              body: JSON.stringify({
                id: userId,
                name: name.trim() || 'کاربر جدید',
                email: cleanEmail,
                provider: 'email',
                is_premium: false
              })
            });
            logger.success('Supabase-DB', `اطلاعات کاربر با موفقیت در جدول profiles دیتابیس ذخیره شد!`);
          } catch (e: any) {
            logger.error('Supabase-DB', `خطا در ذخیره سطر در جدول profiles دیتابیس: ${e.message}`, { errorDetails: e });
            // Continue even if profile insert fails (e.g. handled by DB trigger)
          }
        } else {
          logger.warn('Supabase-Auth', 'شناسه کاربر ثبت نام شده (userId) برگردانده نشد');
        }

        const user = {
          id: userId || 'sb_' + Math.random().toString(36).substring(2, 9),
          name: name.trim() || 'کاربر جدید',
          email: cleanEmail,
          picture: '',
          provider: 'email',
          isPremium: false
        };

        await login(token || 'reg-token', user);
        navigate('/');
      }
    } catch (err: any) {
      logger.error('ثبت‌نام/ورود', `خطای کلی در عملیات ثبت نام یا ورود: ${err.message}`, { errorStack: err.stack });
      setError(err.message || 'خطا در برقرار ارتباط با سرور دیتابیس Supabase');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    const guestUser = {
      id: 'guest_' + Math.random().toString(36).substring(2, 10),
      name: 'کاربر مهمان',
      email: 'guest@example.com',
      picture: '',
      provider: 'guest'
    };
    await login('guest-token', guestUser);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0A0A0B] bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center" dir="rtl">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-0"></div>
      
      <div 
        style={getGlassStyle()}
        className="w-full max-w-md p-8 rounded-3xl shadow-2xl z-10 border border-white/20 dark:border-white/10 mx-4"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            {isLogin ? 'خوش آمدید' : 'ثبت نام'}
          </h2>
          <p className="text-white/70 text-sm">
            {isLogin ? 'برای دسترسی به بوکمارک‌های خود وارد شوید' : 'حساب کاربری جدید بسازید'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-xl mb-6 text-sm text-center font-medium backdrop-blur-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div className="relative">
              <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="نام و نام خانوادگی"
                className="w-full bg-black/20 border border-white/20 rounded-xl py-3 pr-12 pl-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          )}
          
          <div className="relative">
            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ایمیل"
              className="w-full bg-black/20 border border-white/20 rounded-xl py-3 pr-12 pl-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-left"
              dir="ltr"
            />
          </div>

          <div className="relative">
            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="رمز عبور"
              className="w-full bg-black/20 border border-white/20 rounded-xl py-3 pr-12 pl-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-left"
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl py-3 mt-2 transition-colors flex items-center justify-center gap-2 cursor-cursor"
          >
            {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
            {isLogin ? 'ورود به حساب' : 'ایجاد حساب کاربری'}
          </button>
        </form>

        <div className="mt-4">
          <button
            type="button"
            onClick={handleGuestLogin}
            className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl py-3 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserIcon className="w-5 h-5" />
            ورود بدون ثبت نام (مهمان)
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-white/70">
          {isLogin ? 'حساب کاربری ندارید؟ ' : 'قبلاً ثبت نام کرده‌اید؟ '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-400 hover:text-blue-300 font-bold transition-colors cursor-pointer"
          >
            {isLogin ? 'ثبت نام کنید' : 'وارد شوید'}
          </button>
        </div>
      </div>
    </div>
  );
}
