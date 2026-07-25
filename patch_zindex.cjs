const fs = require('fs');
let code = fs.readFileSync('src/components/DraggableDashboard.tsx', 'utf-8');

// 1. Update SortableItem
code = code.replace(
  'function SortableItem({ id, children }: { id: string, key?: React.Key, children: React.ReactNode }) {',
  'function SortableItem({ id, isActive, children }: { id: string, isActive?: boolean, key?: React.Key, children: React.ReactNode }) {'
);

code = code.replace(
  'opacity: isDragging ? 0.4 : 1,\n  };',
  'opacity: isDragging ? 0.4 : 1,\n    zIndex: (isDragging || isActive) ? 50 : 1,\n  };'
);

// 2. Add isItemActive helper
const isItemActiveFunc = `  const isItemActive = (id: string) => {
    if (!openMenuId && !inlineEditId) return false;
    if (id.startsWith('cat-')) {
      const catId = id.replace('cat-', '');
      const bmIds = pageBookmarks.filter(bm => bm.category === catId).map(bm => bm.id);
      return bmIds.includes(openMenuId!) || bmIds.includes(inlineEditId!);
    }
    return false;
  };
  
  return (`;

code = code.replace('  return (\n    <DndContext', isItemActiveFunc + '\n    <DndContext');

// 3. Update map
code = code.replace(
  '<SortableItem key={id} id={id}>',
  '<SortableItem key={id} id={id} isActive={isItemActive(id)}>'
);

// 4. Remove description from list item and fix padding
code = code.replace(
  'className="relative group/bm flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-300/30 dark:hover:bg-white/10 transition-colors w-full" dir="ltr"',
  'className="relative group/bm flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-slate-300/30 dark:hover:bg-white/10 transition-colors w-full" dir="ltr"'
);

code = code.replace(
  '                  <div className="flex flex-col items-start min-w-0 flex-1">\n                    <span className="truncate w-full text-[13px] text-slate-800 dark:text-slate-200">{bm.title || bm.domain}</span>\n                    {bm.description && <span className="truncate w-full text-[10px] text-slate-500 mt-0.5">{bm.description}</span>}\n                  </div>',
  '                  <span className="truncate flex-1 text-[13px] text-slate-800 dark:text-slate-200">{bm.domain || bm.title}</span>'
);

fs.writeFileSync('src/components/DraggableDashboard.tsx', code);
