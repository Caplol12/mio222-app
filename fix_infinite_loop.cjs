const fs = require('fs');
let code = fs.readFileSync('src/components/BookmarkGrid.tsx', 'utf-8');

const defaultVis = `const defaultWidgetVisibility = {calendar: true, weather: true, notes: true, pomodoro: true, clock: true, search: true, board: true};\n\nexport default function BookmarkGrid(`;

code = code.replace("export default function BookmarkGrid(", defaultVis);

code = code.replace(
  "const widgetVisibility = allWidgetVisibility[activePage] || {calendar: true, weather: true, notes: true, pomodoro: true, clock: true, search: true, board: true};",
  "const widgetVisibility = allWidgetVisibility[activePage] || defaultWidgetVisibility;"
);

code = code.replace(
  "const current = prev[activePage] || {calendar: true, weather: true, notes: true, pomodoro: true, clock: true, search: true, board: true};",
  "const current = prev[activePage] || defaultWidgetVisibility;"
);

fs.writeFileSync('src/components/BookmarkGrid.tsx', code);
