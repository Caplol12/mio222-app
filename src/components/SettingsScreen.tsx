import React from 'react';
import { X, User, LogOut, Copy } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';

interface SettingsScreenProps {
  pages?: {id: string, name: string}[];
  categories: {id: string, name: string}[];
  onClose: () => void;
}

export default function SettingsScreen({ onClose, categories, pages = [] }: SettingsScreenProps) {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { user, logout } = useAuth();

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-4">{children}</h3>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir="ltr">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-[450px] max-h-[90vh] bg-[#E5E9EC] dark:bg-[#E5E9EC] rounded-[24px] shadow-2xl overflow-y-auto font-sans text-slate-800">
        
        {/* Header */}
        <div className="sticky top-0 bg-[#E5E9EC]/95 backdrop-blur z-10 px-6 py-5 border-b border-slate-300 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-slate-700">Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          
          {/* Account Section */}
          {user && (
            <section className="space-y-4">
              <SectionTitle>Account</SectionTitle>
              <div className="bg-slate-200/50 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center text-slate-500 overflow-hidden">
                    {user.picture ? <img src={user.picture} alt={user.name} className="w-full h-full object-cover" /> : <User className="w-5 h-5" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{user.name}</span>
                    <span className="text-xs text-slate-500">{user.email}</span>
                    <span className="text-[10px] text-slate-400 mt-1 font-mono flex items-center gap-1 cursor-pointer hover:text-slate-600" onClick={() => {
                      navigator.clipboard.writeText(user.id);
                      alert('Account ID copied!');
                    }}>
                      ID: {user.id.substring(0, 16)}... <Copy className="w-3 h-3" />
                    </span>
                  </div>
                </div>
                <button 
                  onClick={logout}
                  className="p-2 rounded-xl bg-slate-200 hover:bg-red-100 text-slate-500 hover:text-red-500 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
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
