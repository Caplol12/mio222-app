const fs = require('fs');
let code = fs.readFileSync('src/components/DraggableDashboard.tsx', 'utf-8');

if (!code.includes('const [openMenuId, setOpenMenuId] = useState<string | null>(null);')) {
  code = code.replace(
    'export default function DraggableDashboard({',
    'export default function DraggableDashboard({\n  categories,\n  pageBookmarks,\n  getGlassStyle,\n  onTriggerAddModal,\n  onAddCategory,\n  activePage,\n  widgetVisibility,\n  settings,\n  onEditBookmark,\n  onDeleteBookmark\n}: {\n  categories: CategoryItem[];\n  pageBookmarks: Bookmark[];\n  getGlassStyle: () => React.CSSProperties;\n  onTriggerAddModal: (pageId?: string) => void;\n  onAddCategory?: () => void;\n  activePage: string;\n  widgetVisibility: Record<string, boolean>;\n  settings: any;\n  onEditBookmark?: (bookmark: Bookmark) => void;\n  onDeleteBookmark?: (id: string) => void;\n}) {\n  const [openMenuId, setOpenMenuId] = useState<string | null>(null);'
  );
  
  // also need to remove the previous signature
  const regex = /export default function DraggableDashboard\([\s\S]*?\}\) \{\n  const \[openMenuId/;
  // already replaced. 
}

fs.writeFileSync('src/components/DraggableDashboard.tsx', code);
