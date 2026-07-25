const fs = require('fs');
let code = fs.readFileSync('src/components/BookmarkGrid.tsx', 'utf-8');

code = code.replace(
  '            onAddCategory={onAddCategory}',
  '            onAddCategory={onAddCategory}\n            onEditCategory={onEditCategory}\n            onDeleteCategory={onDeleteCategory}'
);

fs.writeFileSync('src/components/BookmarkGrid.tsx', code);
