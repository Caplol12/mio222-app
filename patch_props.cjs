const fs = require('fs');
let code = fs.readFileSync('src/components/DraggableDashboard.tsx', 'utf-8');

code = code.replace(
  '  widgetVisibility }: {',
  '  widgetVisibility,\n  onEditBookmark,\n  onDeleteBookmark\n}: {'
);

code = code.replace(
  '  settings: any;\n}) {',
  '  settings: any;\n  onEditBookmark?: (bookmark: Bookmark) => void;\n  onDeleteBookmark?: (id: string) => void;\n}) {'
);

fs.writeFileSync('src/components/DraggableDashboard.tsx', code);
