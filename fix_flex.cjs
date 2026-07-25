const fs = require('fs');
let code = fs.readFileSync('src/components/DraggableDashboard.tsx', 'utf8');

code = code.replace(
  `className="flex w-full gap-8 mt-8 pb-12"`,
  `className="flex w-full gap-8 mt-8 pb-12 overflow-x-auto min-h-[500px] scrollbar-thin"`
);

fs.writeFileSync('src/components/DraggableDashboard.tsx', code, 'utf8');
