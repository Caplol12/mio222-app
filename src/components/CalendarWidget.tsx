import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, MoreHorizontal, Trash2 } from 'lucide-react';
import { useGlassStyle } from '../contexts/SettingsContext';

export default function CalendarWidget({ dragProps, onRemove }: { dragProps?: any, onRemove?: () => void }) {
  const { getGlassStyle } = useGlassStyle();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleClick = () => setMenuOpen(false);
    if (menuOpen) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [menuOpen]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Generate calendar days
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1);
  const monthLength = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  
  let startDayOfWeek = firstDayOfMonth.getDay(); 
  
  const days = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= monthLength; i++) {
    days.push(i);
  }

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && selectedMonth === today.getMonth() && selectedYear === today.getFullYear();
  };

  return (
    <div style={getGlassStyle()} className="border border-white/40 dark:border-white/10 rounded-[24px] p-5 w-full min-w-0  flex flex-col select-none shadow-sm text-slate-800 dark:text-white" dir="ltr">
      <div className="flex items-center justify-between mb-4 px-1">
        <button onClick={prevMonth} className="p-1 hover:bg-slate-300/50 dark:hover:bg-white/10 rounded-xl transition-colors text-slate-400">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div 
          {...dragProps?.attributes}
          {...dragProps?.listeners}
          className="font-semibold text-[15px] text-slate-800 dark:text-white cursor-grab active:cursor-grabbing flex-1 text-center py-1"
        >
          {monthNames[selectedMonth]} {selectedYear}
        </div>
        <button onClick={nextMonth} className="p-1 hover:bg-slate-300/50 dark:hover:bg-white/10 rounded-xl transition-colors text-slate-400">
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1 hover:bg-slate-300/50 dark:hover:bg-white/10 rounded-xl transition-colors text-slate-400"
          >
            <MoreHorizontal className="w-4 h-4" />
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
      
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {dayNames.map((day, i) => (
          <div key={i} className="text-[11px] font-medium text-slate-400">{day}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-y-1 gap-x-1 text-center">
        {days.map((day, i) => {
          return (
            <div key={i} className="flex items-center justify-center aspect-square">
              {day ? (
                <div className={`w-7 h-7 flex items-center justify-center rounded-[8px] text-[13px] transition-colors ${
                  isToday(day) 
                    ? 'bg-[var(--color-primary)] text-slate-900 dark:text-white font-semibold shadow-sm' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/10 cursor-pointer'
                }`}>
                  {day}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
