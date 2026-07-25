const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `<div className="flex items-center gap-4 flex-wrap">`;
const replacement = `<div className="flex items-center gap-4 flex-wrap">
            <button onClick={logout} className="flex items-center gap-1.5 hover:text-red-500 transition-colors font-bold cursor-pointer text-red-400">خروج</button>
            <span className="hidden xl:inline opacity-30">|</span>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
