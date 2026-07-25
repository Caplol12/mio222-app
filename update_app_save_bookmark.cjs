const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const targetFunc = `  const handleSaveBookmark = useCallback((bookmarkData: Partial<Bookmark>) => {
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
      const newBookmark: Bookmark = {
        pageId: activePage,
        id: "bm-" + Date.now().toString(),
        url: bookmarkData.url || "",
        title: bookmarkData.title || "Untitled",
        description: bookmarkData.description || "ثبت شده در آرشیو",
        favicon: bookmarkData.favicon || \`https://www.google.com/s2/favicons?sz=128&domain=\${bookmarkData.domain || "link"}\`,
        category: bookmarkData.category || "عمومی",
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
  }, [bookmarks, bookmarkToEdit, saveBookmarks, activePage]);`;

const repl = `  const { settings } = useSettings();
  
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
        description: bookmarkData.description || "ثبت شده در آرشیو",
        favicon: bookmarkData.favicon || \`https://www.google.com/s2/favicons?sz=128&domain=\${bookmarkData.domain || "link"}\`,
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
  }, [bookmarks, bookmarkToEdit, saveBookmarks, activePage, settings.saveToPage, settings.saveToBoard, pages]);`;

code = code.replace(targetFunc, repl);
// Also need to remove the duplicate `const { settings } = useSettings();` if it exists.
code = code.replace(/const { settings } = useSettings\(\);\s+const { settings } = useSettings\(\);/, 'const { settings } = useSettings();');

fs.writeFileSync('src/App.tsx', code);
