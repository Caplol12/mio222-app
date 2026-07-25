const fs = require('fs');
let code = fs.readFileSync('src/components/BookmarkGrid.tsx', 'utf-8');

const toolbarRegex = /{\/\* Search, Sort and Add Links Toolbar \*\/}[\s\S]*?{\/\* Title, Color Picker, and View Mode toggler \*\/}/;
code = code.replace(toolbarRegex, '{/* Title, Color Picker, and View Mode toggler */}');

const colorPickerRegex = /{\/\* Folder Color Picker \*\/}[\s\S]*?<\/div>\s*<\/div>\s*\)}/m;
code = code.replace(colorPickerRegex, '');

fs.writeFileSync('src/components/BookmarkGrid.tsx', code);
