const fs = require('fs');
let code = fs.readFileSync('src/components/DraggableDashboard.tsx', 'utf-8');

const regex = /\{catBookmarks\.map\(bm => \([\s\S]*?<\/button>\s*\)\)\}/;
const newRender = `{catBookmarks.map(bm => (
              <div key={bm.id} className="relative group/bm flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-300/30 dark:hover:bg-white/10 transition-colors w-full" dir="ltr">
                <button 
                  onClick={() => window.open(bm.url, "_blank")}
                  className="flex items-center gap-3 text-slate-700 dark:text-slate-200 text-sm w-full text-left overflow-hidden min-w-0"
                >
                  <img src={bm.favicon} className="w-5 h-5 rounded-sm object-contain flex-shrink-0" onError={(e) => {
                    const target = e.target;
                    if (!target.dataset.fallback) {
                      target.dataset.fallback = 'true';
                      target.src = \`https://logo.clearbit.com/\${bm.domain}\`;
                    }
                  }} />
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="truncate w-full text-[13px]">{bm.title || bm.domain}</span>
                    {bm.description && <span className="truncate w-full text-[10px] opacity-60 mt-0.5">{bm.description}</span>}
                  </div>
                </button>
                
                {/* 3-dot menu button */}
                <div className="relative flex-shrink-0 ml-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === bm.id ? null : bm.id);
                    }}
                    className="p-1.5 rounded-full hover:bg-slate-900/10 dark:hover:bg-white/10 transition-colors text-slate-500 opacity-0 group-hover/bm:opacity-100 data-[open=true]:opacity-100"
                    data-open={openMenuId === bm.id}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  
                  {openMenuId === bm.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }}></div>
                      <div className="absolute left-0 top-full mt-1 z-50 w-36 bg-white dark:bg-[#1C1C1E] border border-slate-900/10 dark:border-white/10 rounded-xl shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100 text-sm" dir="rtl">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            onEditBookmark?.(bm);
                          }}
                          className="w-full text-right px-4 py-2 hover:bg-slate-900/5 dark:hover:bg-white/5 text-slate-800 dark:text-white transition-colors"
                        >
                          ویرایش
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            onDeleteBookmark?.(bm.id);
                          }}
                          className="w-full text-right px-4 py-2 hover:bg-red-500/10 text-red-500 transition-colors"
                        >
                          حذف
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}`;

code = code.replace(regex, newRender);
fs.writeFileSync('src/components/DraggableDashboard.tsx', code);
