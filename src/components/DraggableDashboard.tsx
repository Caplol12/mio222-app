import React, { useState, useEffect } from 'react';
import { Bookmark, CategoryItem } from "../types";
import { 
  DndContext, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, MoreHorizontal, X, MoreVertical, ExternalLink, EyeOff, Edit2, Trash2, Clipboard } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { extractUrlsFromText } from '../utils/urlParser';
import CalendarWidget from "./CalendarWidget";
import PomodoroWidget from "./PomodoroWidget";
import NotesWidget from "./NotesWidget";

// Sortable item wrapper
function SortableItem({ id, isActive, children }: { id: string, isActive?: boolean, key?: React.Key, children: (dragProps: any) => React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: (isDragging || isActive) ? 50 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/item w-full min-w-0">
      {children({ attributes, listeners })}
    </div>
  );
}

export default function DraggableDashboard({
  categories,
  pageBookmarks,
  getGlassStyle,
  onTriggerAddModal,
  onAddCategory,
  activePage,
  widgetVisibility,
  settings,
  onEditBookmark,
  onDeleteBookmark,
  onUpdateBookmark,
  onEditCategory,
  onDeleteCategory,
  onRemoveWidget,
  onDropLink,
  onDropLinks
}: {
  categories: CategoryItem[];
  pageBookmarks: Bookmark[];
  getGlassStyle: () => React.CSSProperties;
  onTriggerAddModal: (pageId?: string) => void;
  onAddCategory?: (name?: string) => void;
  activePage: string;
  widgetVisibility: Record<string, boolean>;
  settings: any;
  onEditBookmark?: (bookmark: Bookmark) => void;
  onDeleteBookmark?: (id: string) => void;
  onUpdateBookmark?: (id: string, updates: Partial<Bookmark>) => void;
  onEditCategory?: (id: string, name: string) => void;
  onDeleteCategory?: (id: string) => void;
  onRemoveWidget?: (widgetKey: string) => void;
  onDropLink?: (url: string, categoryId: string, isInternalId?: boolean) => void;
  onDropLinks?: (urls: string[], categoryId: string) => void;
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [widgetMenuId, setWidgetMenuId] = useState<string | null>(null);
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [quickAddInput, setQuickAddInput] = useState<string | null>(null);

  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenMenuId(null);
      setWidgetMenuId(null);
      setInlineEditId(null);
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  // Global paste handler for pasting links into selected category or first available category
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        (activeEl as HTMLElement).isContentEditable
      )) {
        return;
      }

      const textData = e.clipboardData?.getData('text/plain') || e.clipboardData?.getData('text/html');
      if (textData) {
        const urls = extractUrlsFromText(textData);
        if (urls.length > 0) {
          const availableCats = categories.filter(c => c.id !== "all" && c.id !== "favs");
          const targetCat = availableCats.find(c => c.id === selectedCatId) || availableCats[0];
          if (targetCat && onDropLinks) {
            e.preventDefault();
            onDropLinks(urls, targetCat.id);
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [selectedCatId, categories, onDropLinks]);
  // We need to initialize the layout based on visible categories and widgets.
  // Instead of a full dnd-kit which is very large to write correctly in one go, 
  // I will write it.
  
  // Default items
  const [addingCategoryCol, setAddingCategoryCol] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [columns, setColumns] = useState<Record<string, string[]>>({
    col1: [],
    col2: [],
    col3: []
  });
  const prevCategoriesRef = React.useRef(categories);

  useEffect(() => {
    const availableCategories = categories.filter(c => c.id !== "all" && c.id !== "favs" && c.id !== "read-later");
    const numCols = settings.columns === 'Auto' ? 3 : (parseInt(settings.columns, 10) || 3);
    
    let cols: Record<string, string[]> = {};
    for (let i = 1; i <= numCols; i++) cols[`col${i}`] = [];
    
    let loaded = false;
    
    const saved = localStorage.getItem(`dashboard_layout_${activePage}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const parsedKeys = Object.keys(parsed);
        if (parsedKeys.length > 0) {
           if (parsedKeys.length === numCols) {
              cols = parsed;
              loaded = true;
           } else {
              const allItems: string[] = [];
              parsedKeys.forEach(k => allItems.push(...parsed[k]));
              let index = 0;
              allItems.forEach(id => {
                cols[`col${(index % numCols) + 1}`].push(id);
                index++;
              });
              loaded = true;
           }
        }
      } catch (e) {}
    }
    
    const prevCatIds = new Set(prevCategoriesRef.current.map(c => c.id));
    const newCategories = categories.filter(c => !prevCatIds.has(c.id));
    prevCategoriesRef.current = categories;

    if (!loaded) {
      if (widgetVisibility.pomodoro) cols.col1.push('widget-pomodoro');
      if (widgetVisibility.notes) (cols.col2 || cols.col1).push('widget-notes');
      if (widgetVisibility.calendar) (cols.col3 || cols.col1).push('widget-calendar');
    } else {
      const existing = new Set<string>();
      Object.values(cols).forEach(colItems => colItems.forEach(item => existing.add(item)));
      
      // Auto-add only newly created categories, NOT all available categories
      newCategories.forEach(cat => {
        if (!existing.has(`cat-${cat.id}`)) {
          const shortestCol = Object.keys(cols).sort((a, b) => cols[a].length - cols[b].length)[0];
          cols[shortestCol].push(`cat-${cat.id}`);
          existing.add(`cat-${cat.id}`);
        }
      });
      
      const validCategoryIds = new Set(availableCategories.map(c => `cat-${c.id}`));
      const seenItems = new Set<string>();
      
      Object.keys(cols).forEach(colId => {
        cols[colId] = cols[colId].filter(id => {
          if (seenItems.has(id)) return false; // Deduplicate!
          seenItems.add(id);
          
          if (id.startsWith('cat-')) return validCategoryIds.has(id);
          if (id.startsWith('widget-')) return widgetVisibility[id.replace('widget-', '') as keyof typeof widgetVisibility];
          return true;
        });
      });
      
      if (widgetVisibility.pomodoro && !existing.has('widget-pomodoro')) {
        const shortestCol = Object.keys(cols).sort((a, b) => cols[a].length - cols[b].length)[0];
        cols[shortestCol].push('widget-pomodoro');
      }
      if (widgetVisibility.notes && !existing.has('widget-notes')) {
        const shortestCol = Object.keys(cols).sort((a, b) => cols[a].length - cols[b].length)[0];
        cols[shortestCol].push('widget-notes');
      }
      if (widgetVisibility.calendar && !existing.has('widget-calendar')) {
        const shortestCol = Object.keys(cols).sort((a, b) => cols[a].length - cols[b].length)[0];
        cols[shortestCol].push('widget-calendar');
      }
    }
    
    const seen = new Set<string>();
    Object.keys(cols).forEach(colId => {
      cols[colId] = cols[colId].filter(id => {
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    });

    setColumns(cols);
  }, [activePage, categories, widgetVisibility, settings.columns]);
  
  // Save to local storage on change
  useEffect(() => {
    if (Object.values(columns).some(col => Array.isArray(col) && col.length > 0)) {
      localStorage.setItem(`dashboard_layout_${activePage}`, JSON.stringify(columns));
    }
  }, [activePage, columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const [activeId, setActiveId] = useState(null);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId === overId) return;

    // Find containers
    const activeContainer = Object.keys(columns).find(key => columns[key].includes(activeId));
    const overContainer = Object.keys(columns).find(key => columns[key].includes(overId)) || 
      (Object.keys(columns).includes(overId) ? overId : null);

    if (!activeContainer || !overContainer) return;

    if (activeContainer !== overContainer) {
      setColumns((prev) => {
        const activeItems = [...prev[activeContainer]];
        const overItems = [...prev[overContainer]];
        
        const activeIndex = activeItems.indexOf(activeId);
        const overIndex = overId in prev ? overItems.length : overItems.indexOf(overId);
        
        activeItems.splice(activeIndex, 1);
        overItems.splice(overIndex, 0, activeId);
        
        return {
          ...prev,
          [activeContainer]: activeItems,
          [overContainer]: overItems,
        };
      });
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    const activeContainer = Object.keys(columns).find(key => columns[key].includes(activeId));
    const overContainer = Object.keys(columns).find(key => columns[key].includes(overId)) || overId;
    
    if (activeContainer && overContainer && activeContainer === overContainer) {
      const items = [...columns[activeContainer]];
      const oldIndex = items.indexOf(activeId);
      const newIndex = items.indexOf(overId);
      
      if (oldIndex !== newIndex) {
        items.splice(oldIndex, 1);
        items.splice(newIndex, 0, activeId);
        
        setColumns(prev => ({
          ...prev,
          [activeContainer]: items
        }));
      }
    }
  };

  const renderItem = (id: string, dragProps?: any) => {
    if (id.startsWith('cat-')) {
      const catId = id.replace('cat-', '');
      const cat = categories.find(c => c.id === catId);
      if (!cat) return null;
      
      const catBookmarks = pageBookmarks.filter(bm => bm.category === cat.id);
      
      const isSelected = selectedCatId === cat.id;

      return (
        <div 
          style={getGlassStyle()} 
          onClick={() => setSelectedCatId(cat.id)}
          className={`border rounded-[20px] flex flex-col shadow-sm mb-4 ${Object.keys(columns).length <= 4 ? 'p-1.5 md:p-3' : 'p-3'} transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${isSelected ? 'ring-2 ring-blue-500 border-blue-500/80 shadow-md shadow-blue-500/10' : 'border-white/40 dark:border-white/10'}`}
          tabIndex={0}
          onDragEnter={(e) => {
            e.preventDefault();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('bg-black/10', 'dark:bg-white/10');
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('bg-black/10', 'dark:bg-white/10');
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('bg-black/10', 'dark:bg-white/10');
            const data = e.dataTransfer.getData('URL') || e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/html');
            if (data && onDropLinks) {
              const urls = extractUrlsFromText(data);
              if (urls.length > 0) {
                onDropLinks(urls, cat.id);
              }
            }
          }}
        >
          <div 
            {...dragProps?.attributes} 
            {...dragProps?.listeners}
            className={`flex items-center justify-between mb-2 cursor-grab active:cursor-grabbing ${Object.keys(columns).length <= 4 ? 'px-0.5' : 'px-1'} min-w-0 gap-1`}
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <h3 className={`font-bold text-slate-800 dark:text-white truncate min-w-0 ${Object.keys(columns).length <= 4 ? 'text-[11px] sm:text-[13px] md:text-[15px]' : 'text-[15px]'}`} dir="rtl">{cat.name}</h3>
              {isSelected && (
                <span className="text-[10px] bg-blue-500/20 text-blue-600 dark:text-blue-300 font-medium px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 animate-pulse">
                  پیست (Ctrl+V)
                </span>
              )}
            </div>
            <div className={`flex items-center gap-1 text-slate-400 relative opacity-0 group-hover/item:opacity-100 transition-opacity ${openMenuId === 'cat-' + cat.id || isSelected ? 'opacity-100' : ''}`}>
              <button 
                title="پیست مستقیم لینک‌های کپی شده به این پوشه"
                onClick={async (e) => {
                  e.stopPropagation();
                  setSelectedCatId(cat.id);
                  try {
                    const text = await navigator.clipboard.readText();
                    const urls = extractUrlsFromText(text);
                    if (urls.length > 0 && onDropLinks) {
                      onDropLinks(urls, cat.id);
                      return;
                    }
                  } catch (err) {}
                  const input = window.prompt("لینک‌ها را وارد یا پیست کنید (هر لینک در یک خط یا با فاصله):");
                  if (input) {
                    const parsed = extractUrlsFromText(input);
                    if (parsed.length > 0 && onDropLinks) {
                      onDropLinks(parsed, cat.id);
                    }
                  }
                }}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors text-slate-600 dark:text-slate-300 flex items-center gap-1 text-xs"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px] font-medium">پیست</span>
              </button>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (quickAddInput === cat.id) {
                    setQuickAddInput(null);
                  } else {
                    setQuickAddInput(cat.id);
                  }
                }} 
                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
                title="افزودن سریع بوکمارک"
              >
                <Plus className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
              
              {/* Category 3-dot Menu */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === `cat-${cat.id}` ? null : `cat-${cat.id}`);
                  setInlineEditId(null);
                }}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors data-[open=true]:bg-black/5 dark:data-[open=true]:bg-white/10"
                data-open={openMenuId === `cat-${cat.id}`}
              >
                <MoreHorizontal className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
              
              {openMenuId === `cat-${cat.id}` && (
                <div onClick={e => e.stopPropagation()} className="absolute right-0 top-full mt-1 z-[9999] w-48 bg-white dark:bg-[#2C2C2E] border border-slate-900/10 dark:border-white/10 rounded-xl shadow-2xl py-1 animate-in fade-in zoom-in-95 duration-100 text-[13px]" dir="ltr">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(null);
                      const newName = window.prompt("نام جدید پوشه را وارد کنید:", cat.name);
                      if (newName && newName.trim() !== "") {
                        onEditCategory?.(cat.id, newName.trim());
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-900/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <span className="font-serif italic text-[14px] w-3.5 h-3.5 flex items-center justify-center opacity-70">T</span>
                    <span>تغییر نام</span>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(null);
                      catBookmarks.forEach(bm => {
                        window.open(bm.url, "_blank");
                      });
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-900/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                    <span>باز کردن همه لینک‌ها</span>
                  </button>
                  <div className="h-px bg-slate-900/10 dark:bg-white/10 my-1"></div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(null);
                      onDeleteCategory?.(cat.id);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-red-500/10 text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 opacity-70" />
                    <span>حذف پوشه</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          {quickAddInput === cat.id && (
            <div className="mb-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-1 p-1 bg-black/5 dark:bg-white/10 rounded-lg">
                <input
                  autoFocus
                  placeholder="https://example.com"
                  className="flex-1 bg-transparent border-none outline-none text-xs px-2 py-1 text-slate-700 dark:text-slate-200"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      let url = e.currentTarget.value.trim();
                      if (!/^https?:\/\//i.test(url)) url = "https://" + url;
                      if (onDropLinks) onDropLinks([url], cat.id);
                      setQuickAddInput(null);
                    } else if (e.key === "Escape") {
                      setQuickAddInput(null);
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const input = (e.currentTarget.parentElement?.querySelector("input") as HTMLInputElement)?.value;
                    if (input?.trim()) {
                      let url = input.trim();
                      if (!/^https?:\/\//i.test(url)) url = "https://" + url;
                      if (onDropLinks) onDropLinks([url], cat.id);
                      setQuickAddInput(null);
                    }
                  }}
                  className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition-colors"
                  title="ذخیره"
                >
                  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </button>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            {catBookmarks.map(bm => (
              <div key={bm.id} className="relative group/bm flex items-center justify-between px-1 sm:px-2 py-1 min-w-0 rounded-lg hover:bg-slate-900/5 dark:hover:bg-white/5 transition-colors w-full" dir="ltr">
                <button 
                  onClick={() => window.open(bm.url, "_blank")}
                  className={`flex items-center ${Object.keys(columns).length <= 4 ? 'gap-1 md:gap-1.5' : 'gap-2'} text-slate-700 dark:text-slate-200 text-sm w-full text-left overflow-hidden min-w-0`}
                >
                  <img src={bm.favicon} className={`${Object.keys(columns).length <= 4 ? 'w-3 h-3 md:w-3.5 md:h-3.5' : 'w-4 h-4'} rounded-sm object-contain flex-shrink-0`} onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.dataset.fallback) {
                      target.dataset.fallback = 'true';
                      target.src = `https://logo.clearbit.com/${bm.domain}`;
                    }
                  }} />
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className={`truncate w-full font-medium text-slate-800 dark:text-slate-200 ${Object.keys(columns).length <= 4 ? 'text-[9px] min-[400px]:text-[10px] sm:text-[12px] md:text-[13px]' : 'text-[13px]'}`}>{bm.domain || bm.title}</span>
                    {settings?.showDesc && bm.description && <span className={`truncate w-full text-slate-400 dark:text-slate-500 mt-0.5 ${Object.keys(columns).length <= 4 ? 'text-[8px] sm:text-[9px] md:text-[10px]' : 'text-[10px]'}`}>{bm.description}</span>}
                  </div>
                </button>
                
                {/* 3-dot menu button */}
                <div className="relative flex-shrink-0 ml-1 z-10">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === bm.id ? null : bm.id);
                      setInlineEditId(null);
                    }}
                    className="p-1 rounded-md hover:bg-slate-900/10 dark:hover:bg-white/10 transition-colors text-slate-500 opacity-0 group-hover/bm:opacity-100 data-[open=true]:opacity-100"
                    data-open={openMenuId === bm.id}
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                  
                  {openMenuId === bm.id && (
                    <>
                      
                      <div onClick={e => e.stopPropagation()} className="absolute right-0 top-full mt-1 z-[9999] w-48 bg-white dark:bg-[#2C2C2E] border border-slate-900/10 dark:border-white/10 rounded-xl shadow-2xl py-1 animate-in fade-in zoom-in-95 duration-100 text-[13px]" dir="ltr">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            window.open(bm.url, "_blank");
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-900/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                          <span>Open</span>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            window.open(bm.url, "_blank", "noopener,noreferrer");
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-900/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 transition-colors"
                        >
                          <EyeOff className="w-3.5 h-3.5 opacity-70" />
                          <span>Open in incognito</span>
                        </button>
                        <div className="h-px bg-slate-900/10 dark:bg-white/10 my-1"></div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            setInlineEditId(bm.id);
                            setEditUrl(bm.url);
                            setEditTitle(bm.title || bm.domain);
                            setEditDesc(bm.description || '');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-900/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 opacity-70" />
                          <span>Edit</span>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            onDeleteBookmark?.(bm.id);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-red-500/10 text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 opacity-70" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </>
                  )}
                  
                  {/* Inline Edit Popover */}
                  {inlineEditId === bm.id && (
                    <>
                      
                      <div className="absolute right-0 top-full mt-2 z-[9999] w-[300px] bg-white dark:bg-[#2C2C2E] border border-slate-900/10 dark:border-white/10 rounded-2xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-3" dir="ltr" onClick={e => e.stopPropagation()}>
                        <input 
                          type="text" 
                          value={editUrl}
                          onChange={e => setEditUrl(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-black/20 border border-slate-900/10 dark:border-white/10 rounded-lg px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-slate-800 dark:text-slate-200"
                        />
                        <input 
                          type="text" 
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-black/20 border border-slate-900/10 dark:border-white/10 rounded-lg px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-slate-800 dark:text-slate-200"
                        />
                        <input 
                          type="text" 
                          value={editDesc}
                          onChange={e => setEditDesc(e.target.value)}
                          placeholder="Description (optional)"
                          className="w-full bg-slate-50/50 dark:bg-black/10 border border-slate-900/10 dark:border-white/10 rounded-lg px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-slate-600 dark:text-slate-400"
                        />
                        <div className={`flex items-center ${Object.keys(columns).length <= 4 ? 'gap-1 md:gap-1.5' : 'gap-2'} mt-1`}>
                          <button 
                            onClick={() => setInlineEditId(null)}
                            className="flex-1 py-1.5 bg-slate-900/5 dark:bg-white/5 hover:bg-slate-900/10 dark:hover:bg-white/10 rounded-lg text-[13px] font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => {
                              onUpdateBookmark?.(bm.id, { url: editUrl, title: editTitle, description: editDesc });
                              setInlineEditId(null);
                            }}
                            className="flex-1 py-1.5 bg-[#2A93D5] hover:brightness-110 text-white rounded-lg text-[13px] font-semibold transition-colors"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    if (id === 'widget-pomodoro' && widgetVisibility.pomodoro) return <div className="mb-4 w-full min-w-0"><PomodoroWidget dragProps={dragProps} onRemove={() => onRemoveWidget?.('pomodoro')} /></div>;
    if (id === 'widget-notes' && widgetVisibility.notes) return <div className="mb-4 w-full min-w-0"><NotesWidget dragProps={dragProps} onRemove={() => onRemoveWidget?.('notes')} /></div>;
    if (id === 'widget-calendar' && widgetVisibility.calendar) return <div className="mb-4 w-full min-w-0"><CalendarWidget dragProps={dragProps} onRemove={() => onRemoveWidget?.('calendar')} /></div>;

    return null;
  };

  const isItemActive = (id: string) => {
    if (!openMenuId && !inlineEditId && !widgetMenuId) return false;
    if (openMenuId === id) return true;
    if (id.startsWith('widget-') && widgetMenuId && widgetMenuId.startsWith(id + '-menu')) return true;
    if (id.startsWith('cat-')) {
      const catId = id.replace('cat-', '');
      const bmIds = pageBookmarks.filter(bm => bm.category === catId).map(bm => bm.id);
      return bmIds.includes(openMenuId!) || bmIds.includes(inlineEditId!);
    }
    return false;
  };
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className={`w-full pb-4 ${Object.keys(columns).length > 4 ? 'overflow-x-auto' : 'overflow-x-hidden'}`}>
        <div 
          className="grid mt-8 pb-12 min-h-[500px] px-2 w-full gap-4 sm:gap-5 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:[grid-template-columns:var(--desktop-cols)]"
          style={{ '--desktop-cols': `repeat(${Object.keys(columns).length || 1}, minmax(${Object.keys(columns).length > 4 ? '260px' : '0'}, 1fr))` } as any}
          dir="ltr"
        >
          {Object.keys(columns).map(colId => (
          <div key={colId} className="flex flex-col w-full min-w-0">
            <SortableContext id={colId} items={columns[colId]} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col min-h-[200px]">
                {columns[colId].map(id => (
                  <SortableItem key={id} id={id} isActive={isItemActive(id)}>
                    {(dragProps: any) => renderItem(id, dragProps)}
                  </SortableItem>
                ))}
                
                {/* Inline Add Category */}
                {addingCategoryCol === colId ? (
                  <div className="w-full bg-white dark:bg-[#1E1E1E] rounded-[20px] p-3 flex items-center gap-2 shadow-sm border border-slate-900/10 dark:border-white/10 mt-2">
                    <input 
                      type="text"
                      autoFocus
                      placeholder="New Board"
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newCategoryName.trim()) {
                          onAddCategory?.(newCategoryName.trim());
                          setAddingCategoryCol(null);
                          setNewCategoryName('');
                        } else if (e.key === 'Escape') {
                          setAddingCategoryCol(null);
                          setNewCategoryName('');
                        }
                      }}
                      className="flex-1 min-w-0 bg-transparent border-b border-slate-300 dark:border-slate-600 outline-none text-[15px] font-medium text-slate-800 dark:text-white px-1 py-1"
                    />
                    <button 
                      onClick={() => {
                        if (newCategoryName.trim()) {
                          onAddCategory?.(newCategoryName.trim());
                          setAddingCategoryCol(null);
                          setNewCategoryName('');
                        }
                      }}
                      className="w-7 h-7 flex-shrink-0 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    </button>
                    <button 
                      onClick={() => {
                        setAddingCategoryCol(null);
                        setNewCategoryName('');
                      }}
                      className="w-7 h-7 flex-shrink-0 rounded-lg bg-transparent flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => setAddingCategoryCol(colId)}
                    className="w-full h-24 border-2 border-dashed border-slate-900/20 dark:border-white/20 rounded-[20px] flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity mt-2"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-900/5 dark:bg-white/5 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-slate-900/40 dark:text-white/40" />
                    </div>
                  </div>
                )}
              </div>
            </SortableContext>
          </div>
        ))}
        </div>
      </div>
      
      <DragOverlay>
        {activeId ? (
          <div className="opacity-90 scale-105 shadow-2xl">
            {renderItem(activeId)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
