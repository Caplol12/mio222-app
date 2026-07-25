const fs = require('fs');
let code = fs.readFileSync('src/components/BookmarkGrid.tsx', 'utf-8');

code = code.replace(
  'import WidgetsPanel from "./WidgetsPanel";',
  'import WidgetsPanel from "./WidgetsPanel";\nimport AddPageModal from "./AddPageModal";'
);

code = code.replace(
  'const [isWallpaperOpen, setIsWallpaperOpen] = useState(false);',
  'const [isWallpaperOpen, setIsWallpaperOpen] = useState(false);\n  const [isAddPageModalOpen, setIsAddPageModalOpen] = useState(false);'
);

code = code.replace(
  '{pages.map(page => (',
  `{pages.map(page => (`
);

fs.writeFileSync('src/components/BookmarkGrid.tsx', code);
