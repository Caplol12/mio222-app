const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Trash2, Plus, X } from 'lucide-react';
import { useGlassStyle } from '../contexts/SettingsContext';

interface Note {
  id: string;
  title: string;
  text: string;
}

export default function NotesWidget({ dragProps, onRemove }: { dragProps?: any, onRemove?: () => void }) {
  const { getGlassStyle } = useGlassStyle();
  
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem('stash_notes_list');
      if (saved) return JSON.parse(saved);
      
      // Fallback to tasks if exists
      const savedTasks = localStorage.getItem('stash_notes_tasks');
      if (savedTasks) {
         const tasks = JSON.parse(savedTasks);
         return tasks.map((t: any) => ({
           id: t.id,
           title: '',
           text: t.text
         }));
      }

      // Fallback to old text note
      const oldNote = localStorage.getItem('stash_notes_text');
      if (oldNote) {
        return [
          {
            id: Date.now().toString(),
            title: 'یادداشت',
            text: oldNote
          }
        ];
      }
      return [
        { id: '1', title: 'ایده‌های طراحی', text: 'اضافه کردن تم تاریک برای کل اپلیکیشن' }
      ];
    } catch {
      return [];
    }
  });

  const [menuOpen, setMenuOpen] = useState(false);
  
  // New Note State
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');

  useEffect(() => {
    localStorage.setItem('stash_notes_list', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    const handleClick = () => setMenuOpen(false);
    if (menuOpen) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [menuOpen]);

  const addNote = () => {
    if (newTitle.trim() || newText.trim()) {
      setNotes([{ id: Date.now().toString(), title: newTitle, text: newText }, ...notes]);
      setNewTitle('');
      setNewText('');
      setIsAdding(false);
    }
  };

  const removeNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const updateNote = (id: string, field: 'title' | 'text', value: string) => {
    setNotes(notes.map(n => n.id === id ? { ...n, [field]: value } : n));
  };

  return (
    <div style={getGlassStyle()} className="border border-white/40 dark:border-white/10 rounded-[24px] p-0 flex flex-col h-full shadow-sm relative w-full min-w-0 text-slate-800 dark:text-slate-200 overflow-hidden font-sans">
      
      {/* Header */}
      <div 
        {...dragProps?.attributes}
        {...dragProps?.listeners}
        className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-black/5 dark:bg-white/5 cursor-grab active:cursor-grabbing px-4 py-3"
      >
        <h3 className="font-medium text-[16px] text-slate-800 dark:text-white font-sans">یادداشت‌ها</h3>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
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
                className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-red-500/10 text-red-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 opacity-70" />
                <span>Remove Widget</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* List of Notes */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-50/50 dark:bg-black/20" dir="rtl">
        {notes.map(note => (
          <div 
            key={note.id} 
            className="group flex flex-col bg-white dark:bg-[#232325] p-3.5 rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_8px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_4px_8px_rgba(0,0,0,0.2)] hover:-translate-y-[1px] transition-all duration-200 border border-transparent dark:border-white/5 relative"
          >
            <input 
              type="text"
              value={note.title}
              onChange={(e) => updateNote(note.id, 'title', e.target.value)}
              placeholder="بدون عنوان"
              className="bg-transparent border-none outline-none font-semibold text-[15px] mb-1.5 text-slate-800 dark:text-slate-100 placeholder-slate-400"
            />
            <textarea 
              value={note.text}
              onChange={(e) => updateNote(note.id, 'text', e.target.value)}
              placeholder="متن یادداشت..."
              className="bg-transparent border-none outline-none text-[14px] leading-relaxed text-slate-600 dark:text-slate-300 placeholder-slate-400 resize-none min-h-[40px] overflow-hidden"
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
            <button 
              onClick={() => removeNote(note.id)}
              className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 transition-all rounded-full hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Note Field */}
      <div className="p-3 bg-white/50 dark:bg-black/20 border-t border-slate-200 dark:border-white/10" dir="rtl">
        {!isAdding ? (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-[#232325] rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-[#2A2A2C] transition-all text-slate-500 dark:text-slate-400 text-[14px] text-right cursor-text"
          >
            <Plus className="w-5 h-5" />
            <span>افزودن یادداشت جدید...</span>
          </button>
        ) : (
          <div className="flex flex-col bg-white dark:bg-[#232325] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-white/5 p-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <input 
              autoFocus
              type="text" 
              placeholder="عنوان" 
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="bg-transparent border-none outline-none font-semibold text-[15px] mb-2 text-slate-800 dark:text-slate-100 placeholder-slate-400 px-1"
            />
            <textarea
              placeholder="یادداشت خود را بنویسید..."
              value={newText}
              onChange={e => setNewText(e.target.value)}
              className="bg-transparent border-none outline-none text-[14px] leading-relaxed text-slate-600 dark:text-slate-300 placeholder-slate-400 resize-none min-h-[60px] px-1"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button 
                onClick={() => setIsAdding(false)}
                className="px-4 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 text-[13px] font-medium transition-colors"
              >
                لغو
              </button>
              <button 
                onClick={addNote}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-200 text-[13px] font-medium transition-colors"
              >
                ذخیره
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/NotesWidget.tsx', code);
