const fs = require('fs');
let code = fs.readFileSync('src/components/DraggableDashboard.tsx', 'utf-8');

code = code.replace(
  '  onEditCategory?: (cat: CategoryItem) => void;',
  '  onEditCategory?: (id: string, name: string) => void;'
);

code = code.replace(
  'onEditCategory?.(cat);',
  'const newName = window.prompt("نام جدید پوشه را وارد کنید:", cat.name);\n                      if (newName && newName.trim() !== "") {\n                        onEditCategory?.(cat.id, newName.trim());\n                      }'
);

fs.writeFileSync('src/components/DraggableDashboard.tsx', code);
