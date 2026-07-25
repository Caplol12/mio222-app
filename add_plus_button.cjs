const fs = require('fs');
let code = fs.readFileSync('src/components/BookmarkGrid.tsx', 'utf-8');

const oldTabs = `              {pages.map(page => (
                <button
                  key={page.id}
                  onClick={() => setActivePage(page.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setPageContextMenu({ x: e.clientX, y: e.clientY, pageId: page.id });
                  }}
                  className={\`px-5 py-2 rounded-full text-[13px] font-semibold transition-all \${activePage === page.id ? 'bg-[var(--color-primary)] text-slate-900 dark:text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/5'}\`}
                >
                  {page.name}
                </button>
              ))}
            </div>`;

const newTabs = `              {pages.map(page => (
                <button
                  key={page.id}
                  onClick={() => setActivePage(page.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setPageContextMenu({ x: e.clientX, y: e.clientY, pageId: page.id });
                  }}
                  className={\`px-5 py-2 rounded-full text-[13px] font-semibold transition-all \${activePage === page.id ? 'bg-[var(--color-primary)] text-slate-900 dark:text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/5'}\`}
                >
                  {page.name}
                </button>
              ))}
              
              <button
                onClick={() => setIsAddPageModalOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors ml-1"
                title="افزودن صفحه"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>`;

code = code.replace(oldTabs, newTabs);

const oldModals = `      <SettingsScreen isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />`;
const newModals = `      <SettingsScreen isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      
      <AddPageModal
        isOpen={isAddPageModalOpen}
        onClose={() => setIsAddPageModalOpen(false)}
        onSave={(name) => {
          const newId = 'page-' + Date.now();
          setPages([...pages, { id: newId, name }]);
          setActivePage(newId);
          setIsAddPageModalOpen(false);
        }}
      />`;

code = code.replace(oldModals, newModals);

fs.writeFileSync('src/components/BookmarkGrid.tsx', code);
