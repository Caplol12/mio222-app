const fs = require('fs');
let codeApp = fs.readFileSync('src/App.tsx', 'utf-8');
codeApp = codeApp.replace(
  'onAddCategory={() => setIsAddCategoryModalOpen(true)}',
  'onAddCategory={(name) => { if (name) handleAddCategory(name); else setIsAddCategoryModalOpen(true); }}'
);
fs.writeFileSync('src/App.tsx', codeApp);

let codeBG = fs.readFileSync('src/components/BookmarkGrid.tsx', 'utf-8');
codeBG = codeBG.replace(
  'onAddCategory?: () => void;',
  'onAddCategory?: (name?: string) => void;'
);
fs.writeFileSync('src/components/BookmarkGrid.tsx', codeBG);

let codeDD = fs.readFileSync('src/components/DraggableDashboard.tsx', 'utf-8');
codeDD = codeDD.replace(
  'onAddCategory?: () => void;',
  'onAddCategory?: (name?: string) => void;'
);
fs.writeFileSync('src/components/DraggableDashboard.tsx', codeDD);
