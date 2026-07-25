const fs = require('fs');
let code = fs.readFileSync('src/components/DraggableDashboard.tsx', 'utf-8');

const regex = /export default function DraggableDashboard\(\{[\s\S]*?\}\) \{[\s\S]*?const \[openMenuId, setOpenMenuId\] = useState<string \| null>\(null\);\n  categories,\n  pageBookmarks,\n  getGlassStyle,\n  onTriggerAddModal,\n  onAddCategory,\n  activePage,\n  widgetVisibility,\n  settings,\n  onEditBookmark,\n  onDeleteBookmark\n\}: \{[\s\S]*?\}\) \{/;

code = code.replace(regex, `export default function DraggableDashboard({
  categories,
  pageBookmarks,
  getGlassStyle,
  onTriggerAddModal,
  onAddCategory,
  activePage,
  widgetVisibility,
  settings,
  onEditBookmark,
  onDeleteBookmark
}: {
  categories: CategoryItem[];
  pageBookmarks: Bookmark[];
  getGlassStyle: () => React.CSSProperties;
  onTriggerAddModal: (pageId?: string) => void;
  onAddCategory?: () => void;
  activePage: string;
  widgetVisibility: Record<string, boolean>;
  settings: any;
  onEditBookmark?: (bookmark: Bookmark) => void;
  onDeleteBookmark?: (id: string) => void;
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);`);

fs.writeFileSync('src/components/DraggableDashboard.tsx', code);
