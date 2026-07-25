const fs = require('fs');
let code = fs.readFileSync('src/components/RightSidebar.tsx', 'utf-8');

code = code.replace(
  "export default function RightSidebar({ onOpenSettings, onOpenWallpaper, onToggleWidgets, onOpenImport, onToggleAIChat }: { onOpenSettings: () => void; onOpenWallpaper: () => void; onToggleWidgets: () => void; onOpenImport?: () => void; onToggleAIChat?: () => void }) {",
  `export default function RightSidebar({ onOpenSettings, onOpenWallpaper, onToggleWidgets, onOpenImport, onToggleAIChat }: { onOpenSettings: () => void; onOpenWallpaper: () => void; onToggleWidgets: () => void; onOpenImport?: () => void; onToggleAIChat?: () => void }) {
  const [adminSettings, setAdminSettings] = React.useState(() => {
    try {
      const stored = localStorage.getItem('admin_settings');
      return stored ? JSON.parse(stored) : { chatbotEnabled: true };
    } catch {
      return { chatbotEnabled: true };
    }
  });`
);

code = code.replace(
  `<button 
        title="هوش مصنوعی"`,
  `{adminSettings.chatbotEnabled !== false && (
      <button 
        title="هوش مصنوعی"`
);

code = code.replace(
  `<Bot className="w-5 h-5 stroke-[1.5]" />
      </button>`,
  `<Bot className="w-5 h-5 stroke-[1.5]" />
      </button>
      )}`
);

fs.writeFileSync('src/components/RightSidebar.tsx', code);
