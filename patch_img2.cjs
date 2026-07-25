const fs = require('fs');
let code = fs.readFileSync('src/components/DraggableDashboard.tsx', 'utf-8');

code = code.replace(
  'const target = e.target;',
  'const target = e.target as HTMLImageElement;'
);

fs.writeFileSync('src/components/DraggableDashboard.tsx', code);
