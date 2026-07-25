const fs = require('fs');
let code = fs.readFileSync('src/components/DraggableDashboard.tsx', 'utf-8');

const regex = /\{catBookmarks\.map\(bm => \([\s\S]*?<\/div>\s*\)\)\}/;
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
                    <span className="truncate w-full text-[13px] text-slate-800 dark:text-slate-200">{bm.title || bm.domain}</span>
                    {bm.description && <span className="truncate w-full text-[10px] text-slate-500 mt-0.5">{bm.description}</span>}
                  </div>
                </button>
                
                {/* 3-dot menu button */}
                <div className="relative flex-shrink-0 ml-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === bm.id ? null : bm.id);
                      setInlineEditId(null);
                    }}
                    className="p-1.5 rounded-md border border-slate-900/10 dark:border-white/10 hover:bg-slate-900/10 dark:hover:bg-white/10 transition-colors text-slate-800 dark:text-slate-200 opacity-0 group-hover/bm:opacity-100 data-[open=true]:opacity-100 bg-white/50 dark:bg-black/20"
                    data-open={openMenuId === bm.id}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  
                  {openMenuId === bm.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }}></div>
                      <div className="absolute right-0 top-full mt-1 z-50 w-52 bg-[#f0f2f5] dark:bg-[#1C1C1E] border border-slate-900/10 dark:border-white/10 rounded-xl shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100 text-sm" dir="ltr">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            window.open(bm.url, "_blank");
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-900/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 opacity-70" />
                          <span>Open</span>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            window.open(bm.url, "_blank", "noopener,noreferrer"); // Incognito not possible via API, standard open
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-900/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 transition-colors"
                        >
                          <EyeOff className="w-4 h-4 opacity-70" />
                          <span>Open in incognito</span>
                        </button>
                        <div className="h-px bg-slate-900/10 dark:bg-white/10 my-1"></div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            setInlineEditId(bm.id);
                            setEditUrl(bm.url);
                            setEditTitle(bm.title || bm.domain);
                            setEditDesc(bm.description || '');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-900/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 transition-colors"
                        >
                          <Edit2 className="w-4 h-4 opacity-70" />
                          <span>Edit</span>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            onDeleteBookmark?.(bm.id);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-500/10 text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 opacity-70" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </>
                  )}
                  
                  {/* Inline Edit Popover */}
                  {inlineEditId === bm.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setInlineEditId(null); }}></div>
                      <div className="absolute right-0 top-full mt-2 z-50 w-[300px] bg-[#e7eaf0] dark:bg-[#2C2C2E] border border-slate-900/10 dark:border-white/10 rounded-2xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-3" dir="ltr" onClick={e => e.stopPropagation()}>
                        <input 
                          type="text" 
                          value={editUrl}
                          onChange={e => setEditUrl(e.target.value)}
                          className="w-full bg-white dark:bg-black/20 border border-slate-900/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-slate-800 dark:text-slate-200"
                        />
                        <input 
                          type="text" 
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          className="w-full bg-white dark:bg-black/20 border border-slate-900/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-slate-800 dark:text-slate-200"
                        />
                        <input 
                          type="text" 
                          value={editDesc}
                          onChange={e => setEditDesc(e.target.value)}
                          placeholder="Description (optional)"
                          className="w-full bg-white/50 dark:bg-black/10 border border-slate-900/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-slate-600 dark:text-slate-400"
                        />
                        <div className="flex items-center gap-2 mt-1">
                          <button 
                            onClick={() => setInlineEditId(null)}
                            className="flex-1 py-2 bg-slate-900/5 dark:bg-white/5 hover:bg-slate-900/10 dark:hover:bg-white/10 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => {
                              onUpdateBookmark?.(bm.id, { url: editUrl, title: editTitle, description: editDesc });
                              setInlineEditId(null);
                            }}
                            className="flex-1 py-2 bg-[#2A93D5] hover:brightness-110 text-white rounded-lg text-sm font-semibold transition-colors"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}`;

code = code.replace(regex, newRender);
fs.writeFileSync('src/components/DraggableDashboard.tsx', code);
