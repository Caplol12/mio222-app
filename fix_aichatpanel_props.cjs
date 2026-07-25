const fs = require('fs');
let code = fs.readFileSync('src/components/AIChatPanel.tsx', 'utf-8');

code = code.replace(
  "interface AIChatPanelProps {",
  "import { Bookmark, CategoryItem } from '../types';\n\ninterface AIChatPanelProps {"
);

code = code.replace(
  "interface AIChatPanelProps {\n  isOpen: boolean;\n  onClose: () => void;\n}",
  "interface AIChatPanelProps {\n  isOpen: boolean;\n  onClose: () => void;\n  bookmarks: Bookmark[];\n  categories: CategoryItem[];\n}"
);

code = code.replace(
  "export default function AIChatPanel({ isOpen, onClose }: AIChatPanelProps) {",
  "export default function AIChatPanel({ isOpen, onClose, bookmarks, categories }: AIChatPanelProps) {"
);

fs.writeFileSync('src/components/AIChatPanel.tsx', code);
