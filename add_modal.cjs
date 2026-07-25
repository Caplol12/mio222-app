const fs = require('fs');
let code = fs.readFileSync('src/components/BookmarkGrid.tsx', 'utf-8');

const oldModals = `{isSettingsOpen && <SettingsScreen onClose={() => setIsSettingsOpen(false)} categories={categories} />}`;
const newModals = `{isSettingsOpen && <SettingsScreen onClose={() => setIsSettingsOpen(false)} categories={categories} />}
      
      <AddPageModal
        isOpen={isAddPageModalOpen}
        onClose={() => setIsAddPageModalOpen(false)}
        onSave={(name) => {
          const newId = 'page-' + Date.now();
          setPages([...pages, { id: newId, name }]);
          setActivePage(newId);
          setIsAddPageModalOpen(false);
        }}
      />`;

code = code.replace(oldModals, newModals);

fs.writeFileSync('src/components/BookmarkGrid.tsx', code);
