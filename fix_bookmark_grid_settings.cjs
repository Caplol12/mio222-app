const fs = require('fs');
let code = fs.readFileSync('src/components/BookmarkGrid.tsx', 'utf-8');

code = code.replace(
  "categories={categories}",
  "categories={categories} pages={pages}"
);

fs.writeFileSync('src/components/BookmarkGrid.tsx', code);
