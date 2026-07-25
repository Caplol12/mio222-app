const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /onDeleteBookmark=\{handleDeleteBookmark\}/;
const replacement = `onDeleteBookmark={handleDeleteBookmark}
            onUpdateBookmark={(id, updates) => {
              const updated = bookmarks.map(bm => bm.id === id ? { ...bm, ...updates } : bm);
              saveBookmarks(updated);
            }}`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
