const fs = require('fs');
let code = fs.readFileSync('src/components/DraggableDashboard.tsx', 'utf-8');

code = code.replace(
  '  onDeleteBookmark\n}: {',
  '  onDeleteBookmark,\n  onUpdateBookmark\n}: {'
);

code = code.replace(
  '  onDeleteBookmark?: (id: string) => void;\n}) {',
  '  onDeleteBookmark?: (id: string) => void;\n  onUpdateBookmark?: (id: string, updates: Partial<Bookmark>) => void;\n}) {'
);

// Add inlineEditId state and state for fields
const regexState = /const \[openMenuId, setOpenMenuId\] = useState<string \| null>\(null\);/;
code = code.replace(regexState, `const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');`);

fs.writeFileSync('src/components/DraggableDashboard.tsx', code);
