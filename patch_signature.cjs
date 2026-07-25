const fs = require('fs');
let code = fs.readFileSync('src/components/DraggableDashboard.tsx', 'utf-8');

const regex = /export default function DraggableDashboard\([\s\S]*?\}\) \{/;
const newSignature = `export default function DraggableDashboard({
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
}) {`;

code = code.replace(regex, newSignature);
fs.writeFileSync('src/components/DraggableDashboard.tsx', code);
