import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { useGlassStyle } from '../contexts/SettingsContext';

interface Note {
  id: string;
  title: string;
  content: string;
}

export default function NotesWidget({ dragProps, onRemove }: { dragProps?: any, onRemove?: () => void }) {
  const { getGlassStyle } = useGlassStyle();
  
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem('stash_notes_data');
      if (saved) return JSON.parse(saved);
      // Migrate old tasks or text if available
      const oldTasks = localStorage.getItem('stash_notes_tasks');
      if (oldTasks) {
        const parsed = JSON.parse(oldTasks);
        if (Array.isArray(parsed) && parsed.length > 0) {
           return parsed.map(t => ({ id: t.id, title: '', content: t.text }));
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const [widgetTitle, setWidgetTitle] = useState(() => {
    try {
      return localStorage.getItem('stash_notes_widget_title') || 'یادداشت‌ها';
    } catch {
      return 'یادداشت‌ها';
    }
  });

  useEffect(() => {
    localStorage.setItem('stash_notes_widget_title', widgetTitle);
  }, [widgetTitle]);

  useEffect(() => {
    localStorage.setItem('stash_notes_data', JSON.stringify(notes));
  }, [notes]);

  const addNote = () => {
    if (newTitle.trim() || newContent.trim()) {
      setNotes([{ id: Date.now().toString(), title: newTitle, content: newContent }, ...notes]);
      setNewTitle('');
      setNewContent('');
      setIsAdding(false);
    }
  };

  const removeNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const updateNote = (id: string, title: string, content: string) => {
    setNotes(notes.map(n => n.id === id ? { ...n, title, content } : n));
  };

  return (
    <div style={getGlassStyle()} className={`border border-white/40 dark:border-white/10 rounded-[24px] p-0 flex flex-col h-full shadow-sm relative w-full min-w-0 text-slate-800 dark:text-slate-200 font-sans ${menuOpen ? 'z-50' : 'z-10'}`}>
      
      {/* Header */}
      <div 
        {...dragProps?.attributes}
        {...dragProps?.listeners}
        className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-black/5 dark:bg-white/5 cursor-grab active:cursor-grabbing px-3 py-2.5 relative z-50 rounded-t-[24px] min-w-0 gap-2"
      >
        <h3 className="font-bold text-[14px] text-slate-800 dark:text-white font-sans truncate flex-1">{widgetTitle}</h3>
        <div className="relative flex-shrink-0 flex items-center">
          <button
            ref={menuBtnRef}
            onClick={(e) => {
              e.stopPropagation();
              if (menuOpen) {
                setMenuOpen(false);
              } else {
                const rect = menuBtnRef.current?.getBoundingClientRect();
                if (rect) {
                  setMenuPos({ top: rect.bottom + 4, left: rect.left - 180 });
                }
                setMenuOpen(true);
              }
            }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-[9998]" onClick={() => setMenuOpen(false)} />
              <div
                onClick={e => e.stopPropagation()}
                style={{ position: 'fixed', top: menuPos.top, left: Math.max(menuPos.left, 8) }}
                className="z-[9999] w-48 bg-white dark:bg-[#2C2C2E] border border-slate-900/10 dark:border-white/10 rounded-xl shadow-2xl py-1 animate-in fade-in zoom-in-95 duration-100 text-[13px]"
                dir="rtl"
              >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  const newName = window.prompt("نام جدید ویجت را وارد کنید:", widgetTitle);
                  if (newName && newName.trim() !== "") {
                    setWidgetTitle(newName.trim());
                  }
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-900/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <Edit2 className="w-4 h-4 text-slate-400" />
                تغییر نام ویجت
              </button>
              {onRemove && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onRemove();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-500/70" />
                  حذف ویجت
                </button>
              )}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* List Items */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-50/50 dark:bg-black/20 relative z-0 rounded-b-[24px]" dir="rtl">
        {notes.map(note => (
          <div 
            key={note.id} 
            className="group flex flex-col bg-white dark:bg-[#232325] p-4 rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_8px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_4px_8px_rgba(0,0,0,0.2)] transition-all duration-200 border border-transparent dark:border-white/5 relative"
          >
            <div className="flex items-start justify-between gap-2">
              <input 
                type="text"
                value={note.title}
                placeholder="بدون عنوان"
                onChange={(e) => updateNote(note.id, e.target.value, note.content)}
                className="bg-transparent border-none outline-none text-[15px] font-medium text-slate-800 dark:text-slate-100 mb-1 w-full"
              />
              <button 
                onClick={() => removeNote(note.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 transition-all rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 absolute left-2 top-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <textarea 
              value={note.content}
              placeholder="یادداشت"
              onChange={(e) => updateNote(note.id, note.title, e.target.value)}
              className="bg-transparent border-none outline-none text-[13px] leading-relaxed text-slate-600 dark:text-slate-300 resize-y min-h-[40px] w-full mt-1"
            />
          </div>
        ))}
        {notes.length === 0 && !isAdding && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 gap-2 opacity-70">
            <span className="text-sm">هیچ یادداشتی وجود ندارد</span>
          </div>
        )}
      </div>

      {/* Add Item Field (Google Keep style) */}
      <div className="p-3 bg-white/50 dark:bg-black/20 border-t border-slate-200 dark:border-white/10 z-10 shadow-sm" dir="rtl">
        <div className="bg-white dark:bg-[#232325] rounded-[16px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)] border border-slate-100 dark:border-white/5 focus-within:ring-2 ring-blue-500/20 transition-all overflow-hidden flex flex-col">
          {isAdding ? (
            <div className="flex flex-col">
              <input 
                type="text" 
                placeholder="عنوان یادداشت..." 
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-[15px] font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 px-4 pt-3 pb-1"
              />
              <textarea 
                placeholder="یادداشت خود را بنویسید..." 
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-[14px] text-slate-700 dark:text-slate-300 placeholder-slate-400 px-4 py-2 resize-none min-h-[60px]"
              />
              <div className="flex justify-end px-3 py-2">
                <button 
                  onClick={addNote}
                  className="px-4 py-1.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-lg text-sm font-medium transition-colors"
                >
                  ثبت
                </button>
              </div>
            </div>
          ) : (
            <div 
              className="flex items-center gap-3 px-4 py-3 cursor-text"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="w-5 h-5 text-slate-400" />
              <span className="text-[14px] text-slate-400">یادداشت جدید...</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
