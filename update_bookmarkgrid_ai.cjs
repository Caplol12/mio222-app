const fs = require('fs');
let code = fs.readFileSync('src/components/BookmarkGrid.tsx', 'utf-8');

code = code.replace(
  'import RightSidebar from "./RightSidebar";',
  'import RightSidebar from "./RightSidebar";\nimport AIChatPanel from "./AIChatPanel";'
);

code = code.replace(
  'const [isAddPageModalOpen, setIsAddPageModalOpen] = useState(false);',
  'const [isAddPageModalOpen, setIsAddPageModalOpen] = useState(false);\n  const [isAIChatOpen, setIsAIChatOpen] = useState(false);'
);

code = code.replace(
  '<RightSidebar onOpenSettings={() => setIsSettingsOpen(true)} onOpenWallpaper={() => setIsWallpaperOpen(true)} onToggleWidgets={() => setIsEditDashboard(!isEditDashboard)} onOpenImport={onOpenImport} />',
  '<RightSidebar onOpenSettings={() => setIsSettingsOpen(true)} onOpenWallpaper={() => setIsWallpaperOpen(true)} onToggleWidgets={() => setIsEditDashboard(!isEditDashboard)} onOpenImport={onOpenImport} onToggleAIChat={() => setIsAIChatOpen(!isAIChatOpen)} />\n      <AIChatPanel isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />'
);

fs.writeFileSync('src/components/BookmarkGrid.tsx', code);
