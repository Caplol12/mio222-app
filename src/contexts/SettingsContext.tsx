import { setItem, getItem } from '../utils/storage';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AppSettings {
  primaryColor: string;
  boardColor: string;
  opacity: number;
  blur: number;
  textSize: 'S' | 'M' | 'L';
  textWeight: 'Normal' | 'Bold';
  columns: string; // 'Auto', '4', etc.
  openNewTab: boolean;
  hideExtra: string;
  showDesc: boolean;
  saveToPage: string;
  saveToBoard: string;
  language: string;
  showAllSidebar: boolean;
  backgroundUrl: string;
  backgroundType: 'image' | 'video' | 'gradient' | 'color' | 'none';
  themeMode: 'light' | 'dark' | 'auto';
  autoColorMatch: boolean;
}

export const defaultSettings: AppSettings = {
  primaryColor: '#3B82F6',
  boardColor: '#0F172A',
  opacity: 30,
  blur: 24,
  textSize: 'M',
  textWeight: 'Normal',
  columns: '4',
  openNewTab: true,
  hideExtra: 'Show 10',
  showDesc: true,
  saveToPage: 'Home',
  saveToBoard: 'نوار نشانک‌ها',
  language: 'Auto',
  showAllSidebar: false,
  backgroundUrl: '/wallpapers/windows-11-oled-32.webp',
  backgroundType: 'image',
  themeMode: 'dark',
  autoColorMatch: true,
};

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app_settings_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.columns === "Auto") parsed.columns = "4";
        return { ...defaultSettings, ...parsed, autoColorMatch: true };
      } catch (e) {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

    const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    getItem('backgroundUrl').then((url) => {
      if (url) {
        setSettings(s => ({ ...s, backgroundUrl: url }));
      } else {
        setSettings(s => s.backgroundUrl === 'indexeddb' ? { ...s, backgroundUrl: defaultSettings.backgroundUrl } : s);
      }
      setIsLoaded(true);
    }).catch(() => {
      setSettings(s => s.backgroundUrl === 'indexeddb' ? { ...s, backgroundUrl: defaultSettings.backgroundUrl } : s);
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const settingsToSave = { ...settings };
    if (settingsToSave.backgroundUrl && settingsToSave.backgroundUrl.length > 5000) {
      setItem('backgroundUrl', settingsToSave.backgroundUrl).catch(e => console.error(e));
      settingsToSave.backgroundUrl = 'indexeddb';
    } else if (settingsToSave.backgroundUrl !== 'indexeddb') {
      setItem('backgroundUrl', '').catch(e => console.error(e));
    }
    try {
      localStorage.setItem('app_settings_v1', JSON.stringify(settingsToSave));
    } catch (e) {
      console.error(e);
    }

    
    // Apply primary color as a CSS variable for dynamic use
    document.documentElement.style.setProperty('--color-primary', settings.primaryColor);
    
    // Apply theme mode
    if (settings.themeMode === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else if (settings.themeMode === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    }
  }, [settings, isLoaded]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(prev => ({
      ...prev,
      opacity: defaultSettings.opacity,
      blur: defaultSettings.blur
    }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export function useGlassStyle() {
  const { settings } = useSettings();
    
  const getGlassStyle = () => {
    let bgColor = '';
    let baseColor = settings.boardColor || '#000000';
    
    if (baseColor.startsWith('#')) {
      const hex = baseColor.replace('#', '');
      const r = parseInt(hex.length === 3 ? hex.charAt(0) + hex.charAt(0) : hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.length === 3 ? hex.charAt(1) + hex.charAt(1) : hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.length === 3 ? hex.charAt(2) + hex.charAt(2) : hex.substring(4, 6), 16) || 0;
      bgColor = `rgba(${r},${g},${b},${settings.opacity / 100})`;
    } else {
      bgColor = baseColor;
    }
    
    return {
      backgroundColor: bgColor,
      backdropFilter: 'blur(' + settings.blur + 'px)',
      WebkitBackdropFilter: 'blur(' + settings.blur + 'px)'
    };
  };
  return { getGlassStyle };
}
