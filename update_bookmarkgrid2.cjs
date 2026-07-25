const fs = require('fs');
let code = fs.readFileSync('src/components/BookmarkGrid.tsx', 'utf-8');

code = code.replace(/<DraggableDashboard \n            categories=\{categories\}/g, `<DraggableDashboard \n            activePage={activePage}\n            categories={categories}`);

fs.writeFileSync('src/components/BookmarkGrid.tsx', code);
