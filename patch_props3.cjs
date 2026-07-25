const fs = require('fs');
let code = fs.readFileSync('src/components/DraggableDashboard.tsx', 'utf-8');

code = code.replace(
  /widgetVisibility \}: \{/,
  'widgetVisibility,\n  onEditBookmark,\n  onDeleteBookmark\n}: {'
);

fs.writeFileSync('src/components/DraggableDashboard.tsx', code);
