const fs = require('fs');
let code = fs.readFileSync('src/components/DraggableDashboard.tsx', 'utf-8');

// 1. Add props
code = code.replace(
  '  onUpdateBookmark?: (id: string, updates: Partial<Bookmark>) => void;',
  '  onUpdateBookmark?: (id: string, updates: Partial<Bookmark>) => void;\n  onEditCategory?: (cat: CategoryItem) => void;\n  onDeleteCategory?: (id: string) => void;'
);

code = code.replace(
  '  onDeleteBookmark,\n  onUpdateBookmark\n}: {',
  '  onDeleteBookmark,\n  onUpdateBookmark,\n  onEditCategory,\n  onDeleteCategory\n}: {'
);

// 2. Replace the header section
const regexHeader = /<div className="flex items-center justify-between px-1 mb-2">[\s\S]*?<div className="flex flex-col gap-0\.5">/;
const newHeader = `<div className="flex items-center justify-between px-1 mb-2">
            <h3 className="font-bold text-slate-800 dark:text-white text-[15px]" dir="rtl">{cat.name}</h3>
            <div className="flex items-center gap-1 text-slate-400 relative">
              <button onClick={() => onTriggerAddModal?.()} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors">
                <Plus className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
              
              {/* Category 3-dot Menu */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === \`cat-\${cat.id}\` ? null : \`cat-\${cat.id}\`);
                  setInlineEditId(null);
                }}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors data-[open=true]:bg-black/5 dark:data-[open=true]:bg-white/10"
                data-open={openMenuId === \`cat-\${cat.id}\`}
              >
                <MoreHorizontal className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
              
              {openMenuId === \`cat-\${cat.id}\` && (
                <div onClick={e => e.stopPropagation()} className="absolute right-0 top-full mt-1 z-[9999] w-48 bg-white dark:bg-[#2C2C2E] border border-slate-900/10 dark:border-white/10 rounded-xl shadow-2xl py-1 animate-in fade-in zoom-in-95 duration-100 text-[13px]" dir="ltr">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(null);
                      onEditCategory?.(cat);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-900/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <span className="font-serif italic text-[14px] w-3.5 h-3.5 flex items-center justify-center opacity-70">T</span>
                    <span>Rename</span>
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
                    <span>Open all links</span>
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
                    <span>Delete board</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-0.5">`;

code = code.replace(regexHeader, newHeader);
fs.writeFileSync('src/components/DraggableDashboard.tsx', code);
