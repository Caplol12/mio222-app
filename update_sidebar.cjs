const fs = require('fs');
let code = fs.readFileSync('src/components/RightSidebar.tsx', 'utf-8');

code = code.replace(
  "import { Search, Image as ImageIcon, LayoutGrid, Trash2, Settings, Bookmark, Download } from 'lucide-react';",
  "import { Search, Image as ImageIcon, LayoutGrid, Trash2, Settings, Bookmark, Download, Bot } from 'lucide-react';"
);

code = code.replace(
  "export default function RightSidebar({ onOpenSettings, onOpenWallpaper, onToggleWidgets, onOpenImport }: { onOpenSettings: () => void; onOpenWallpaper: () => void; onToggleWidgets: () => void; onOpenImport?: () => void }) {",
  "export default function RightSidebar({ onOpenSettings, onOpenWallpaper, onToggleWidgets, onOpenImport, onToggleAIChat }: { onOpenSettings: () => void; onOpenWallpaper: () => void; onToggleWidgets: () => void; onOpenImport?: () => void; onToggleAIChat?: () => void }) {"
);

const newButton = `
      <button 
        title="هوش مصنوعی" 
        onClick={onToggleAIChat}
        style={buttonStyle}
        className="w-[50px] h-[50px] flex items-center justify-center rounded-full text-slate-900 dark:text-white/80 hover:text-slate-900 dark:text-white transition-all shadow-sm border border-white/10 hover:scale-105"
      >
        <Bot className="w-5 h-5 stroke-[1.5]" />
      </button>
      
      <button 
        title="تنظیمات"`;

code = code.replace(/<button \n        title="تنظیمات"/, newButton);

fs.writeFileSync('src/components/RightSidebar.tsx', code);
