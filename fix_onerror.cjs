const fs = require('fs');
let code = fs.readFileSync('src/components/BookmarkGrid.tsx', 'utf-8');

code = code.replace(/onError=\{\(e\) => \{ \(\e\.target as HTMLImageElement\)\.src = `https:\/\/logo\.clearbit\.com\/\$\{bm\.domain\}`; \}\}/g, 
  `onError={(e) => { const t = e.target as HTMLImageElement; const fallback = \`https://logo.clearbit.com/\${bm.domain}\`; if (t.src !== fallback) t.src = fallback; }}`);

code = code.replace(/onError=\{\(e\) => \{\s*\(\e\.target as HTMLImageElement\)\.src = `https:\/\/logo\.clearbit\.com\/\$\{bm\.domain\}`;\s*\}\}/g, 
  `onError={(e) => { const t = e.target as HTMLImageElement; const fallback = \`https://logo.clearbit.com/\${bm.domain}\`; if (t.src !== fallback) t.src = fallback; }}`);

fs.writeFileSync('src/components/BookmarkGrid.tsx', code);

let dashCode = fs.readFileSync('src/components/DraggableDashboard.tsx', 'utf-8');
dashCode = dashCode.replace(/onError=\{\(e\) => \{ \(\e\.target as HTMLImageElement\)\.src = `https:\/\/logo\.clearbit\.com\/\$\{bm\.domain\}`; \}\}/g, 
  `onError={(e) => { const t = e.target as HTMLImageElement; const fallback = \`https://logo.clearbit.com/\${bm.domain}\`; if (t.src !== fallback) t.src = fallback; }}`);
fs.writeFileSync('src/components/DraggableDashboard.tsx', dashCode);
