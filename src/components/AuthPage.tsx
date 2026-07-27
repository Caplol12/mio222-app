import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGlassStyle } from '../contexts/SettingsContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { user: currentUser, login } = useAuth();
  const { getGlassStyle } = useGlassStyle();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        // Mock Login
        const usersJSON = localStorage.getItem('mock_users_db');
        const users = usersJSON ? JSON.parse(usersJSON) : [];
        const user = users.find((u: any) => u.email === email && u.password === password);
        
        if (!user) {
          throw new Error('ایمیل یا رمز عبور اشتباه است.');
        }
        
        // Remove password before saving to state
        const { password: _, ...userData } = user;
        await login('mock-token-' + Date.now(), userData);
        navigate('/');
      } else {
        // Mock Register
        const usersJSON = localStorage.getItem('mock_users_db');
        const users = usersJSON ? JSON.parse(usersJSON) : [];
        
        if (users.find((u: any) => u.email === email)) {
          throw new Error('این ایمیل قبلاً ثبت شده است.');
        }

        const newUser = {
          id: currentUser?.id || ('user_' + Math.random().toString(36).substring(2, 10)),
          numericId: currentUser?.numericId,
          name: name || 'کاربر جدید',
          email,
          password,
          picture: '',
          provider: 'local',
          isPremium: currentUser?.isPremium || false
        };

        users.push(newUser);
        localStorage.setItem('mock_users_db', JSON.stringify(users));

        const { password: _, ...userData } = newUser;
        await login('mock-token-' + Date.now(), userData);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message);
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0A0A0B] bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center" dir="rtl">
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl py-3 mt-2 transition-colors flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
            {isLogin ? 'ورود به حساب' : 'ایجاد حساب کاربری'}
          </button>
        </form>

        <div className="mt-4">
          <button
            type="button"
            onClick={handleGuestLogin}
            className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl py-3 transition-colors flex items-center justify-center gap-2"
          >
            <UserIcon className="w-5 h-5" />
            ورود بدون ثبت نام (مهمان)
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-white/70">
          {isLogin ? 'حساب کاربری ندارید؟ ' : 'قبلاً ثبت نام کرده‌اید؟ '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-400 hover:text-blue-300 font-bold transition-colors"
          >
            {isLogin ? 'ثبت نام کنید' : 'وارد شوید'}
          </button>
        </div>
      </div>
    </div>
  );
}
