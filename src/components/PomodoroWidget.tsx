import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Settings2, MoreHorizontal, Trash2 } from 'lucide-react';
import { useGlassStyle } from '../contexts/SettingsContext';

export default function PomodoroWidget({ dragProps, onRemove }: { dragProps?: any, onRemove?: () => void }) {
  const { getGlassStyle } = useGlassStyle();
  const [focusTime, setFocusTime] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [longBreakAfter, setLongBreakAfter] = useState(4);
  
  const [timeLeft, setTimeLeft] = useState(focusTime * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'focus' | 'short' | 'long'>('focus');
  const [sessions, setSessions] = useState(() => {
    try {
      const s = localStorage.getItem('pomodoro_sessions');
      return s ? parseInt(s) : 0;
    } catch {
      return 0;
    }
  });
  
  const [showSettings, setShowSettings] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Temp state for settings
  const [tempSettings, setTempSettings] = useState({ focus: 25, short: 5, long: 15, after: 4 });

  useEffect(() => {
    localStorage.setItem('pomodoro_sessions', sessions.toString());
  }, [sessions]);

  useEffect(() => {
    const handleClick = () => setMenuOpen(false);
    if (menuOpen) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [menuOpen]);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (mode === 'focus') {
        const nextSession = sessions + 1;
        setSessions(nextSession);
        if (nextSession % longBreakAfter === 0) {
          setMode('long');
          setTimeLeft(longBreak * 60);
        } else {
          setMode('short');
          setTimeLeft(shortBreak * 60);
        }
      } else {
        setMode('focus');
        setTimeLeft(focusTime * 60);
      }
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, sessions, focusTime, shortBreak, longBreak, longBreakAfter]);

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'focus' ? focusTime * 60 : (mode === 'short' ? shortBreak * 60 : longBreak * 60));
  };
  const setTimerMode = (newMode: 'focus' | 'short' | 'long') => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(newMode === 'focus' ? focusTime * 60 : (newMode === 'short' ? shortBreak * 60 : longBreak * 60));
  };

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');
  
  const handleOpenSettings = () => {
    setTempSettings({ focus: focusTime, short: shortBreak, long: longBreak, after: longBreakAfter });
    setShowSettings(true);
  };
  
  const handleSaveSettings = () => {
    setFocusTime(tempSettings.focus);
    setShortBreak(tempSettings.short);
    setLongBreak(tempSettings.long);
    setLongBreakAfter(tempSettings.after);
    setShowSettings(false);
    
    // Update current time if not running
    if (!isRunning) {
      if (mode === 'focus') setTimeLeft(tempSettings.focus * 60);
      else if (mode === 'short') setTimeLeft(tempSettings.short * 60);
      else if (mode === 'long') setTimeLeft(tempSettings.long * 60);
    }
  };

  return (
    <div style={getGlassStyle()} className="border border-white/40 dark:border-white/10 rounded-[24px] p-6 text-slate-800 dark:text-white shadow-lg w-full min-w-0  flex flex-col h-full relative">
      <div 
        {...dragProps?.attributes}
        {...dragProps?.listeners}
        className="flex items-center justify-between mb-4 cursor-grab active:cursor-grabbing"
      >
        <div className="font-bold text-lg text-slate-800 dark:text-white">Pomodoro</div>
        <div className="flex items-center gap-1">
          <button onClick={handleOpenSettings} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <Settings2 className="w-5 h-5" />
          </button>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {menuOpen && (
              <div
                onClick={e => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 z-[9999] w-48 bg-white dark:bg-[#2C2C2E] border border-slate-900/10 dark:border-white/10 rounded-xl shadow-2xl py-1 animate-in fade-in zoom-in-95 duration-100 text-[13px]"
                dir="ltr"
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onRemove?.();
                  }}
                  className="w-full min-w-0 flex items-center gap-2.5 px-3 py-1.5 hover:bg-red-500/10 text-red-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 opacity-70" />
                  <span>Remove Widget</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-1 mb-6">
        <button onClick={() => setTimerMode('focus')} className={`flex-1 py-1.5 text-xs font-medium rounded-full transition-colors ${mode === 'focus' ? 'bg-slate-300/50 dark:bg-white/10 text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}>Focus</button>
        <button onClick={() => setTimerMode('short')} className={`flex-1 py-1.5 text-xs font-medium rounded-full transition-colors ${mode === 'short' ? 'bg-slate-300/50 dark:bg-white/10 text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}>Short Break</button>
        <button onClick={() => setTimerMode('long')} className={`flex-1 py-1.5 text-xs font-medium rounded-full transition-colors ${mode === 'long' ? 'bg-slate-300/50 dark:bg-white/10 text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}>Long Break</button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-[64px] font-light tracking-tight mb-2 font-sans text-slate-800 dark:text-white leading-none">
          {minutes}:{seconds}
        </div>
        <div className="flex items-center gap-2 mb-8">
          {Array.from({ length: longBreakAfter }, (_, i) => i + 1).map(i => (
            <div key={i} className={`w-2 h-2 rounded-full ${i <= (sessions % longBreakAfter || (sessions > 0 ? longBreakAfter : 0)) ? 'bg-slate-600 dark:bg-slate-400' : 'bg-slate-300 dark:bg-slate-700'}`} />
          ))}
        </div>

        <div className="flex items-center justify-center gap-6">
          <button onClick={resetTimer} className="w-12 h-12 rounded-full bg-slate-200/50 dark:bg-white/5 hover:bg-slate-300/50 transition-colors flex items-center justify-center text-slate-600 dark:text-slate-300">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button onClick={toggleTimer} className="w-16 h-16 rounded-full bg-[#618A9E] hover:brightness-110 transition-colors flex items-center justify-center text-white shadow-md">
            {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </button>
          <button onClick={() => setTimerMode(mode === 'focus' ? 'short' : 'focus')} className="w-12 h-12 rounded-full bg-slate-200/50 dark:bg-white/5 hover:bg-slate-300/50 transition-colors flex items-center justify-center text-slate-600 dark:text-slate-300">
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Settings Popover */}
      {showSettings && (
        <div className="absolute top-8 right-[-260px] z-50 bg-[#E5E9EC] dark:bg-[#2D333B] rounded-[16px] shadow-2xl p-5 w-[260px] border border-white/40 dark:border-white/10 text-slate-700 dark:text-slate-200 text-sm">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span>Focus (min)</span>
              <input 
                type="number" 
                value={tempSettings.focus} 
                onChange={(e) => setTempSettings(prev => ({...prev, focus: parseInt(e.target.value) || 1}))}
                className="w-16 bg-transparent border border-slate-300 dark:border-white/20 rounded-xl px-2 py-1 text-center outline-none focus:border-[var(--color-primary)] text-blue-700 dark:text-blue-400 font-medium"
              />
            </div>
            <div className="flex items-center justify-between">
              <span>Short break (min)</span>
              <input 
                type="number" 
                value={tempSettings.short} 
                onChange={(e) => setTempSettings(prev => ({...prev, short: parseInt(e.target.value) || 1}))}
                className="w-16 bg-transparent border border-slate-300 dark:border-white/20 rounded-xl px-2 py-1 text-center outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div className="flex items-center justify-between">
              <span>Long break (min)</span>
              <input 
                type="number" 
                value={tempSettings.long} 
                onChange={(e) => setTempSettings(prev => ({...prev, long: parseInt(e.target.value) || 1}))}
                className="w-16 bg-transparent border border-slate-300 dark:border-white/20 rounded-xl px-2 py-1 text-center outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div className="flex items-center justify-between">
              <span>Long break after</span>
              <input 
                type="number" 
                value={tempSettings.after} 
                onChange={(e) => setTempSettings(prev => ({...prev, after: parseInt(e.target.value) || 1}))}
                className="w-16 bg-transparent border border-slate-300 dark:border-white/20 rounded-xl px-2 py-1 text-center outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <button onClick={() => setShowSettings(false)} className="flex-1 py-2 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 rounded-xl text-slate-600 dark:text-slate-300 font-medium transition-colors">
                Cancel
              </button>
              <button onClick={handleSaveSettings} className="flex-1 py-2 bg-[#618A9E] hover:brightness-110 text-white rounded-xl font-medium shadow-md transition-colors">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
