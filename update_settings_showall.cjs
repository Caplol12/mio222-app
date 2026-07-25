const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsScreen.tsx', 'utf-8');

code = code.replace(
  "{['Show 5', 'Show 10', 'Show 15', 'Show 20'].map(h => (",
  "{['Show 5', 'Show 10', 'Show 15', 'Show 20', 'Show All'].map(h => ("
);

fs.writeFileSync('src/components/SettingsScreen.tsx', code);
