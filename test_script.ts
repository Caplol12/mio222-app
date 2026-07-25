import fs from 'fs';

let content = fs.readFileSync('src/components/DraggableDashboard.tsx', 'utf8');
console.log(content.match(/Object.keys\(columns\)\.map\(colId/g));
