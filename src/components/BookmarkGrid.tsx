import React, { useState, useMemo, useCallback, useEffect } from "react";
import { 
  Star, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Edit, 
  MoreVertical, 
  Grid, 
  List, 
  Search, 
  Plus, 
  Heart,
  ChevronRight,
  TrendingUp,
  Tag,
  Bookmark as BookmarkIcon,
  Folder,
  ChevronDown,
  ChevronUp,
  CloudSun,
 
  Settings2,
  User,
  Settings,
  Eye,
  Filter, EyeOff
, X, MoreHorizontal } from "lucide-react";
import DraggableDashboard from "./DraggableDashboard";
import { Bookmark, CategoryItem } from "../types";
import { useSettings, useGlassStyle } from "../contexts/SettingsContext";
import CalendarWidget from "./CalendarWidget";
import PomodoroWidget from "./PomodoroWidget";
import NotesWidget from "./NotesWidget";
import SettingsScreen from "./SettingsScreen";
import WallpaperModal from "./WallpaperModal";
import RightSidebar from "./RightSidebar";
import AIChatPanel from "./AIChatPanel";
import WidgetsPanel from "./WidgetsPanel";
import AddPageModal from "./AddPageModal";

interface BookmarkGridProps {
  pages: {id: string, name: string}[];
  setPages: React.Dispatch<React.SetStateAction<{id: string, name: string}[]>>;
  activePage: string;
  setActivePage: (id: string) => void;
  categories: CategoryItem[];
  bookmarks: Bookmark[];
  onUpdateCategoryGradient: (id: string, gradient: string) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteBookmark: (id: string) => void;
  onEditBookmark: (bookmark: Bookmark) => void;
  onUpdateBookmark?: (id: string, updates: Partial<Bookmark>) => void;
  onTriggerAddModal: (pageId?: string) => void;
  activeCategory: string;
  setActiveCategory?: (id: string) => void;
  onToggleReadLater?: (id: string) => void;
  onOpenImport?: () => void;
  onEditCategory?: (id: string, name: string) => void;
  onAddCategory?: (name?: string) => void;
  onDropLink?: (url: string, categoryId: string, isInternalId?: boolean) => void;
  onDropLinks?: (urls: string[], categoryId: string) => void;
  onDeleteCategory?: (id: string) => void;
}





