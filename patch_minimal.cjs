const fs = require('fs');
let code = fs.readFileSync('src/components/DraggableDashboard.tsx', 'utf-8');

// 1. Make the catBookmarks.map render exactly like the reference image
const regex = /\{catBookmarks\.map\(bm => \([\s\S]*?\)\)\}/;
const newRender = `{catBookmarks.map(bm => (
              <div key={bm.id} className="relative group/bm flex items-center justify-between px-2 py-1 rounded-lg hover:bg-slate-900/5 dark:hover:bg-white/5 transition-colors w-full" dir="ltr">
                <button 
                  onClick={() => window.open(bm.url, "_blank")}
                  className="flex items-center gap-2 text-slate-700 dark:text-slate-200 text-sm w-full text-left overflow-hidden min-w-0"
                >
                  <img src={bm.favicon} className="w-4 h-4 rounded-sm object-contain flex-shrink-0" onError={(e) => {
                    const target = e.target;
                    if (!target.dataset.fallback) {
                      target.dataset.fallback = 'true';
                      target.src = \`https://logo.clearbit.com/\${bm.domain}\`;
                    }
                  }} />
                  <span className="truncate flex-1 text-[13px] font-medium text-slate-800 dark:text-slate-200">{bm.domain || bm.title}</span>
                </button>
                
                {/* 3-dot menu button */}
                <div className="relative flex-shrink-0 ml-1 z-10">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === bm.id ? null : bm.id);
                      setInlineEditId(null);
                    }}
                    className="p-1 rounded-md hover:bg-slate-900/10 dark:hover:bg-white/10 transition-colors text-slate-500 opacity-0 group-hover/bm:opacity-100 data-[open=true]:opacity-100"
                    data-open={openMenuId === bm.id}
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                  
                  {openMenuId === bm.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }}></div>
                      <div className="absolute right-0 top-full mt-1 z-[9999] w-48 bg-white dark:bg-[#2C2C2E] border border-slate-900/10 dark:border-white/10 rounded-xl shadow-2xl py-1 animate-in fade-in zoom-in-95 duration-100 text-[13px]" dir="ltr">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            window.open(bm.url, "_blank");
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-900/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                          <span>Open</span>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            window.open(bm.url, "_blank", "noopener,noreferrer");
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-900/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 transition-colors"
                        >
                          <EyeOff className="w-3.5 h-3.5 opacity-70" />
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
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-900/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 opacity-70" />
                          <span>Edit</span>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            onDeleteBookmark?.(bm.id);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-red-500/10 text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 opacity-70" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </>
                  )}
                  
                  {/* Inline Edit Popover */}
                  {inlineEditId === bm.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setInlineEditId(null); }}></div>
                      <div className="absolute right-0 top-full mt-2 z-[9999] w-[300px] bg-white dark:bg-[#2C2C2E] border border-slate-900/10 dark:border-white/10 rounded-2xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-3" dir="ltr" onClick={e => e.stopPropagation()}>
                        <input 
                          type="text" 
                          value={editUrl}
                          onChange={e => setEditUrl(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-black/20 border border-slate-900/10 dark:border-white/10 rounded-lg px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-slate-800 dark:text-slate-200"
                        />
                        <input 
                          type="text" 
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-black/20 border border-slate-900/10 dark:border-white/10 rounded-lg px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-slate-800 dark:text-slate-200"
                        />
                        <input 
                          type="text" 
                          value={editDesc}
                          onChange={e => setEditDesc(e.target.value)}
                          placeholder="Description (optional)"
                          className="w-full bg-slate-50/50 dark:bg-black/10 border border-slate-900/10 dark:border-white/10 rounded-lg px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-slate-600 dark:text-slate-400"
                        />
                        <div className="flex items-center gap-2 mt-1">
                          <button 
                            onClick={() => setInlineEditId(null)}
                            className="flex-1 py-1.5 bg-slate-900/5 dark:bg-white/5 hover:bg-slate-900/10 dark:hover:bg-white/10 rounded-lg text-[13px] font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => {
                              onUpdateBookmark?.(bm.id, { url: editUrl, title: editTitle, description: editDesc });
                              setInlineEditId(null);
                            }}
                            className="flex-1 py-1.5 bg-[#2A93D5] hover:brightness-110 text-white rounded-lg text-[13px] font-semibold transition-colors"
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

// 2. Adjust the folder styles to be tighter
code = code.replace(
  'className="border border-white/40 dark:border-white/10 rounded-[20px] p-4 flex flex-col shadow-sm mb-4"',
  'className="border border-white/40 dark:border-white/10 rounded-[20px] p-3 flex flex-col shadow-sm mb-4"'
);

code = code.replace(
  'className="flex items-center justify-between px-2 mb-3"',
  'className="flex items-center justify-between px-1 mb-2"'
);

code = code.replace(
  'className="font-bold text-slate-800 dark:text-white text-base"',
  'className="font-bold text-slate-800 dark:text-white text-[15px]"'
);

code = code.replace(
  'className="flex flex-col gap-1"',
  'className="flex flex-col gap-0.5"'
);

fs.writeFileSync('src/components/DraggableDashboard.tsx', code);
