import { useAuth } from './contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import React, { useState, useEffect, useCallback } from "react";
import BookmarkGrid from "./components/BookmarkGrid";
import AddCategoryModal from "./components/AddCategoryModal";
import AddBookmarkModal from "./components/AddBookmarkModal";
import ImportBookmarksModal, { ParsedFolder } from "./components/ImportBookmarksModal";
import { Bookmark, ThemeMode, CategoryItem, INITIAL_CATEGORIES } from "./types";
import { useSettings } from "./contexts/SettingsContext";
import { PRESET_BOOKMARKS } from "./presets";
import { 
  Download, 
  Upload, 
  Sparkles, 
  Info,
  Calendar,
  Layers,
  Heart,
  Smartphone
} from "lucide-react";

export default function App() {
  const { user, isLoading: authLoading, logout } = useAuth();

  
  const { settings: appSettings } = useSettings();
  


  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [folderThemes, setFolderThemes] = useState<Record<string, ThemeMode>>({});
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // Modal controllers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [bookmarkToEdit, setBookmarkToEdit] = useState<Bookmark | null>(null);
  const [pages, setPages] = useState<{id: string, name: string}[]>(() => { 
    try { 
      const s = localStorage.getItem("dash_pages"); 
      if (s) {
        const parsed = JSON.parse(s);
        const unique = Array.from(new Map(parsed.map((p: any) => [p.id, p])).values()) as {id: string, name: string}[];
        return unique.length > 0 ? unique : [{id: "home", name: "Home"}];
      }
      return [{id: "home", name: "Home"}]; 
    } catch { 
      return [{id: "home", name: "Home"}]; 
    }
  });
  const [activePage, setActivePage] = useState("home");
  useEffect(() => { localStorage.setItem("dash_pages", JSON.stringify(pages)); }, [pages]);
    
  
  

  // Load bookmarks and theme and cache from localStorage on mount
  useEffect(() => {
    const savedCategories = localStorage.getItem("stash_categories");
    if (savedCategories) {
      try {
        const parsed: CategoryItem[] = JSON.parse(savedCategories);
        const uniqueCategories = Array.from(new Map(parsed.map((item: CategoryItem) => [item.id, item])).values()) as CategoryItem[];
        const finalCategories = uniqueCategories.length > 0 ? uniqueCategories : INITIAL_CATEGORIES;
        setCategories(finalCategories);
        localStorage.setItem("stash_categories", JSON.stringify(finalCategories));
      } catch (e) {
        setCategories(INITIAL_CATEGORIES);
        localStorage.setItem("stash_categories", JSON.stringify(INITIAL_CATEGORIES));
      }
    } else {
      setCategories(INITIAL_CATEGORIES);
      localStorage.setItem("stash_categories", JSON.stringify(INITIAL_CATEGORIES));
    }

    const savedBookmarks = localStorage.getItem("stash_bookmarks");
    if (savedBookmarks) {
      try {
        const parsed: Bookmark[] = JSON.parse(savedBookmarks);
        const map = new Map<string, Bookmark>();
        for (let i = parsed.length - 1; i >= 0; i--) {
          if (parsed[i] && parsed[i].url) {
            map.set(parsed[i].url, parsed[i]);
          }
        }
        const uniqueBookmarks = Array.from(map.values()).reverse();
        setBookmarks(uniqueBookmarks);
        localStorage.setItem("stash_bookmarks", JSON.stringify(uniqueBookmarks));
      } catch (e) {
        setBookmarks([]);
        localStorage.setItem("stash_bookmarks", JSON.stringify([]));
      }
    } else {
      setBookmarks([]);
      localStorage.setItem("stash_bookmarks", JSON.stringify([]));
    }

    const savedFolderThemes = localStorage.getItem("stash_folder_themes");
    if (savedFolderThemes) {
      try {
        setFolderThemes(JSON.parse(savedFolderThemes));
      } catch (e) {
        // Default empty
      }
    } else {
      const savedTheme = localStorage.getItem("stash_theme");
      if (savedTheme) {
        setFolderThemes({ all: savedTheme as ThemeMode });
      }
    }
  }, []);

  // Save to localStorage when bookmarks state edits
  const saveBookmarks = useCallback((updatedBookmarks: Bookmark[] | ((prev: Bookmark[]) => Bookmark[])) => {
    setBookmarks((prev) => {
      const nextBookmarks = typeof updatedBookmarks === 'function' ? updatedBookmarks(prev) : updatedBookmarks;
      // Preserve unique bookmarks by id to allow duplicate URLs across different categories/pages
      const map = new Map<string, Bookmark>();
      for (let i = nextBookmarks.length - 1; i >= 0; i--) {
        if (nextBookmarks[i] && nextBookmarks[i].id) {
          map.set(nextBookmarks[i].id, nextBookmarks[i]);
        }
      }
      const uniqueBookmarks = Array.from(map.values()).reverse();
      localStorage.setItem("stash_bookmarks", JSON.stringify(uniqueBookmarks));
      return uniqueBookmarks;
    });
  }, []);

  const handleAddCategory = useCallback((name: string, isPrivate?: boolean, password?: string, isSmart?: boolean, smartTags?: string[]) => {
    const newCategory: CategoryItem = {
      id: "cat-" + Date.now(),
      name,
      icon: isPrivate ? "lock" : isSmart ? "cpu" : "folder",
      isPrivate,
      password,
      isSmart,
      smartTags
    };
    const updated = [...categories, newCategory];
    setCategories(updated);
    localStorage.setItem("stash_categories", JSON.stringify(updated));
  }, [categories]);

  const currentThemeMode = folderThemes["global"] || folderThemes["all"] || "ios-dark";

  // Handle AI Auto Organize Action
  const handleOrganizeBookmarksAI = useCallback(({ categories: newCatNames, assignments }: { categories: string[]; assignments: Record<string, string[]> }) => {
    // 1. Ensure 'ai list' page exists or create it
    let aiPageId = pages.find(p => p.name.toLowerCase() === 'ai list')?.id;
    if (!aiPageId) {
      aiPageId = 'page-ai-list-' + Date.now();
      const updatedPages = [...pages, { id: aiPageId, name: 'ai list' }];
      setPages(updatedPages);
      localStorage.setItem('stash_pages', JSON.stringify(updatedPages));
    }
    setActivePage(aiPageId);

    // 2. Create Categories for AI groups if they don't exist
    const updatedCategories = [...categories];
    const categoryNameToId: Record<string, string> = {};

    newCatNames.forEach((catName, index) => {
      let existingCat = updatedCategories.find(c => c.name.trim() === catName.trim());
      if (!existingCat) {
        existingCat = {
          id: 'cat-ai-' + Date.now() + '-' + index,
          name: catName.trim(),
          icon: 'folder'
        };
        updatedCategories.push(existingCat);
      }
      categoryNameToId[catName.trim()] = existingCat.id;
    });

    setCategories(updatedCategories);
    localStorage.setItem('stash_categories', JSON.stringify(updatedCategories));

    // 3. Create duplicates/copies for 'ai list' page so original bookmarks stay intact in their original pages
    setBookmarks(prevBookmarks => {
      // Remove any previously generated AI list copies to prevent duplication on multiple runs
      const existingNonAiBookmarks = prevBookmarks.filter(bm => !bm.id.endsWith('-ai-copy'));
      
      const aiCopies: Bookmark[] = [];

      existingNonAiBookmarks.forEach(bm => {
        // Find which Category AI assigned this bookmark to
        let targetCategoryName: string | undefined;
        for (const [catName, bmIds] of Object.entries(assignments)) {
          if (Array.isArray(bmIds) && bmIds.includes(bm.id)) {
            targetCategoryName = catName;
            break;
          }
        }

        if (targetCategoryName && categoryNameToId[targetCategoryName]) {
          const targetCatId = categoryNameToId[targetCategoryName];
          aiCopies.push({
            ...bm,
            id: bm.id + '-ai-copy',
            category: targetCatId,
            categoryId: targetCatId,
            pageId: aiPageId
          });
        }
      });

      const updatedBookmarks = [...existingNonAiBookmarks, ...aiCopies];
      localStorage.setItem('stash_bookmarks', JSON.stringify(updatedBookmarks));
      return updatedBookmarks;
    });
  }, [pages, categories, setPages, setActivePage, setCategories, setBookmarks]);
  const handleExportData = useCallback(() => {
    const data = {
      bookmarks,
      categories: categories.filter(c => !INITIAL_CATEGORIES.find(ic => ic.id === c.id)),
      theme: currentThemeMode
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dastyar-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [bookmarks, categories, currentThemeMode]);

    // Sync theme config changes (Global Theme)
  const handleSetThemeMode = useCallback((mode: ThemeMode) => {
    setFolderThemes(prev => {
      const updated = { ...prev, global: mode };
      localStorage.setItem("stash_folder_themes", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleImportData = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.bookmarks) {
          const uniqueBookmarks = Array.from(new Map(data.bookmarks.map((item: Bookmark) => [item.url, item])).values()) as Bookmark[];
          setBookmarks(uniqueBookmarks);
          localStorage.setItem("stash_bookmarks", JSON.stringify(uniqueBookmarks));
        }
        if (data.categories) {
          const combined = [...INITIAL_CATEGORIES, ...data.categories];
          const uniqueCategories = Array.from(new Map(combined.map((item: CategoryItem) => [item.id, item])).values()) as CategoryItem[];
          setCategories(uniqueCategories);
          localStorage.setItem("stash_categories", JSON.stringify(uniqueCategories));
        }
        if (data.theme) {
          handleSetThemeMode(data.theme);
        }
        alert("اطلاعات با موفقیت بازیابی شد!");
      } catch (err) {
        alert("خطا در خواندن فایل پشتیبان");
      }
    };
    reader.readAsText(file);
    // Reset file input
    event.target.value = '';
  }, [handleSetThemeMode]);

  
  
  const handleEditCategory = useCallback((id: string, name: string) => {
    setCategories(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, name } : c);
      localStorage.setItem("stash_categories", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleDeleteCategory = useCallback((id: string) => {
    const targetCat = categories.find(c => c.id === id);
    const catName = targetCat?.name;

    setCategories(prev => {
      const updated = prev.filter(c => c.id !== id);
      localStorage.setItem("stash_categories", JSON.stringify(updated));
      return updated;
    });
    saveBookmarks(prev => prev.filter(b => b.category !== id && (catName ? b.category !== catName : true)));
    if (activeCategory === id) {
      setActiveCategory("all");
    }
  }, [categories, activeCategory, saveBookmarks]);

  const handleUpdateCategoryGradient = useCallback((id: string, gradient: string) => {
    setCategories(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, gradient } : c);
      localStorage.setItem("stash_categories", JSON.stringify(updated));
      return updated;
    });
  }, []);



  

  // Toggle favorite tag
  const handleToggleReadLater = useCallback((id: string) => {
    const updated = bookmarks.map((bm) => {
      if (bm.id === id) {
        return { ...bm, readLater: !bm.readLater };
      }
      return bm;
    });
    saveBookmarks(updated);
  }, [bookmarks, saveBookmarks]);

  const handleToggleFavorite = useCallback((id: string) => {
    const updated = bookmarks.map((bm) => {
      if (bm.id === id) {
        return { ...bm, favorite: !bm.favorite };
      }
      return bm;
    });
    saveBookmarks(updated);
  }, [bookmarks, saveBookmarks]);

  // Delete bookmark entirely
  const handleDeleteBookmark = useCallback(async (id: string) => {
    const updated = bookmarks.filter((bm) => bm.id !== id);
    saveBookmarks(updated);
  }, [bookmarks, saveBookmarks]);

  // Open modal in edit mode
  const handleTriggerEdit = useCallback((bookmark: Bookmark) => {
    setBookmarkToEdit(bookmark);
    setIsModalOpen(true);
  }, []);

  // Save or edit action confirmed from Modal

  const handleImportFolder = async (folder: ParsedFolder) => {
    // Generate a secure category ID or find existing one
    let catId = categories.find(c => c.name === folder.name)?.id;
    if (!catId) {
      catId = Math.random().toString(36).substring(7);
      const newCat = {
        id: catId,
        name: folder.name, icon: "Folder",
        userId: "local",
        order: categories.length,
        gradient: "from-blue-500 to-indigo-500",
        createdAt: Date.now()
      };
      
      setCategories(prev => [...prev, newCat]);
      
      localStorage.setItem("stash_categories", JSON.stringify([...categories, newCat]));
    }
    
    // Add bookmarks
    const newBookmarks = folder.bookmarks.map(b => {
      let domain = "";
      try { domain = new URL(b.url).hostname; } catch(e) {}
      
      return {
        id: Math.random().toString(36).substring(7),
        userId: "local",
        title: b.title,
        url: b.url,
        domain: domain,
        description: "",
        category: catId,
        pageId: "home",
        tags: [],
        pricing: 'free' as 'free' | 'paid' | 'freemium',
        favorite: false,
        favicon: b.icon || `https://logo.clearbit.com/${domain}`,
        gradient: "from-blue-500 to-indigo-500",
        createdAt: Date.now(),
        clickCount: 0,
      };
    });
    
    setBookmarks(prev => {
      const combined = [...prev, ...newBookmarks];
      const uniqueBookmarks = Array.from(new Map(combined.map(item => [item.url, item])).values()) as Bookmark[];
      localStorage.setItem("stash_bookmarks", JSON.stringify(uniqueBookmarks));
      return uniqueBookmarks;
    });
  };

  const { settings } = useSettings();
  
  const handleSaveBookmark = useCallback((bookmarkData: Partial<Bookmark>) => {
    if (bookmarkToEdit) {
      // Editing Mode
      const updated = bookmarks.map((bm) => {
        if (bm.id === bookmarkToEdit.id) {
          return {
            ...bm,
            ...bookmarkData,
            domain: bookmarkData.domain || bm.domain,
            favicon: bookmarkData.favicon || bm.favicon
          } as Bookmark;
        }
        return bm;
      });
      saveBookmarks(updated);
      setBookmarkToEdit(null);
    } else {
      // New Bookmark creation Mode
      let targetPageId = activePage;
      if (settings.saveToPage && settings.saveToPage !== 'Home') {
        const matchingPage = pages.find(p => p.name === settings.saveToPage);
        if (matchingPage) {
          targetPageId = matchingPage.id;
        }
      } else if (settings.saveToPage === 'Home') {
        targetPageId = 'home';
      }

      const newBookmark: Bookmark = {
        pageId: targetPageId,
        id: "bm-" + Date.now().toString(),
        url: bookmarkData.url || "",
        title: bookmarkData.title || "Untitled",
        description: bookmarkData.description || "",
        favicon: bookmarkData.favicon || `https://www.google.com/s2/favicons?sz=128&domain=${bookmarkData.domain || "link"}`,
        category: bookmarkData.category || (settings.saveToBoard || "عمومی"),
        gradient: bookmarkData.gradient || "from-blue-500 to-sky-600",
        tags: bookmarkData.tags || ["Bookmark"],
        domain: bookmarkData.domain || "link",
        favorite: false,
        createdAt: Date.now(),
        clickCount: 0,
        pricing: bookmarkData.pricing || "free"
      };
      saveBookmarks([newBookmark, ...bookmarks]);
    }
  }, [bookmarks, bookmarkToEdit, saveBookmarks, activePage, settings.saveToPage, settings.saveToBoard, pages]);

  const handleDropLinks = useCallback(async (urls: string[], categoryId: string) => {
    if (!urls || urls.length === 0) return;

    let finalCategory = categoryId;
    if (finalCategory === "all" || finalCategory === "favs") {
      finalCategory = "عمومی";
    }

    // Clean up URLs
    const cleanedUrls = urls.map(u => {
      let trimmed = u.trim();
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        trimmed = 'https://' + trimmed;
      }
      return trimmed;
    }).filter(u => u.length > 5);

    if (cleanedUrls.length === 0) return;

    const initialBookmarks: Bookmark[] = cleanedUrls.map((url, index) => {
      let domain = "link";
      try {
        domain = new URL(url).hostname;
      } catch {}
      return {
        id: "bm-" + Date.now().toString() + "-" + index + "-" + Math.random().toString(36).substring(7),
        url: url,
        title: domain,
        description: "",
        favicon: `https://www.google.com/s2/favicons?sz=128&domain=${domain}`,
        category: finalCategory,
        gradient: "from-blue-500 to-sky-600",
        tags: ["Bookmark"],
        domain: domain,
        favorite: categoryId === "favs",
        createdAt: Date.now() + index,
        clickCount: 0,
        pricing: "free",
        pageId: activePage !== "home" ? activePage : "home"
      } as Bookmark;
    });

    saveBookmarks(prev => [...initialBookmarks, ...prev]);

    // Process scraping in background in parallel batches of 5
    const batchSize = 5;
    for (let i = 0; i < cleanedUrls.length; i += batchSize) {
      const batch = cleanedUrls.slice(i, i + batchSize);
      await Promise.all(batch.map(async (url) => {
        try {
          const response = await fetch("/api/scrape", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url })
          });
          if (response.ok) {
            const scrapedData = await response.json();
            saveBookmarks(prev => prev.map(bm => {
              if (bm.url === url) {
                return {
                  ...bm,
                  title: scrapedData.title || bm.title,
                  description: scrapedData.description || bm.description,
                  favicon: scrapedData.favicon || bm.favicon,
                  gradient: scrapedData.gradient || bm.gradient,
                  domain: scrapedData.domain || bm.domain,
                  tags: scrapedData.tags || bm.tags,
                };
              }
              return bm;
            }));
          }
        } catch (e) {
          // Keep fallback
        }
      }));
    }
  }, [saveBookmarks, activePage]);

  const handleDropLink = useCallback(async (url: string, categoryId: string, isInternalId = false) => {
    if (isInternalId) {
      const updated = bookmarks.map(b => b.id === url ? { ...b, category: categoryId } : b);
      saveBookmarks(updated);
      return;
    }
    await handleDropLinks([url], categoryId);
  }, [bookmarks, saveBookmarks, handleDropLinks]);

  // Export backups as JSON
  const handleExportBackup = () => {
    const dataStr = JSON.stringify(bookmarks, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = "stash-bookmarks-backup.json";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  // Import backups from JSON
  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = event.target.files?.[0];
    if (!file) return;

    fileReader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedData)) {
          // Perform basic schema validation
          const isValid = importedData.every(
            (item) => item.id && item.url && item.title && item.category
          );
          if (isValid) {
            const newBookmarks = importedData.map((newBm) => ({
              ...newBm,
              id: newBm.id || ("bm-" + Date.now().toString() + "-" + Math.random().toString(36).substring(7))
            }));
            saveBookmarks([...newBookmarks, ...bookmarks]);
            alert("بوکمارک‌های شما با موفقیت وارد شدند! 🎉");
          } else {
            alert("ساختار فایل پشتیبان معتبر نیست.");
          }
        }
      } catch (err) {
        alert("خطا در خواندن فایل وارد شده.");
      }
    };
    fileReader.readAsText(file);
  };

  // Calculate bookmark counts per category
  const bookmarkCounts: Record<string, number> = {
    all: bookmarks.filter(bm => activePage === "home" ? (!bm.pageId || bm.pageId === "home") : bm.pageId === activePage).length,
    favs: bookmarks.filter(b => b.favorite && (activePage === "home" ? (!b.pageId || b.pageId === "home") : b.pageId === activePage)).length
  };
  
  bookmarks.filter(bm => activePage === "home" ? (!bm.pageId || bm.pageId === "home") : bm.pageId === activePage).forEach((b) => {
    bookmarkCounts[b.category] = (bookmarkCounts[b.category] || 0) + 1;
  });


  const getAppClasses = () => {
    let bgClass = "bg-slate-50 dark:bg-black/90";
    if (appSettings.backgroundType === 'video' || appSettings.backgroundType === 'image') {
      bgClass = "bg-transparent dark:bg-transparent";
    }
    return `min-h-screen w-full flex flex-col lg:flex-row rtl transition-all duration-500 pb-24 lg:pb-0 ${bgClass} text-slate-900 dark:text-white overflow-x-hidden`;
  };

  // Theme styling adapters mapping
  const getThemeClasses = () => {
    switch (currentThemeMode) {
      case "ios-light":
        return "bg-slate-50 text-slate-900 antialiased font-sans selection:bg-blue-500/30";
      case "glass-cosmic":
        return "bg-[#110B1F] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-[#110B1F] to-black text-violet-50 antialiased font-sans selection:bg-purple-500/30";
      case "sunset-glow":
        return "bg-gradient-to-b from-[#F27A9B] via-[#E65C83] to-[#125884] text-amber-50 antialiased font-sans selection:bg-orange-500/30";
      case "nature-breeze":
        return "bg-green-950 text-emerald-50 antialiased font-sans selection:bg-green-500/30";
      case "ocean-wave":
        return "bg-cyan-950 text-cyan-50 antialiased font-sans selection:bg-cyan-500/30";
      case "cyberpunk":
        return "bg-zinc-950 text-yellow-50 antialiased font-sans selection:bg-yellow-500/30";
      case "ios-dark":
      default:
        return "bg-[#0A0A0B] text-slate-900 dark:text-white antialiased font-sans selection:bg-blue-500/30";
    }
  };

  

  

    

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B] text-white">در حال بارگذاری...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className={getAppClasses()}>
      {/* Responsive & Mobile-friendly Background Image / Gradient Layer */}
      {appSettings.backgroundType === 'image' && appSettings.backgroundUrl && (
        <div 
          className="fixed inset-0 w-full h-full pointer-events-none z-[-2] bg-cover bg-center bg-no-repeat transition-all duration-500"
          style={{ 
            backgroundImage: `url(${appSettings.backgroundUrl})`,
            transform: 'translateZ(0)',
            WebkitTransform: 'translateZ(0)'
          }}
        />
      )}

      {appSettings.backgroundType === 'gradient' && appSettings.backgroundUrl && (
        <div 
          className="fixed inset-0 w-full h-full pointer-events-none z-[-2] transition-all duration-500"
          style={{ background: appSettings.backgroundUrl }}
        />
      )}

      {appSettings.backgroundType === 'video' && appSettings.backgroundUrl && (
        <video 
          key={appSettings.backgroundUrl}
          autoPlay 
          loop 
          muted 
          playsInline
          className="fixed inset-0 w-full h-full object-cover z-[-1]"
        >
          <source src={appSettings.backgroundUrl} type="video/mp4" />
        </video>
      )}
      

      {/* Main Container Dashboard */}
      <main className={`flex-grow min-w-0 min-h-screen flex flex-col transition-all duration-300`}>
        
        {/* Decorative dynamic background glow */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full filter blur-[120px] pointer-events-none z-0"></div>

        <div className="flex-1 min-w-0 flex flex-col z-10">
          
          {/* Main List display */}
          <BookmarkGrid
              pages={pages}
              setPages={setPages}
              activePage={activePage}
              setActivePage={setActivePage}
            categories={categories}
            bookmarks={bookmarks}
            onUpdateCategoryGradient={handleUpdateCategoryGradient}
            onToggleFavorite={handleToggleFavorite}
        onToggleReadLater={handleToggleReadLater}
            onAddCategory={(name) => { if (name) handleAddCategory(name); else setIsAddCategoryModalOpen(true); }}
            onEditCategory={handleEditCategory}
            onDropLink={handleDropLink}
            onDropLinks={handleDropLinks}
            onDeleteCategory={handleDeleteCategory}
            onDeleteBookmark={handleDeleteBookmark}
            onUpdateBookmark={(id, updates) => {
              const updated = bookmarks.map(bm => bm.id === id ? { ...bm, ...updates } : bm);
              saveBookmarks(updated);
            }}
            onEditBookmark={handleTriggerEdit}
            onTriggerAddModal={(pageId) => {
              if (pageId) setActivePage(pageId);
              setBookmarkToEdit(null);
              setIsModalOpen(true);
            }}
            onOpenImport={() => setIsImportModalOpen(true)}
            onOrganizeBookmarks={handleOrganizeBookmarksAI}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />
        </div>

        {/* Dynamic status overview panel */}
        <footer className="mt-auto h-20 px-10 border-t border-slate-900/5 dark:border-white/5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <button onClick={logout} className="flex items-center gap-1.5 hover:text-red-500 transition-colors font-bold cursor-pointer text-red-400">خروج</button>
            <span className="hidden xl:inline opacity-30">|</span>
            <div className="flex items-center gap-1.5 font-semibold">
              <Smartphone className="w-4 h-4 text-blue-500" />
              <span>پشتیبانی کامل از تاچ iOS و واکنش‌گرا</span>
            </div>
            <span className="hidden xl:inline opacity-30">|</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>آخرین همگام‌سازی لوکال: امروز</span>
            </div>
          </div>

          {/* Backup / Export actions (Sleek corner links) */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 hover:text-blue-500 transition-colors font-bold cursor-pointer"
              title="بارگیری فایل پشتیبانی بوکمارک‌ها"
            >
              <Download className="w-3.5 h-3.5" />
              <span>پشتیبان‌گیری (Export JSON)</span>
            </button>
            <span className="opacity-30">|</span>
            <label
              className="flex items-center gap-1.5 hover:text-blue-500 transition-colors font-bold cursor-pointer"
              title="بارگذاری فایل پشتیبانی بوکمارک‌ها"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>بازیابی (Import JSON)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </footer>
      
      {isImportModalOpen ? (
        <ImportBookmarksModal 
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportFolder}
        />
      ) : null}
    </main>

      {/* Add New or Edit Bookmark Dialog Modal (Gemini scraper powered) */}
      <AddBookmarkModal
        categories={categories}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setBookmarkToEdit(null);
        }}
        onSave={handleSaveBookmark}
        bookmarkToEdit={bookmarkToEdit}
        activeCategory={activeCategory}
      />
      <AddCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        onSave={handleAddCategory}
      />
    </div>
  );
}
