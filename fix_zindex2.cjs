const fs = require('fs');
let code = fs.readFileSync('src/components/DraggableDashboard.tsx', 'utf-8');

const regex = /const isItemActive = \(id: string\) => \{[\s\S]*?return false;\n  \};/;
const replacement = `const isItemActive = (id: string) => {
    if (!openMenuId && !inlineEditId) return false;
    if (openMenuId === id) return true;
    if (id.startsWith('cat-')) {
      const catId = id.replace('cat-', '');
      const bmIds = pageBookmarks.filter(bm => bm.category === catId).map(bm => bm.id);
      return bmIds.includes(openMenuId!) || bmIds.includes(inlineEditId!);
    }
    return false;
  };`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/DraggableDashboard.tsx', code);
