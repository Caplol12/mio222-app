import { isAdmin } from '../utils/admin';
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Search, Image as ImageIcon, LayoutGrid, Settings, Bookmark, Download, Bot, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings, useGlassStyle } from '../contexts/SettingsContext';

export default function RightSidebar({ onOpenSettings, onOpenWallpaper, onToggleWidgets, onOpenImport, onToggleAIChat }: { onOpenSettings: () => void; onOpenWallpaper: () => void; onToggleWidgets: () => void; onOpenImport?: () => void; onToggleAIChat?: () => void }) {
  const [adminSettings, setAdminSettings] = React.useState(() => {
    try {
      const stored = localStorage.getItem('admin_settings');
      return stored ? JSON.parse(stored) : { chatbotEnabled: true };
    } catch {
      return { chatbotEnabled: true };
    }
  });
  const { settings } = useSettings();
  const { user } = useAuth();
  const { getGlassStyle } = useGlassStyle();
  const navigate = useNavigate();

  const buttonStyle = {
    ...getGlassStyle(),
  };

  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-6 md:top-1/2 md:-translate-y-1/2 z-50 flex md:flex-col items-center gap-2 md:gap-4 p-2 md:p-0 rounded-full md:rounded-none bg-black/40 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none border border-white/10 md:border-none shadow-2xl md:shadow-none transition-all duration-300 ${!settings.showAllSidebar ? 'opacity-40 hover:opacity-100' : ''}`}>
      <button 
        title="جستجو" 
        style={buttonStyle}
        className="w-10 h-10 md:w-[50px] md:h-[50px] flex items-center justify-center rounded-full text-slate-900 dark:text-white/80 hover:text-slate-900 dark:text-white transition-all shadow-sm border border-white/10 hover:scale-105"
      >
        <Search className="w-4 h-4 md:w-5 md:h-5 stroke-[1.5]" />
      </button>
      
      <button 
        title="پس‌زمینه" 
        onClick={onOpenWallpaper} 
        style={buttonStyle}
        className="w-10 h-10 md:w-[50px] md:h-[50px] flex items-center justify-center rounded-full text-slate-900 dark:text-white/80 hover:text-slate-900 dark:text-white transition-all shadow-sm border border-white/10 hover:scale-105"
      >
        <ImageIcon className="w-4 h-4 md:w-5 md:h-5 stroke-[1.5]" />
      </button>
      
      <button 
        title="ویجت‌ها" 
        onClick={onToggleWidgets} 
        style={buttonStyle}
        className="w-10 h-10 md:w-[50px] md:h-[50px] flex items-center justify-center rounded-full text-slate-900 dark:text-white/80 hover:text-slate-900 dark:text-white transition-all shadow-sm border border-white/10 hover:scale-105"
      >
        <LayoutGrid className="w-4 h-4 md:w-5 md:h-5 stroke-[1.5]" />
      </button>

      
      <button 
        title="وارد کردن نشانک‌ها" 
        onClick={onOpenImport}
        style={buttonStyle}
        className="w-10 h-10 md:w-[50px] md:h-[50px] flex items-center justify-center rounded-full text-slate-900 dark:text-white/80 hover:text-slate-900 dark:text-white transition-all shadow-sm border border-white/10 hover:scale-105"
      >
        <Download className="w-4 h-4 md:w-5 md:h-5 stroke-[1.5]" />
      </button>

      
      {adminSettings.chatbotEnabled !== false && (
      <button 
        title="هوش مصنوعی" 
        onClick={onToggleAIChat}
        style={buttonStyle}
        className="w-10 h-10 md:w-[50px] md:h-[50px] flex items-center justify-center rounded-full text-slate-900 dark:text-white/80 hover:text-slate-900 dark:text-white transition-all shadow-sm border border-white/10 hover:scale-105"
      >
        <Bot className="w-4 h-4 md:w-5 md:h-5 stroke-[1.5]" />
      </button>
      )}
      
      
      {isAdmin(user?.email) && (
      <button 
        title="پنل مدیریت" 
        onClick={() => navigate('/admin')}
        style={buttonStyle}
        className="w-10 h-10 md:w-[50px] md:h-[50px] flex items-center justify-center rounded-full text-slate-900 dark:text-white/80 hover:text-slate-900 dark:text-white transition-all shadow-sm border border-white/10 hover:scale-105"
      >
        <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 stroke-[1.5]" />
      </button>
      )}

      <button 
        title="تنظیمات" 
        onClick={onOpenSettings} 
        className="w-10 h-10 md:w-[50px] md:h-[50px] flex items-center justify-center rounded-full bg-[var(--color-primary)] text-slate-900 dark:text-white transition-all shadow-lg hover:scale-105 border border-white/10"
      >
        <Settings className="w-4 h-4 md:w-5 md:h-5 stroke-[1.5]" />
      </button>
    </div>
  );
}
