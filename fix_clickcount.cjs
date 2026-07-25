const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  '        gradient: "from-blue-500 to-indigo-500",\n        createdAt: Date.now(),\n      };',
  '        gradient: "from-blue-500 to-indigo-500",\n        createdAt: Date.now(),\n        clickCount: 0,\n      };'
);

fs.writeFileSync('src/App.tsx', code);
