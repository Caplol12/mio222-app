const fs = require('fs');
let code = fs.readFileSync('src/components/DraggableDashboard.tsx', 'utf-8');

code = code.replace("widgetVisibility: Record<string, boolean>;", "activePage: string;\n  widgetVisibility: Record<string, boolean>;");

fs.writeFileSync('src/components/DraggableDashboard.tsx', code);
