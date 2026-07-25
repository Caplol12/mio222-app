const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsScreen.tsx', 'utf-8');

code = code.replace(
  "interface SettingsScreenProps {",
  "interface SettingsScreenProps {\n  pages?: {id: string, name: string}[];"
);

code = code.replace(
  "export default function SettingsScreen({ onClose, categories }: SettingsScreenProps) {",
  "export default function SettingsScreen({ onClose, categories, pages = [] }: SettingsScreenProps) {"
);

// Fix Save to page
code = code.replace(
  "{['Home', 'New Page'].map(p => (",
  "{(pages.length > 0 ? pages.map(p => p.name) : ['Home', 'New Page']).map(p => ("
);

// Fix Save to board
code = code.replace(
  "{['رسانه', 'نوار نشانک‌ها'].map(b => (",
  "{(categories && categories.length > 0 ? categories.filter(c => c.id !== 'all' && c.id !== 'read-later' && c.id !== 'favs').map(c => c.name) : ['رسانه', 'نوار نشانک‌ها']).map(b => ("
);

fs.writeFileSync('src/components/SettingsScreen.tsx', code);
