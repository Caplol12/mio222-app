const fs = require('fs');
let code = fs.readFileSync('src/components/BookmarkGrid.tsx', 'utf-8');

const gridBlock = `
        {/* GRID VIEW: Small cards layout */}
        {viewMode === "grid" && filteredBookmarks.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredBookmarks.map((bm) => (
              <div
                key={bm.id}
                draggable onDragStart={(e) => e.dataTransfer.setData("bookmark_id", bm.id)}
                className="flex flex-col p-4 rounded-3xl bg-black/30 backdrop-blur-xl border border-slate-900/10 dark:border-white/10 hover:bg-black/40 transition-all duration-300 relative group shadow-xl h-full cursor-pointer text-right min-h-[160px]"
                onContextMenu={(e) => { e.preventDefault(); setContextMenu({x: e.clientX, y: e.clientY, bookmark: bm}); }}
                onClick={() => handleOpenLink(bm)}
              >
                <div className="flex items-start justify-between mb-3 w-full" dir="ltr">
                  <div className={\`w-12 h-12 rounded-2xl bg-gradient-to-tr \${bm.gradient} p-0.5 shadow-md flex-shrink-0 relative\`}>
                    <div className="w-full h-full bg-white dark:bg-neutral-900 rounded-[14px] flex items-center justify-center p-2">
                      <img
                        src={bm.favicon}
                        alt="favicon"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = \`https://logo.clearbit.com/\${bm.domain}\`;
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onToggleFavorite(bm.id); }}
                      className={\`p-1.5 rounded-full transition-colors \${
                        bm.favorite 
                          ? "bg-amber-500/20 text-amber-500" 
                          : "bg-slate-900/10 dark:bg-white/10 text-slate-900/40 dark:text-white/40 hover:bg-slate-900/20 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white"
                      }\`}
                    >
                      <Star className={\`w-3.5 h-3.5 \${bm.favorite ? "fill-amber-500" : ""}\`} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEditBookmark(bm); }}
                      className="p-1.5 rounded-full bg-slate-900/10 dark:bg-white/10 text-slate-900/40 dark:text-white/40 hover:bg-slate-900/20 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                
                <h3 className={\`font-bold text-slate-800 dark:text-white mb-1 line-clamp-1 \${settings.textSize === 'S' ? 'text-xs' : settings.textSize === 'L' ? 'text-base' : 'text-sm'}\`}>{bm.title}</h3>
                
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
`;

code = code.replace(
  /\{\/\* COMPREHENSIVE CARD LIST VIEW: sleek modern dashboard rows \*\/\}/,
  gridBlock + '\n\n        {/* COMPREHENSIVE CARD LIST VIEW: sleek modern dashboard rows */}'
);

fs.writeFileSync('src/components/BookmarkGrid.tsx', code);
