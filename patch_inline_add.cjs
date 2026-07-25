const fs = require('fs');
let code = fs.readFileSync('src/components/DraggableDashboard.tsx', 'utf-8');

// 1. Add state
const regexState = /const \[columns, setColumns\] = useState\(\{/;
code = code.replace(regexState, `const [addingCategoryCol, setAddingCategoryCol] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [columns, setColumns] = useState({`);

// 2. Modify the dashed button
const regexDashed = /\{\/\* The hidden add button requested by user \*\/\}[\s\S]*?<\/div>\n                <\/div>/;
const newDashed = `{/* Inline Add Category */
                {addingCategoryCol === colId ? (
                  <div className="w-full bg-white dark:bg-[#1E1E1E] rounded-[20px] p-3 flex items-center gap-2 shadow-sm border border-slate-900/10 dark:border-white/10 mt-2">
                    <input 
                      type="text"
                      autoFocus
                      placeholder="New Board"
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newCategoryName.trim()) {
                          onAddCategory?.(newCategoryName.trim());
                          setAddingCategoryCol(null);
                          setNewCategoryName('');
                        } else if (e.key === 'Escape') {
                          setAddingCategoryCol(null);
                          setNewCategoryName('');
                        }
                      }}
                      className="flex-1 bg-transparent border-b border-slate-300 dark:border-slate-600 outline-none text-[15px] font-medium text-slate-800 dark:text-white px-1 py-1"
                    />
                    <button 
                      onClick={() => {
                        if (newCategoryName.trim()) {
                          onAddCategory?.(newCategoryName.trim());
                          setAddingCategoryCol(null);
                          setNewCategoryName('');
                        }
                      }}
                      className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    </button>
                    <button 
                      onClick={() => {
                        setAddingCategoryCol(null);
                        setNewCategoryName('');
                      }}
                      className="w-7 h-7 rounded-lg bg-transparent flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => setAddingCategoryCol(colId)}
                    className="w-full h-24 border-2 border-dashed border-slate-900/20 dark:border-white/20 rounded-[20px] flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity mt-2"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-900/5 dark:bg-white/5 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-slate-900/40 dark:text-white/40" />
                    </div>
                  </div>
                )}`;

code = code.replace(regexDashed, newDashed);

fs.writeFileSync('src/components/DraggableDashboard.tsx', code);
