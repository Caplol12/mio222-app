const fs = require('fs');
let code = fs.readFileSync('src/components/BookmarkGrid.tsx', 'utf-8');

code = code.replace(
  '  onEditBookmark: (bookmark: Bookmark) => void;',
  '  onEditBookmark: (bookmark: Bookmark) => void;\n  onUpdateBookmark?: (id: string, updates: Partial<Bookmark>) => void;'
);

code = code.replace(
  '  onDeleteBookmark,\n  onEditBookmark,\n  onTriggerAddModal,',
  '  onDeleteBookmark,\n  onEditBookmark,\n  onUpdateBookmark,\n  onTriggerAddModal,'
);

code = code.replace(
  '            onEditBookmark={onEditBookmark}\n            onDeleteBookmark={onDeleteBookmark}',
  '            onEditBookmark={onEditBookmark}\n            onDeleteBookmark={onDeleteBookmark}\n            onUpdateBookmark={onUpdateBookmark}'
);

fs.writeFileSync('src/components/BookmarkGrid.tsx', code);
