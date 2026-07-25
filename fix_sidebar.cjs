const fs = require('fs');
let code = fs.readFileSync('src/components/RightSidebar.tsx', 'utf-8');

const target = `    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4">`;

const repl = `    <div className={\`fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4 transition-all duration-300 \${!settings.showAllSidebar ? 'opacity-30 hover:opacity-100' : ''}\`}>`;

code = code.replace(target, repl);
fs.writeFileSync('src/components/RightSidebar.tsx', code);
