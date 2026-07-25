const fs = require('fs');
let code = fs.readFileSync('src/components/BookmarkGrid.tsx', 'utf-8');

const blankRegex = /{\/\* Blank state if no bookmarks match \*\/}[\s\S]*?{\/\* DASHBOARD VIEW EXACT MATCH TO IMAGE \*\//;
code = code.replace(blankRegex, '{/* DASHBOARD VIEW EXACT MATCH TO IMAGE */');

fs.writeFileSync('src/components/BookmarkGrid.tsx', code);