function ClockWidget() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="text-center mb-10 select-none" dir="rtl">
      <h1 className="text-8xl font-bold text-slate-900 dark:text-white tracking-tight drop-shadow-2xl" style={{ textShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
        {time.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
      </h1>
      <p className="text-2xl text-slate-900 dark:text-white/90 mt-4 font-medium drop-shadow-lg">
        {time.toLocaleDateString('fa-IR', { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>


    </div>
  );
}


function TopClockWidget() {
  const { getGlassStyle } = useGlassStyle();
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const dayName = time.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const dateStr = time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  
  const timeParts = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).split(' ');
  const timeNum = timeParts[0];
  const timeAmPm = timeParts[1] || '';

  return (
    <div style={getGlassStyle()} className="border border-white/40 dark:border-white/10 rounded-[14px] px-3.5 py-1.5 flex flex-col items-end justify-center shadow-sm min-w-[100px] select-none h-[44px]" dir="ltr">
      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold tracking-widest mb-[1px] uppercase leading-none">{dayName}, {dateStr}</span>
      <div className="flex items-start text-slate-800 dark:text-white leading-none tracking-tight">
        <span className="text-[15px] font-bold leading-none">{timeNum}</span>
        {timeAmPm && <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold ml-1 mt-[1px] leading-none">{timeAmPm}</span>}
      </div>
    </div>
  );
}



const defaultWidgetVisibility = {calendar: false, notes: false, pomodoro: false, clock: true, search: true, board: true};

export default function BookmarkGrid({
  pages,
  setPages,
  activePage,
  setActivePage,
  categories,
  bookmarks,
  onUpdateCategoryGradient,
  onToggleFavorite,
  onDeleteBookmark,
  onEditBookmark,
  onUpdateBookmark,
  onTriggerAddModal,
  activeCategory,
  setActiveCategory,
  onAddCategory,
  onDropLink,
  onDropLinks,
  onEditCategory,
  onDeleteCategory,
  onToggleReadLater,
  onOpenImport
}: BookmarkGridProps) {
      const { settings } = useSettings();
  const { getGlassStyle } = useGlassStyle();
  
  const limitStr = settings.hideExtra.replace(/\D/g, '');
  const limitCount = limitStr ? parseInt(limitStr, 10) : 10;
  
  const getGridStyle = () => {
    if (settings.columns !== 'Auto') {
      return { gridTemplateColumns: `repeat(${settings.columns}, minmax(0, 1fr))` };
    }
    return {};
  };
  const getTitleClass = () => {
    let sizeClass = 'text-sm';
    if (settings.textSize === 'S') sizeClass = 'text-xs';
    else if (settings.textSize === 'L') sizeClass = 'text-base';
    
    let weightClass = 'font-medium';
    if (settings.textWeight === 'Bold') weightClass = 'font-bold';
    
    return `${sizeClass} ${weightClass} truncate hover:text-[var(--color-primary)] transition-colors cursor-pointer`;
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "dashboard">("dashboard");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "most_visited" | "az">("newest");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, bookmark: Bookmark | null}>({x: 0, y: 0, bookmark: null});
  const [pageContextMenu, setPageContextMenu] = useState<{x: number, y: number, pageId: string} | null>(null);
  const [dashboardOrder, setDashboardOrder] = useState(() => { try { const s = localStorage.getItem("dash_order"); return s ? JSON.parse(s) : {left: 1, center: 2, right: 3}; } catch { return {left: 1, center: 2, right: 3}; }});
  const [isEditDashboard, setIsEditDashboard] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWallpaperOpen, setIsWallpaperOpen] = useState(false);
  const [isAddPageModalOpen, setIsAddPageModalOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingPageName, setEditingPageName] = useState<string>("");

  const handleAddNewPage = useCallback(() => {
    const newId = 'page-' + Date.now();
    const defaultName = "New Page";
    setPages(prev => [...prev, { id: newId, name: defaultName }]);
    setActivePage(newId);
    setEditingPageId(newId);
    setEditingPageName(defaultName);
  }, [setPages, setActivePage]);

  const handleSavePageName = useCallback((pageId: string) => {
    if (editingPageName.trim()) {
      setPages(prev => prev.map(p => p.id === pageId ? { ...p, name: editingPageName.trim() } : p));
    }
    setEditingPageId(null);
  }, [editingPageName, setPages]);
  

  const [allWidgetVisibility, setAllWidgetVisibility] = useState<Record<string, any>>(() => {
    try {
      const s = localStorage.getItem("dash_widgets_per_page");
      if (s) return JSON.parse(s);
      
      const old = localStorage.getItem("dash_widgets");
      const defaultWidgets = old ? JSON.parse(old) : {calendar: true, notes: true, pomodoro: true, clock: true, search: true, board: true};
      return { 'home': defaultWidgets };
    } catch {
      return {};
    }
  });

  React.useEffect(() => {
    localStorage.setItem("dash_widgets_per_page", JSON.stringify(allWidgetVisibility));
  }, [allWidgetVisibility]);

  const widgetVisibility = allWidgetVisibility[activePage] || defaultWidgetVisibility;

  const setWidgetVisibility = (updater: any) => {
    setAllWidgetVisibility(prev => {
      const current = prev[activePage] || defaultWidgetVisibility;
      const next = typeof updater === 'function' ? updater(current) : updater;
      return { ...prev, [activePage]: next };
    });
  };
  React.useEffect(() => { localStorage.setItem("dash_order", JSON.stringify(dashboardOrder)); }, [dashboardOrder]);
  
  // Handle outside click to close context menu
  React.useEffect(() => {
    const handleGlobalClick = () => {
      if (contextMenu.bookmark) setContextMenu({ x: 0, y: 0, bookmark: null });
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [contextMenu.bookmark]);

  // Feature 4: Keyboard Shortcuts
  

  const toggleCategory = useCallback((catId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !(prev[catId] ?? true)
    }));
  }, []);

  // Trigger a subtle in-app toast notification
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  }, []);

  const handleCopyLink = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    showToast("لینک وب‌سایت با موفقیت در کلیپ‌بورد کپی شد ✨");
    setActiveMenuId(null);
  }, [showToast]);

  const handleOpenLink = useCallback((bookmark: Bookmark) => {
    window.open(bookmark.url, settings.openNewTab ? "_blank" : "_self", "noopener,noreferrer");
    if (onUpdateBookmark) {
      onUpdateBookmark(bookmark.id, { clickCount: (bookmark.clickCount || 0) + 1 });
    }
  }, [settings.openNewTab, onUpdateBookmark]);

  // Filter bookmarks logically by active category / favorite tab AND search query
  const pageBookmarks = useMemo(() => bookmarks.filter(bm => activePage === "home" ? (!bm.pageId || bm.pageId === "home") : bm.pageId === activePage), [bookmarks, activePage]);
  const filteredBookmarks = useMemo(() => {
    let result = pageBookmarks.filter((bm) => {
      const matchesSearch = 
        bm.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bm.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bm.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bm.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const activeCatObj = categories.find(c => c.id === activeCategory);
      let matchesCategory = false;
      if (activeCategory === "all") {
        matchesCategory = true;
      } else if (activeCategory === "favs") {
        matchesCategory = bm.favorite;
      } else if (activeCategory === "read-later") {
        matchesCategory = bm.readLater;
      } else if (activeCatObj?.isSmart && activeCatObj.smartTags) {
        matchesCategory = bm.tags.some(t => activeCatObj.smartTags?.includes(t));
      } else {
        matchesCategory = bm.category === activeCategory;
      }

      const matchesTag = selectedTag ? bm.tags.some(t => t.toLowerCase().includes(selectedTag.toLowerCase())) : true;

      return matchesSearch && matchesCategory && matchesTag;
    });

    switch (sortBy) {
      case "oldest":
        result = result.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case "most_visited":
        result = result.sort((a, b) => b.clickCount - a.clickCount);
        break;
      case "az":
        result = result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "newest":
      default:
        result = result.sort((a, b) => b.createdAt - a.createdAt);
        break;
    }

    return result;
  }, [pageBookmarks, searchQuery, activeCategory, selectedTag, sortBy, categories]);

  // Extract all unique tags present in the current filter for quick filtering
  const allTags = useMemo(() => Array.from(new Set(pageBookmarks.filter(bm => {
    if (activeCategory === "all") return true;
    if (activeCategory === "favs") return bm.favorite;
    return bm.category === activeCategory;
  }).flatMap((bm) => bm.tags))), [pageBookmarks, activeCategory]);

  // Group categorizations
  const currentCategoryName = useMemo(() => categories.find(c => c.id === activeCategory)?.name || "بوکمارک‌ها", [categories, activeCategory]);

  return (
    <div className="flex-1 min-w-0 w-full flex flex-col font-sans transition-colors duration-300 pb-20 lg:pb-8">
      
      {/* Header Section */}
      <div className="px-4 sm:px-6 md:px-8 py-5 sticky top-0 z-30 flex items-center justify-between gap-4 mt-2" dir="ltr">
        {/* Pages Tabs, Search, and Focus Widget */}
        <div className="flex items-center justify-between w-full mb-8" dir="ltr">
          <div className="flex items-center gap-3">
            {/* Tabs Container matching uploaded UI design */}
            <div className="flex items-center bg-[#F8F4EE] dark:bg-[#1E1E20]/90 backdrop-blur-xl border border-[#E6E0D6] dark:border-white/10 rounded-full p-1.5 shadow-md shadow-black/5 gap-1 select-none">
              {pages.map((page, index) => {
                const isActive = activePage === page.id;
                const isEditing = editingPageId === page.id;

                if (isEditing) {
                  return (
                    <div 
                      key={page.id}
                      className="px-4 py-1.5 rounded-lg bg-[#7A736B] text-white font-medium shadow-sm flex items-center"
                    >
                      <input
                        type="text"
                        autoFocus
                        value={editingPageName}
                        onChange={(e) => setEditingPageName(e.target.value)}
                        onBlur={() => handleSavePageName(page.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSavePageName(page.id);
                          if (e.key === "Escape") setEditingPageId(null);
                        }}
                        className="bg-transparent text-white font-semibold text-sm px-1 py-0.5 outline-none w-24 text-center select-all"
                      />
                    </div>
                  );
                }

                return (
                  <button
                    key={page.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("page_index", index.toString());
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const dragIndexStr = e.dataTransfer.getData("page_index");
                      if (!dragIndexStr) return;
                      const dragIndex = parseInt(dragIndexStr, 10);
                      if (isNaN(dragIndex) || dragIndex === index) return;
                      
                      const updatedPages = [...pages];
                      const [movedPage] = updatedPages.splice(dragIndex, 1);
                      updatedPages.splice(index, 0, movedPage);
                      setPages(updatedPages);
                    }}
                    onClick={() => setActivePage(page.id)}
                    onDoubleClick={() => {
                      setEditingPageId(page.id);
                      setEditingPageName(page.name);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setPageContextMenu({ x: e.clientX, y: e.clientY, pageId: page.id });
                    }}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer ${
                      isActive 
                        ? 'bg-[#7A736B] text-white font-semibold shadow-sm' 
                        : 'text-[#4A453F] dark:text-slate-300 hover:bg-[#EAE4DC] dark:hover:bg-white/10 hover:text-[#2C2825] dark:hover:text-white'
                    }`}
                  >
                    {page.name}
                  </button>
                );
              })}
              
              <button
                onClick={handleAddNewPage}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#6E675F] dark:text-slate-400 hover:bg-[#EAE4DC] dark:hover:bg-white/10 hover:text-[#2C2825] dark:hover:text-white transition-colors text-lg font-light ml-0.5 cursor-pointer"
                title="افزودن صفحه جدید"
              >
                +
              </button>
            </div>

            {/* Search Bar */}
            {widgetVisibility.search && (
              <div className="relative w-64 md:w-96" />
            )}
          </div>
          
          {/* Clock Top Widget */}
          <div className="flex items-center gap-2">
            
            {widgetVisibility.clock && <TopClockWidget />}
          </div>
        </div>

        {/* Right Side: Icons (Settings, Profile, Sync, etc) */}
        <div className="flex items-center gap-3">
          
          

                  </div>

      </div>

      {isSettingsOpen && <SettingsScreen onClose={() => setIsSettingsOpen(false)} categories={categories} pages={pages} />}
      
      <AddPageModal
        isOpen={isAddPageModalOpen}
        onClose={() => setIsAddPageModalOpen(false)}
        onSave={(name) => {
          const newId = 'page-' + Date.now();
          setPages([...pages, { id: newId, name }]);
          setActivePage(newId);
          setIsAddPageModalOpen(false);
        }}
      />
      <WallpaperModal isOpen={isWallpaperOpen} onClose={() => setIsWallpaperOpen(false)} />
      <RightSidebar onOpenSettings={() => setIsSettingsOpen(true)} onOpenWallpaper={() => setIsWallpaperOpen(true)} onToggleWidgets={() => setIsEditDashboard(!isEditDashboard)} onOpenImport={onOpenImport} onToggleAIChat={() => setIsAIChatOpen(!isAIChatOpen)} />
      <AIChatPanel isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} bookmarks={bookmarks} categories={categories} />
      <WidgetsPanel isOpen={isEditDashboard} onClose={() => setIsEditDashboard(false)} visibility={widgetVisibility} setVisibility={setWidgetVisibility} />

      {/* Main Grid Scroll Area */}
      <div className="flex-1 px-4 sm:px-6 md:px-8 py-8 w-full">
        
        {/* Title, Color Picker, and View Mode toggler */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8 select-none">
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{currentCategoryName}</h2>
            </div>
            
            
          </div>
          {/* Icon/List View switcher & Filters Toggle */}
          <div className="flex flex-col items-end gap-3">
            <div className="flex bg-slate-900/5 dark:bg-white/5 rounded-full p-1 gap-1">
              <button
                onClick={() => setViewMode("dashboard")}
                title="نمای دستیار"
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  viewMode === "dashboard" 
                    ? "bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm" 
                    : "text-slate-900 dark:text-white/40 hover:text-slate-900 dark:text-white"
                }`}
              >
                دستیار
              </button>
              <button
                onClick={() => setViewMode("grid")}
                title="نمای آیکونی"
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  viewMode === "grid" 
                    ? "bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm" 
                    : "text-slate-900 dark:text-white/40 hover:text-slate-900 dark:text-white"
                }`}
              >
                گرید
              </button>
              <button
                onClick={() => setViewMode("list")}
                title="نمای جزییات لیست"
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  viewMode === "list" 
                    ? "bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm" 
                    : "text-slate-900 dark:text-white/40 hover:text-slate-900 dark:text-white"
                }`}
              >
                لیست
              </button>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                showFilters 
                  ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)] shadow-sm" 
                  : "bg-slate-900/5 dark:bg-white/5 text-slate-900/60 dark:text-white/60 hover:text-slate-900 dark:text-white hover:bg-slate-900/10 dark:bg-white/10"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              فیلترها
            </button>
          </div>
        </div>

        {/* Tag Pill Suggestions for fast filtering */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 mb-8 select-none p-2 bg-current/5 rounded-3xl border border-current/5 items-center animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-1.5 text-xs font-semibold opacity-60 px-2">
              <Tag className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span>فیلتر سریع:</span>
            </div>
            
            <input
              type="text"
              placeholder="تگ سفارشی..."
              value={selectedTag || ""}
              onChange={(e) => setSelectedTag(e.target.value || null)}
              className="bg-current/10 border-none outline-none text-xs rounded-xl px-2.5 py-1 w-24 focus:w-32 transition-all placeholder:text-current/40 text-current"
            />

            {allTags.map((tag, i) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`text-xs px-2.5 py-1 rounded-xl font-medium transition-all ${selectedTag === tag ? 'bg-[var(--color-primary)] text-slate-900 dark:text-white shadow-md' : 'bg-current/5 hover:bg-current/10'}`}
              >
                #{tag}
              </button>
            ))}
            {(searchQuery || selectedTag) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedTag(null);
                }}
                className="text-xs text-blue-600 hover:underline font-bold px-2 ml-auto"
              >
                پاک کردن فیلترها
              </button>
            )}
          </div>
        )}

        {/* DASHBOARD VIEW EXACT MATCH TO IMAGE */}
        {viewMode === "dashboard" && (
          <DraggableDashboard settings={settings} 
            activePage={activePage}
            categories={categories}
            pageBookmarks={pageBookmarks}
            getGlassStyle={getGlassStyle}
            onTriggerAddModal={onTriggerAddModal}
            onAddCategory={onAddCategory}
            onEditCategory={onEditCategory}
            onDropLink={onDropLink}
            onDropLinks={onDropLinks}
            onDeleteCategory={onDeleteCategory}
            widgetVisibility={widgetVisibility}
            onEditBookmark={onEditBookmark}
            onDeleteBookmark={onDeleteBookmark}
            onUpdateBookmark={onUpdateBookmark}
            onRemoveWidget={(widgetKey) => {
              setWidgetVisibility((prev: Record<string, any>) => ({ ...prev, [widgetKey]: false }));
              showToast(`ویجت از داشبورد حذف شد`);
            }}
          />
        )}

        

        {/* GRID VIEW: Small cards layout */}
        {viewMode === "grid" && filteredBookmarks.length > 0 && (
          <div className={`grid gap-4 ${settings.columns === 'Auto' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' : ''}`} style={getGridStyle()}>
            {filteredBookmarks.map((bm) => (
              <div
                key={bm.id}
                draggable onDragStart={(e) => e.dataTransfer.setData("bookmark_id", bm.id)}
                className="flex flex-col p-4 rounded-3xl bg-black/30 backdrop-blur-xl border border-slate-900/10 dark:border-white/10 hover:bg-black/40 transition-all duration-300 relative group shadow-xl h-full cursor-pointer text-right min-h-[160px]"
                onContextMenu={(e) => { e.preventDefault(); setContextMenu({x: e.clientX, y: e.clientY, bookmark: bm}); }}
                onClick={() => handleOpenLink(bm)}
              >
                <div className="flex items-start justify-between mb-3 w-full" dir="ltr">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${bm.gradient} p-0.5 shadow-md flex-shrink-0 relative`}>
                    <div className="w-full h-full bg-white dark:bg-neutral-900 rounded-[14px] flex items-center justify-center p-2">
                      <img
                        src={bm.favicon}
                        alt="favicon"
                        className="w-full h-full object-contain"
                        onError={(e) => {
  const target = e.target as HTMLImageElement;
  if (!target.dataset.fallback) {
    target.dataset.fallback = 'true';
    target.src = `https://logo.clearbit.com/${bm.domain}`;
  }
}}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onToggleFavorite(bm.id); }}
                      className={`p-1.5 rounded-full transition-colors ${
                        bm.favorite 
                          ? "bg-amber-500/20 text-amber-500" 
                          : "bg-slate-900/10 dark:bg-white/10 text-slate-900/40 dark:text-white/40 hover:bg-slate-900/20 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${bm.favorite ? "fill-amber-500" : ""}`} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEditBookmark(bm); }}
                      className="p-1.5 rounded-full bg-slate-900/10 dark:bg-white/10 text-slate-900/40 dark:text-white/40 hover:bg-slate-900/20 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                
                <h3 className={`font-bold text-slate-800 dark:text-white mb-1 line-clamp-1 ${settings.textSize === 'S' ? 'text-xs' : settings.textSize === 'L' ? 'text-base' : 'text-sm'}`}>{bm.title}</h3>
                
                {settings.showDesc && bm.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2 flex-1">{bm.description}</p>
                )}
                {!settings.showDesc && <div className="flex-1"></div>}
                
                <div className="flex flex-wrap items-center justify-between mt-auto pt-3 border-t border-slate-900/10 dark:border-white/10 gap-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[100px]" dir="ltr">{bm.domain}</span>
                  <div className="flex gap-1">
                    {bm.pricing === 'free' && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">رایگان</span>}
                    {bm.pricing === 'paid' && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">پولی</span>}
                    {bm.pricing === 'freemium' && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-[var(--color-primary)]/20 text-[#E3875E] border border-[var(--color-primary)]/20">متوسط</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}


        {/* COMPREHENSIVE CARD LIST VIEW: sleek modern dashboard rows */}
        {viewMode === "list" && filteredBookmarks.length > 0 && (
          <div className="flex flex-col gap-4">
            {filteredBookmarks.map((bm) => (
              <div
                key={bm.id}
                draggable onDragStart={(e) => e.dataTransfer.setData("bookmark_id", bm.id)} className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 rounded-[22.5%] sm:rounded-3xl bg-black/30 backdrop-blur-xl border border-slate-900/10 dark:border-white/10 hover:bg-black/40 transition-all duration-300 relative group shadow-xl" onContextMenu={(e) => { e.preventDefault(); setContextMenu({x: e.clientX, y: e.clientY, bookmark: bm}); }}
              >
                {/* Left profile info, icon, text details */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  
                  {/* Squircle backplate logo container */}
                  <div className={`w-14 h-14 rounded-3xl bg-gradient-to-tr ${bm.gradient} p-0.5 shadow-md flex-shrink-0 relative`}>
                    <div className="w-full h-full bg-white dark:bg-neutral-900 rounded-[14px] flex items-center justify-center p-2">
                      <img
                        src={bm.favicon}
                        alt={bm.title}
                        className="w-full h-full object-contain"
                        onError={(e) => {
  const target = e.target as HTMLImageElement;
  if (!target.dataset.fallback) {
    target.dataset.fallback = 'true';
    target.src = `https://logo.clearbit.com/${bm.domain}`;
  }
}}
                      />
                    </div>
                  </div>

                  <div className="min-w-0 pr-1 text-right">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 onClick={() => handleOpenLink(bm)} className={getTitleClass()}>{bm.title}</h3>
                      {/* Category Chip */}
                      <span className="text-[10px] bg-[var(--color-primary)]/20 text-[var(--color-primary)] px-2 py-0.5 rounded-full font-bold">
                        {bm.category}
                      </span>
                      {bm.pricing === 'free' && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">رایگان</span>}
                      {bm.pricing === 'paid' && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">پولی</span>}
                      {bm.pricing === 'freemium' && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[var(--color-primary)]/20 text-[#E3875E] border border-blue-500/20">متوسط</span>}
                    </div>
                    <p className="text-xs opacity-50 mt-0.5">{bm.domain}</p>
                    {settings.showDesc && (
                    <p className="text-xs opacity-75 mt-1.5 font-medium line-clamp-1 max-w-xl">
                      {bm.description}
                    </p>
                    )}
                  </div>
                </div>

                {/* Tags lists & Click stats */}
                <div className="flex items-center gap-4 mt-4 md:mt-0 flex-shrink-0 self-end md:self-auto w-full md:w-auto justify-end">
                  
                  {/* Small click count pill */}
                  <div className="flex items-center gap-1.5 opacity-60 text-xs px-2.5 py-1 rounded-xl bg-current/5" title="دفعات کلیک">
                    <TrendingUp className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    <span>{bm.clickCount} کلیک</span>
                  </div>

                  {/* Meta tags */}
                  <div className="hidden sm:flex gap-1.5">
                    {bm.tags.map((tag) => (
                      <span key={tag} className="text-[10px] opacity-60 bg-current/5 border border-current/10 px-2 py-0.5 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1.5">
                    
                    {/* Launch */}
                    <button
                      onClick={() => handleOpenLink(bm)}
                      className="p-1.5 rounded-xl hover:bg-current/10 transition-colors text-[var(--color-primary)]"
                      title="بازکردن سایت"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>

                    {/* Favorite Star tool */}
                    <button
                      onClick={() => onToggleFavorite(bm.id)}
                      className={`p-1.5 rounded-xl hover:bg-current/10 transition-colors ${
                        bm.favorite ? "text-amber-500" : "opacity-40 hover:opacity-100"
                      }`}
                      title={bm.favorite ? "حذف از علاقه‌مندی" : "افزودن به علاقه‌مندی"}
                    >
                      <Star className={`w-4 h-4 ${bm.favorite ? "fill-amber-500" : ""}`} />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => onDeleteBookmark(bm.id)}
                      className="p-1.5 rounded-xl hover:bg-red-500/10 transition-colors text-red-500 opacity-0 group-hover:opacity-100"
                      title="حذف کامل بوکمارک"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Edit Option toggle */}
                    <button
                      onClick={() => onEditBookmark(bm)}
                      className="p-1.5 rounded-xl hover:bg-current/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="ویرایش جزییات"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Click Context Menu (F10) */} {contextMenu.bookmark && ( <div className="fixed z-[100] w-48 bg-black/80 backdrop-blur-xl border border-slate-900/10 dark:border-white/10 rounded-3xl shadow-2xl py-2 flex flex-col animate-in fade-in zoom-in-95 duration-100 overflow-hidden" style={{ top: Math.min(contextMenu.y, window.innerHeight - 200), left: Math.min(contextMenu.x, window.innerWidth - 200) }} onContextMenu={(e) => e.preventDefault()} > <button className="flex items-center gap-3 px-4 py-2 hover:bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white/90 hover:text-slate-900 dark:text-white transition-colors text-sm text-right w-full" onClick={() => window.open(contextMenu.bookmark!.url, "_blank")} > باز کردن در تب جدید </button> <button className="flex items-center gap-3 px-4 py-2 hover:bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white/90 hover:text-slate-900 dark:text-white transition-colors text-sm text-right w-full" onClick={() => { navigator.clipboard.writeText(contextMenu.bookmark!.url); setToastMessage("آدرس سایت کپی شد!"); setTimeout(() => setToastMessage(null), 3000); }} > کپی کردن لینک </button> <button className="flex items-center gap-3 px-4 py-2 hover:bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white/90 hover:text-slate-900 dark:text-white transition-colors text-sm text-right w-full" onClick={() => {onToggleFavorite(contextMenu.bookmark!.id); setContextMenu({x:0,y:0,bookmark:null});}} > افزودن به علاقه‌مندی‌ها </button>
 <button className="flex items-center gap-3 px-4 py-2 hover:bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white/90 hover:text-slate-900 dark:text-white transition-colors text-sm text-right w-full" onClick={() => {if (onToggleReadLater) onToggleReadLater(contextMenu.bookmark!.id); setContextMenu({x:0,y:0,bookmark:null});}} > {contextMenu.bookmark!.readLater ? 'حذف از بعدا می‌خوانم' : 'بعدا می‌خوانم'} </button> <div className="h-px w-full bg-slate-900/10 dark:bg-white/10 my-1"></div> <button className="flex items-center gap-3 px-4 py-2 hover:bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white/90 hover:text-slate-900 dark:text-white transition-colors text-sm text-right w-full" onClick={() => onEditBookmark(contextMenu.bookmark!)} > ویرایش </button> <button className="flex items-center gap-3 px-4 py-2 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors text-sm text-right w-full" onClick={() => onDeleteBookmark(contextMenu.bookmark!.id)} > حذف </button> </div> )} {/* Interactive Beautiful In-App Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900/90 dark:bg-neutral-100/95 dark:text-neutral-900 text-slate-900 dark:text-white font-semibold text-center text-xs py-3.5 px-6 rounded-3xl shadow-2xl flex items-center gap-3 animate-bounce select-none border border-current/10 max-w-sm">
          <span>{toastMessage}</span>
        </div>
      )}
      {/* Page Context Menu */}
      {pageContextMenu && (
        <div 
          className="fixed z-50 bg-[#E5E9EC] dark:bg-[#2D333B] rounded-xl shadow-xl py-1 w-40 border border-white/40 dark:border-white/10"
          style={{ top: pageContextMenu.y, left: pageContextMenu.x }}
          dir="ltr"
        >
          <button 
            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-slate-200/50 dark:hover:bg-white/5 flex items-center gap-2 transition-colors font-medium"
            onClick={() => {
              if (pages.length > 1) {
                setPages(p => p.filter(page => page.id !== pageContextMenu.pageId));
                if (activePage === pageContextMenu.pageId) {
                  setActivePage(pages.find(p => p.id !== pageContextMenu.pageId)?.id || pages[0].id);
                }
              } else {
                alert("Cannot delete the last page.");
              }
              setPageContextMenu(null);
            }}
          >
            <Trash2 className="w-4 h-4" /> Delete board
          </button>
        </div>
      )}    </div>
  );
}
