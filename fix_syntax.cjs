const fs = require('fs');
let code = fs.readFileSync('src/components/DraggableDashboard.tsx', 'utf-8');
code = code.replace('{/* Inline Add Category */', '{/* Inline Add Category */}');
fs.writeFileSync('src/components/DraggableDashboard.tsx', code);
