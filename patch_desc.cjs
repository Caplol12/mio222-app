const fs = require('fs');
let code = fs.readFileSync('src/components/DraggableDashboard.tsx', 'utf-8');

const regexSpan = /<span className="truncate flex-1 text-\[13px\] font-medium text-slate-800 dark:text-slate-200">\{bm\.domain \|\| bm\.title\}<\/span>/g;
const replacement = `<div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="truncate w-full text-[13px] font-medium text-slate-800 dark:text-slate-200">{bm.domain || bm.title}</span>
                    {settings?.showDesc && bm.description && <span className="truncate w-full text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{bm.description}</span>}
                  </div>`;

code = code.replace(regexSpan, replacement);
fs.writeFileSync('src/components/DraggableDashboard.tsx', code);
