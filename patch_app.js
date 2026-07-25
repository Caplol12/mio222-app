const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const categoryActions = `
  const handleEditCategory = useCallback((id: string, name: string) => {
    setCategories(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, name } : c);
      if (user) {
        const categoryToUpdate = updated.find(c => c.id === id);
        if (categoryToUpdate) {
          setDoc(doc(db, "categories", categoryToUpdate.id), { ...categoryToUpdate, userId: user.uid }, { merge: true }).catch(console.error);
        }
      } else {
        localStorage.setItem("stash_categories", JSON.stringify(updated));
      }
      return updated;
    });
  }, [user]);

  const handleDeleteCategory = useCallback((id: string) => {
    if (confirm("آیا از حذف این پوشه اطمینان دارید؟ بوکمارک‌های داخل آن به پوشه عمومی منتقل می‌شوند.")) {
      setCategories(prev => {
        const updated = prev.filter(c => c.id !== id);
        if (user) {
          deleteDoc(doc(db, "categories", id)).catch(console.error);
        } else {
          localStorage.setItem("stash_categories", JSON.stringify(updated));
        }
        return updated;
      });
      setBookmarks(prev => {
        const updated = prev.map(b => b.category === id ? { ...b, category: "عمومی" } : b);
        saveBookmarks(updated);
        return updated;
      });
      if (activeCategory === id) {
        setActiveCategory("all");
      }
    }
  }, [activeCategory, saveBookmarks, user]);
`;

code = code.replace('const handleUpdateCategoryGradient = useCallback((id: string, gradient: string) => {', categoryActions + '\n  const handleUpdateCategoryGradient = useCallback((id: string, gradient: string) => {');

// We also need to add these to the return JSX.
// Where CanvasView is rendered:
const canvasRenderStr = `
          <CanvasView 
            categories={categories}
            bookmarks={bookmarks}
            onOpenLink={handleOpenLink}
          />
`;
// Let's check how CanvasView is rendered.
