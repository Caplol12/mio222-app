import React from 'react';
import { Layout, PenLine, Calendar, Timer, Clock, Search, Cloud } from 'lucide-react';
import { useGlassStyle } from '../contexts/SettingsContext';

interface WidgetsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  visibility: any;
  setVisibility: (v: any) => void;
}

export default function WidgetsPanel({ isOpen, onClose, visibility, setVisibility }: WidgetsPanelProps) {
  const { getGlassStyle } = useGlassStyle();
  if (!isOpen) return null;

  const toggle = (key: string) => {
    setVisibility((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={getGlassStyle()} className="fixed right-24 top-1/2 -translate-y-1/2 z-50 w-64 rounded-[24px] shadow-2xl border border-white/40 dark:border-white/10 p-4 font-sans text-slate-800 dark:text-slate-200" dir="ltr">
      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-4 px-2 tracking-widest uppercase">
        Widgets
      </div>
      
      <div className="flex flex-col gap-2">
        {/* Board */}
        <div className="flex items-center justify-between bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl px-3 py-2.5">
          <div className="flex items-center gap-3">
            <Layout className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-sm font-medium">Board</span>
          </div>
          <button 
            onClick={() => toggle('board')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${visibility.board ? 'bg-red-500/80 text-white' : 'bg-[var(--color-primary)] text-slate-900 dark:text-white hover:brightness-110'}`}
          >
            {visibility.board ? 'Remove' : 'Add'}
          </button>
        </div>

        {/* Notes */}
        <div className="flex items-center justify-between bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl px-3 py-2.5">
          <div className="flex items-center gap-3">
            <PenLine className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-sm font-medium">Notes</span>
          </div>
          <button 
            onClick={() => toggle('notes')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${visibility.notes ? 'bg-red-500/80 text-white' : 'bg-[var(--color-primary)] text-slate-900 dark:text-white hover:brightness-110'}`}
          >
            {visibility.notes ? 'Remove' : 'Add'}
          </button>
        </div>

        {/* Calendar */}
        <div className="flex items-center justify-between bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl px-3 py-2.5">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-sm font-medium">Calendar</span>
          </div>
          <button 
            onClick={() => toggle('calendar')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${visibility.calendar ? 'bg-red-500/80 text-white' : 'bg-[var(--color-primary)] text-slate-900 dark:text-white hover:brightness-110'}`}
          >
            {visibility.calendar ? 'Remove' : 'Add'}
          </button>
        </div>

        {/* Pomodoro */}
        <div className="flex items-center justify-between bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl px-3 py-2.5">
          <div className="flex items-center gap-3">
            <Timer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-sm font-medium">Pomodoro</span>
          </div>
          <button 
            onClick={() => toggle('pomodoro')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${visibility.pomodoro ? 'bg-red-500/80 text-white' : 'bg-[var(--color-primary)] text-slate-900 dark:text-white hover:brightness-110'}`}
          >
            {visibility.pomodoro ? 'Remove' : 'Add'}
          </button>
        </div>

        {/* Clock */}
        <div className="flex items-center justify-between bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl px-3 py-2.5 mt-1">
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-sm font-medium">Clock</span>
          </div>
          <div 
            onClick={() => toggle('clock')}
            className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${visibility.clock ? 'bg-[var(--color-primary)]' : 'bg-slate-300 dark:bg-slate-600'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${visibility.clock ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center justify-between bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl px-3 py-2.5">
          <div className="flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-sm font-medium">Search</span>
          </div>
          <div 
            onClick={() => toggle('search')}
            className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${visibility.search ? 'bg-[var(--color-primary)]' : 'bg-slate-300 dark:bg-slate-600'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${visibility.search ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </div>


      </div>
    </div>
  );
}
