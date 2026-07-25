const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsScreen.tsx', 'utf-8');

const quickSaveRegex = /\s*<hr className="border-slate-300" \/>\s*{\/\* Quick Save Section \*\/}[\s\S]*?<\/section>/;

code = code.replace(quickSaveRegex, '');

fs.writeFileSync('src/components/SettingsScreen.tsx', code);
