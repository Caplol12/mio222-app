import { extractDominantColor } from "../utils/colorExtractor";
import React, { useState, useRef, useEffect } from "react";
import { X, Upload, Image as ImageIcon, Video, Palette } from "lucide-react";
import { useSettings } from "../contexts/SettingsContext";

interface WallpaperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESETS = [
  // Local Custom Wallpapers
  { type: 'image', url: '/wallpapers/bg1.jpg' },
  { type: 'image', url: '/wallpapers/bg2.jpg' },
  { type: 'image', url: '/wallpapers/bg3.jpg' },
  
  // Anime style / Digital Art
  { type: 'image', url: 'https://images.unsplash.com/photo-1578637387939-43c525550085?q=80&w=2048&auto=format&fit=crop' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1607513746994-51f730a44832?q=80&w=2048&auto=format&fit=crop' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1580136608260-4eb11f4b24fe?q=80&w=2048&auto=format&fit=crop' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=2048&auto=format&fit=crop' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2048&auto=format&fit=crop' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?q=80&w=2048&auto=format&fit=crop' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=2048&auto=format&fit=crop' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1620336655055-088d06e36bf0?q=80&w=2048&auto=format&fit=crop' },
  // Nature / Landscape (kept as requested)
  { type: 'image', url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=2048&auto=format&fit=crop' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2048&auto=format&fit=crop' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2048&auto=format&fit=crop' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?q=80&w=2048&auto=format&fit=crop' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=2048&auto=format&fit=crop' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2048&auto=format&fit=crop' },
  
  // Gradients
  { type: 'gradient', url: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' },
  { type: 'gradient', url: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' },
];

export default function WallpaperModal({ isOpen, onClose }: WallpaperModalProps) {
  const { settings, updateSettings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  
  const applyAutoColorMatch = async (url: string, type: 'image' | 'video' | 'gradient', force = false) => {
    // The toggle controls whether extraction runs at all. If the user
    // disables auto-color-match, this becomes a no-op regardless of caller.
    if (!settings.autoColorMatch && !force) return;
    if (type !== 'image') return;
    try {
      const colors = await extractDominantColor(url);
      if (colors) {
        updateSettings({ primaryColor: colors.primary, boardColor: colors.board });
      }
    } catch (e) {
      console.error("Failed to extract color", e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      updateSettings({ backgroundUrl: url, backgroundType: type as any });
      applyAutoColorMatch(url, type);
    };
    reader.readAsDataURL(file);
  };


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" dir="ltr">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-[600px] max-h-[90vh] bg-[#1a1a1e] border border-slate-900/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-y-auto font-sans text-slate-900 dark:text-white/90 p-6">
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold tracking-tight">پس‌زمینه</h2>
          <button onClick={onClose} className="p-2 bg-slate-900/5 dark:bg-white/5 hover:bg-slate-900/10 dark:bg-white/10 rounded-full transition-colors text-slate-900 dark:text-white/70 hover:text-slate-900 dark:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Area */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed border-slate-900/20 dark:border-white/20 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-900/5 dark:bg-white/5 transition-colors mb-8"
        >
          <div className="w-12 h-12 rounded-full bg-slate-900/10 dark:bg-white/10 flex items-center justify-center">
            <Upload className="w-6 h-6 text-slate-900 dark:text-white/70" />
          </div>
          <div className="text-center">
            <p className="font-medium text-slate-900 dark:text-white">آپلود تصویر یا ویدیو</p>
            <p className="text-xs text-slate-900 dark:text-white/50 mt-1">JPG • PNG • MP4</p>
          </div>
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept="image/*,video/mp4" 
            onChange={handleFileUpload}
          />
        </div>

        {/* Presets Grid */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white/50 uppercase tracking-wider">طرح‌های آماده</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {PRESETS.map((preset, idx) => (
              <div 
                key={idx}
                onClick={() => {
                  updateSettings({ backgroundUrl: preset.url, backgroundType: preset.type as any });
                  applyAutoColorMatch(preset.url, preset.type as "gradient" | "image" | "video");
                }}
                className={`aspect-video rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${settings.backgroundUrl === preset.url ? 'border-[var(--color-primary)] scale-105 shadow-lg' : 'border-transparent hover:border-slate-900/20 dark:border-white/20'}`}
                style={preset.type === 'gradient' ? { background: preset.url } : {}}
              >
                {preset.type === 'image' && (
                  <img src={preset.url} alt="preset" className="w-full h-full object-cover" />
                )}
                {preset.type === 'video' && (
                  <video src={preset.url} autoPlay loop muted playsInline className="w-full h-full object-cover pointer-events-none" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-900/10 dark:border-white/10 flex items-center justify-between">
           <span className="text-sm text-slate-900 dark:text-white/70">هماهنگی رنگ خودکار</span>
           <div onClick={() => {
               const newValue = !settings.autoColorMatch;
               updateSettings({ autoColorMatch: newValue });
               if (newValue && settings.backgroundType === 'image') {
                 // Force extraction: settings.autoColorMatch in the closure
                 // is still stale here, but the user just opted in.
                 applyAutoColorMatch(settings.backgroundUrl, 'image');
               }
           }} className={`w-11 h-6 rounded-full cursor-pointer p-1 transition-colors ${settings.autoColorMatch ? 'bg-[var(--color-primary)]' : 'bg-slate-900/20 dark:bg-white/20'}`}>
             <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${settings.autoColorMatch ? 'translate-x-5' : 'translate-x-0'}`}></div>
           </div>
        </div>

      </div>
    </div>
  );
}
