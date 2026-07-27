import React, { useState } from 'react';
import { X, User, LogOut, Copy, UserPlus, Crown, Loader2, CheckCircle2 } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth, User as UserType } from '../contexts/AuthContext';

interface SettingsScreenProps {
  pages?: {id: string, name: string}[];
  categories: {id: string, name: string}[];
  onClose: () => void;
}

export default function SettingsScreen({ onClose, categories, pages = [] }: SettingsScreenProps) {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { user, login, logout } = useAuth();

  // Registration state inside Settings
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [isRegLoading, setIsRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  const handleRegisterInSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setRegError('');
    setRegSuccess('');
    setIsRegLoading(true);

    try {
      if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
        throw new Error('لطفاً تمام فیلدها را پر کنید.');
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName.trim(), email: regEmail.trim(), password: regPassword })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'این ایمیل قبلاً ثبت شده است.');
      }

      const { token, user: newUser } = await res.json();

      const updatedUser: UserType = {
        ...user,
        ...newUser,
        provider: 'local'
      };

      await login(token, updatedUser);

      setRegSuccess(`حساب کاربری شما با موفقیت ثبت شد و به آیدی #${updatedUser.numericId} متصل گردید!`);
      setShowRegisterForm(false);
    } catch (err: any) {
      setRegError(err.message || 'خطا در ثبت نام');
    } finally {
      setIsRegLoading(false);
    }
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-4">{children}</h3>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir="ltr">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-[450px] max-h-[90vh] bg-[#E5E9EC] dark:bg-[#E5E9EC] rounded-[24px] shadow-2xl overflow-y-auto font-sans text-slate-800">
        
        {/* Header */}
        <div className="sticky top-0 bg-[#E5E9EC]/95 backdrop-blur z-10 px-6 py-5 border-b border-slate-300 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-slate-700">Settings / تنظیمات</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          
          {/* Account & Registration Section */}
          {user && (
            <section className="space-y-4" dir="rtl">
              <SectionTitle>حساب کاربری و ثبت نام</SectionTitle>
              <div className="bg-slate-200/70 rounded-2xl p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold overflow-hidden shadow-sm shrink-0">
                      {user.picture ? <img src={user.picture} alt={user.name} className="w-full h-full object-cover" /> : (user.name ? user.name.charAt(0).toUpperCase() : 'U')}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-800">{user.name}</span>
                        {user.numericId && (
                          <span className="bg-blue-600/10 text-blue-700 font-mono text-[11px] font-bold px-2 py-0.5 rounded-md border border-blue-600/20">
                            #{user.numericId}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500" dir="ltr">{user.email}</span>
                      <div className="flex items-center gap-2 mt-1">
                        {user.isPremium ? (
                          <span className="text-[10px] bg-amber-500/20 text-amber-700 border border-amber-500/30 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-600" /> کاربر پرمیوم (VIP)
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-300 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                            {user.provider === 'guest' || user.email.includes('@local.app') ? 'اکانت مهمان' : 'کاربر ثبت‌شده'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={logout}
                    className="p-2 rounded-xl bg-slate-300/80 hover:bg-red-100 text-slate-600 hover:text-red-600 transition-colors"
                    title="خروج از حساب"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                {regSuccess && (
                  <div className="text-xs text-emerald-800 bg-emerald-100 border border-emerald-300 p-2.5 rounded-xl font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    {regSuccess}
                  </div>
                )}

                {/* Registration Form for Guest Users */}
                {(user.provider === 'guest' || user.email.includes('@local.app')) && (
                  <div className="pt-3 border-t border-slate-300/80 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <UserPlus className="w-4 h-4 text-blue-600" /> ثبت نام و حفظ اطلاعات در سرور
                      </span>
                      <button 
                        onClick={() => setShowRegisterForm(!showRegisterForm)}
                        className="text-xs text-blue-600 hover:underline font-bold"
                      >
                        {showRegisterForm ? 'بستن فرم' : 'تکمیل ثبت نام'}
                      </button>
                    </div>

                    {showRegisterForm && (
                      <form onSubmit={handleRegisterInSettings} className="flex flex-col gap-3 mt-1 bg-white/70 p-4 rounded-xl border border-slate-300 shadow-sm">
                        {regError && (
                          <div className="text-xs text-red-600 bg-red-100 border border-red-300 p-2 rounded-lg font-medium">{regError}</div>
                        )}
                        
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-slate-600">نام و نام خانوادگی</label>
                          <input 
                            type="text" 
                            required
                            value={regName}
                            onChange={e => setRegName(e.target.value)}
                            placeholder="مثلاً: علی محمدی"
                            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-slate-600">ایمیل</label>
                          <input 
                            type="email" 
                            required
                            value={regEmail}
                            onChange={e => setRegEmail(e.target.value)}
                            placeholder="email@example.com"
                            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
                            dir="ltr"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-slate-600">رمز عبور</label>
                          <input 
                            type="password" 
                            required
                            value={regPassword}
                            onChange={e => setRegPassword(e.target.value)}
                            placeholder="******"
                            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
                            dir="ltr"
                          />
                        </div>

                        <button 
                          type="submit"
                          disabled={isRegLoading}
                          className="mt-1 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center justify-center gap-2"
                        >
                          {isRegLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          ثبت نام و ذخیره در سرور (آیدی #{user.numericId})
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Appearance Section */}
          <section className="space-y-4">
            <SectionTitle>Appearance</SectionTitle>
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-600">Theme Mode</span>
              <div className="flex bg-slate-200 rounded-xl p-1">
                {['light', 'dark', 'auto'].map(m => (
                  <button 
                    key={m} 
                    onClick={() => updateSettings({ themeMode: m as any })} 
                    className={`px-3 py-1.5 text-xs font-medium rounded-[10px] transition-all capitalize ${settings.themeMode === m ? 'bg-[var(--color-primary)] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-600">Primary color</span>
                <input 
                  type="color" 
                  value={settings.primaryColor || '#45788C'} 
                  onChange={(e) => updateSettings({ primaryColor: e.target.value })}
                  className="w-full h-10 rounded-xl border-none cursor-pointer bg-transparent p-0 overflow-hidden [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-moz-color-swatch]:border-none shadow-sm"
                />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-600">Board color</span>
                <input 
                  type="color" 
                  value={
                    settings.boardColor === 'dark' ? '#000000' :
                    settings.boardColor === 'light' ? '#ffffff' :
                    settings.boardColor === 'transparent' ? '#000000' :
                    (settings.boardColor || '#000000')
                  } 
                  onChange={(e) => updateSettings({ boardColor: e.target.value })}
                  className="w-full h-10 rounded-xl border-none cursor-pointer bg-transparent p-0 overflow-hidden [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-moz-color-swatch]:border-none shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Opacity</span>
                  <span className="text-xs text-slate-400 font-medium">{settings.opacity}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={settings.opacity} 
                  onChange={(e) => updateSettings({ opacity: parseInt(e.target.value) })}
                  className="w-full accent-[var(--color-primary)] h-1.5 bg-slate-300 rounded-xl appearance-none cursor-pointer" 
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Blur</span>
                  <span className="text-xs text-slate-400 font-medium">{settings.blur}px</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="40" 
                  value={settings.blur} 
                  onChange={(e) => updateSettings({ blur: parseInt(e.target.value) })}
                  className="w-full accent-[var(--color-primary)] h-1.5 bg-slate-300 rounded-xl appearance-none cursor-pointer" 
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button onClick={onClose} className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-xl transition-colors border border-slate-300 shadow-sm">
                Cancel
              </button>
              <button onClick={resetSettings} className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-xl transition-colors border border-slate-300 shadow-sm">
                Reset
              </button>
            </div>
          </section>

          <hr className="border-slate-300" />

          {/* Board Text Section */}
          <section className="space-y-4">
            <SectionTitle>Board Text</SectionTitle>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Size</span>
              <div className="flex bg-slate-200 rounded-xl p-1">
                {['S', 'M', 'L'].map(s => (
                  <button 
                    key={s} 
                    onClick={() => updateSettings({ textSize: s as any })} 
                    className={`px-4 py-1.5 text-sm font-medium rounded-[10px] transition-all ${settings.textSize === s ? 'bg-[var(--color-primary)] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Weight</span>
              <div className="flex bg-slate-200 rounded-xl p-1">
                {['Normal', 'Bold'].map(w => (
                  <button 
                    key={w} 
                    onClick={() => updateSettings({ textWeight: w as any })} 
                    className={`px-4 py-1.5 text-sm font-medium rounded-[10px] transition-all ${settings.textWeight === w ? 'bg-[var(--color-primary)] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </section>
          
          <hr className="border-slate-300" />

          {/* Boards Section */}
          <section className="space-y-4">
            <SectionTitle>Boards</SectionTitle>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Number of columns</span>
              <div className="flex bg-slate-200 rounded-xl p-1 overflow-x-auto max-w-[200px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {['4', '5', '6', '7', '8', '9'].map(c => (
                  <button 
                    key={c} 
                    onClick={() => updateSettings({ columns: c })} 
                    className={`px-3 py-1.5 text-sm font-medium rounded-[10px] transition-all shrink-0 ${settings.columns === c ? 'bg-[var(--color-primary)] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <hr className="border-slate-300" />

          {/* General Section */}
          <section className="space-y-4">
            <SectionTitle>General</SectionTitle>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Open links in new tab</span>
              <div onClick={() => updateSettings({ openNewTab: !settings.openNewTab })} className={`w-11 h-6 rounded-full cursor-pointer p-1 transition-colors ${settings.openNewTab ? 'bg-[var(--color-primary)]' : 'bg-slate-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${settings.openNewTab ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Hide extra bookmarks</span>
              <div className="flex bg-slate-200 rounded-xl p-1">
                {['Show 5', 'Show 10', 'Show 15', 'Show 20', 'Show All'].map(h => (
                  <button 
                    key={h} 
                    onClick={() => updateSettings({ hideExtra: h })} 
                    className={`px-2 py-1.5 text-xs font-medium rounded-[10px] transition-all ${settings.hideExtra === h ? 'bg-[var(--color-primary)] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {h.split(' ')[1]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Show descriptions</span>
              <div onClick={() => updateSettings({ showDesc: !settings.showDesc })} className={`w-11 h-6 rounded-full cursor-pointer p-1 transition-colors ${settings.showDesc ? 'bg-[var(--color-primary)]' : 'bg-slate-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${settings.showDesc ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </div>
            </div>
          </section>

          <hr className="border-slate-300" />

          {/* Language & Region & Sidebar Section */}
          <section className="space-y-4">
            <SectionTitle>Other</SectionTitle>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Language</span>
              <div className="flex bg-slate-200 rounded-xl p-1">
                {['Auto', 'فارسی', 'English'].map(l => (
                  <button 
                    key={l} 
                    onClick={() => updateSettings({ language: l })} 
                    className={`px-3 py-1.5 text-xs font-medium rounded-[10px] transition-all ${settings.language === l ? 'bg-[var(--color-primary)] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Region</span>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-500">Auto-detect</span>
                <button className="text-sm text-[var(--color-primary)] hover:underline font-medium">Advanced &rsaquo;</button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Always show all buttons (Sidebar)</span>
              <div onClick={() => updateSettings({ showAllSidebar: !settings.showAllSidebar })} className={`w-11 h-6 rounded-full cursor-pointer p-1 transition-colors ${settings.showAllSidebar ? 'bg-[var(--color-primary)]' : 'bg-slate-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${settings.showAllSidebar ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </div>
            </div>
          </section>

          {/* Support */}
          <section className="pt-4 flex items-center justify-between pb-8">
            <span className="text-xs font-medium text-slate-400">Version 1.3.1</span>
            <button className="text-sm text-[var(--color-primary)] hover:underline font-medium">Support</button>
          </section>

        </div>
      </div>
    </div>
  );
}
