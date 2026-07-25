const fs = require('fs');
let code = fs.readFileSync('src/components/BookmarkGrid.tsx', 'utf-8');

const regex = /\s*\{\/\* Icon\/List View switcher \*\/\}\s*<div className="flex bg-slate-900\/5 dark:bg-white\/5 rounded-full p-1 gap-1">[\s\S]*?<\/div>\s*<\/div>\s*\{\/\* Tag Pill Suggestions for fast filtering \*\/\}\s*<div className="flex flex-wrap gap-2 mb-8 select-none p-2 bg-current\/5 rounded-3xl border border-current\/5 items-center">[\s\S]*?<\/div>\s*\{\/\* Blank state if no bookmarks match \*\/\}/;

const replacement = `
          {/* Icon/List View switcher & Filters Toggle */}
          <div className="flex flex-col items-end gap-3">
            <div className="flex bg-slate-900/5 dark:bg-white/5 rounded-full p-1 gap-1">
              <button
                onClick={() => setViewMode("dashboard")}
                title="نمای دستیار"
                className={\`px-4 py-1.5 rounded-full text-xs font-bold transition-all \${
                  viewMode === "dashboard" 
                    ? "bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm" 
                    : "text-slate-900 dark:text-white/40 hover:text-slate-900 dark:text-white"
                }\`}
              >
                دستیار
              </button>
              <button
                onClick={() => setViewMode("grid")}
                title="نمای آیکونی"
                className={\`px-4 py-1.5 rounded-full text-xs font-bold transition-all \${
                  viewMode === "grid" 
                    ? "bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm" 
                    : "text-slate-900 dark:text-white/40 hover:text-slate-900 dark:text-white"
                }\`}
              >
                گرید
              </button>
              <button
                onClick={() => setViewMode("list")}
                title="نمای جزییات لیست"
                className={\`px-4 py-1.5 rounded-full text-xs font-bold transition-all \${
                  viewMode === "list" 
                    ? "bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm" 
                    : "text-slate-900 dark:text-white/40 hover:text-slate-900 dark:text-white"
                }\`}
              >
                لیست
              </button>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={\`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all \${
                showFilters 
                  ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)] shadow-sm" 
                  : "bg-slate-900/5 dark:bg-white/5 text-slate-900/60 dark:text-white/60 hover:text-slate-900 dark:text-white hover:bg-slate-900/10 dark:bg-white/10"
              }\`}
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
              className="bg-current/10 border-none outline-none text-xs rounded-lg px-2.5 py-1 w-24 focus:w-32 transition-all placeholder:text-current/40 text-current"
            />

            {allTags.map((tag, i) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={\`text-xs px-2.5 py-1 rounded-lg font-medium transition-all \${selectedTag === tag ? 'bg-[var(--color-primary)] text-slate-900 dark:text-white shadow-md' : 'bg-current/5 hover:bg-current/10'}\`}
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

        {/* Blank state if no bookmarks match */}`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/components/BookmarkGrid.tsx', code);
