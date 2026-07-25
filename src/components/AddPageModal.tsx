import React, { useState } from "react";
import { Layout, X } from "lucide-react";

interface AddPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export default function AddPageModal({ isOpen, onClose, onSave }: AddPageModalProps) {
  const [name, setName] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm rounded-[24px] p-6 shadow-2xl bg-white dark:bg-[#1C1C1E] border border-slate-900/10 dark:border-white/10"
        dir="rtl"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white">
            <Layout className="w-5 h-5 text-[var(--color-primary)]" />
            <h3 className="text-lg font-bold">صفحه جدید</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-500 hover:bg-slate-900/5 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold opacity-70">نام صفحه</label>
          <input 
            type="text" 
            autoFocus
            placeholder="مثلا: صفحه اصلی، داشبورد..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 rounded-xl bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-slate-800 dark:text-white"
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) {
                onSave(name.trim());
                setName("");
              }
            }}
          />
        </div>

        <div className="flex gap-3 mt-8">
          <button 
            onClick={() => {
              if (name.trim()) {
                onSave(name.trim());
                setName("");
              }
            }}
            className="flex-1 py-2.5 bg-[var(--color-primary)] text-slate-900 dark:text-white rounded-xl font-bold shadow-lg shadow-[var(--color-primary)]/30 active:scale-95 transition-all"
          >
            ایجاد صفحه
          </button>
          <button 
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-900/5 dark:bg-white/5 text-slate-800 dark:text-white rounded-xl font-bold active:scale-95 transition-all"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}
