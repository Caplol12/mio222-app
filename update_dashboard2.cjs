const fs = require('fs');
let code = fs.readFileSync('src/components/DraggableDashboard.tsx', 'utf-8');

code = code.replace("export default function DraggableDashboard({ ", "export default function DraggableDashboard({ \n  activePage,");
code = code.replace("widgetVisibility }: {", "widgetVisibility }: {\n  activePage: string;");

code = code.replace(/const saved = localStorage\.getItem\('dashboard_layout'\);/g, "const saved = localStorage.getItem(`dashboard_layout_${activePage}`);");
code = code.replace(/localStorage\.setItem\('dashboard_layout', JSON\.stringify\(columns\)\);/g, "localStorage.setItem(`dashboard_layout_${activePage}`, JSON.stringify(columns));");
code = code.replace(/setColumns\(cols\);\n  \}, \[categories, widgetVisibility\]\);/g, "setColumns(cols);\n  }, [activePage, categories, widgetVisibility]);");
code = code.replace(/\}, \[columns\]\);/g, "}, [activePage, columns]);");

fs.writeFileSync('src/components/DraggableDashboard.tsx', code);
