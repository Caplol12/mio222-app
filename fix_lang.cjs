const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsScreen.tsx', 'utf-8');

code = code.replace(
  "{['Auto', 'English', 'Русский'].map(l => (",
  "{['Auto', 'فارسی', 'English'].map(l => ("
);

fs.writeFileSync('src/components/SettingsScreen.tsx', code);
