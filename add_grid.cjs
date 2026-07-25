const fs = require('fs');
let code = fs.readFileSync('src/components/BookmarkGrid.tsx', 'utf-8');

const gridCode = `
        {/* GRID VIEW */}
        {viewMode === "grid" && filteredBookmarks.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredBookmarks.map((bm) => (
              <div
                key={bm.id}
                draggable onDragStart={(e) => e.dataTransfer.setData("bookmark_id", bm.id)}
                className="flex flex-col items-center justify-center p-4 rounded-3xl bg-black/30 backdrop-blur-xl border border-slate-900/10 dark:border-white/10 hover:bg-black/40 transition-all duration-300 relative group shadow-xl cursor-pointer"
                onClick={() => window.open(bm.url, "_blank")}
                onContextMenu={(e) => { e.preventDefault(); setContextMenu({x: e.clientX, y: e.clientY, bookmark: bm}); }}
              >
                <div className={\`w-16 h-16 rounded-3xl bg-gradient-to-tr \${bm.gradient} p-0.5 shadow-md mb-3\`}>
                  <div className="w-full h-full bg-white dark:bg-neutral-900 rounded-[22px] flex items-center justify-center p-2">
                    <img src={bm.favicon} alt="" className="w-8 h-8 rounded-md object-contain" onError={(e) => { (e.target as HTMLImageElement).src = \`https://logo.clearbit.com/\${bm.domain}\`; }} />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white text-center line-clamp-1 w-full" dir="ltr">{bm.title || bm.domain}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center line-clamp-1 w-full mt-1" dir="ltr">{bm.domain}</p>
                
                {/* Actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex flex-col gap-1 transition-opacity">
                   <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(bm.id); }} className={\`p-1.5 rounded-full hover:bg-current/20 transition-colors \${bm.isFavorite ? 'text-yellow-400' : 'text-slate-400 hover:text-white'}\`}>
                     <Star className={\`w-4 h-4 \${bm.isFavorite ? 'fill-yellow-400' : ''}\`} />
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
`;

code = code.replace(/\{\/\* COMPREHENSIVE CARD LIST VIEW/, gridCode + '\n        {/* COMPREHENSIVE CARD LIST VIEW');

fs.writeFileSync('src/components/BookmarkGrid.tsx', code);
