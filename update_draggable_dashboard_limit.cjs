const fs = require('fs');
let code = fs.readFileSync('src/components/DraggableDashboard.tsx', 'utf-8');

code = code.replace(
  "const catBookmarks = pageBookmarks.filter(bm => bm.category === cat.id);",
  `let catBookmarks = pageBookmarks.filter(bm => bm.category === cat.id);
      if (settings.hideExtra !== 'Show All') {
        const limit = parseInt(settings.hideExtra.replace(/\\D/g, '')) || 10;
        catBookmarks = catBookmarks.slice(0, limit);
      }`
);

fs.writeFileSync('src/components/DraggableDashboard.tsx', code);
