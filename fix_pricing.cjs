const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  "pricing: 'free',",
  "pricing: 'free' as 'free' | 'paid' | 'freemium',"
);

fs.writeFileSync('src/App.tsx', code);
