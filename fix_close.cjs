const fs = require('fs');
let code = fs.readFileSync('src/components/DraggableDashboard.tsx', 'utf-8');

// Add global click listener
const regexState = /const \[editDesc, setEditDesc\] = useState\(''\);/;
code = code.replace(regexState, `const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenMenuId(null);
      setInlineEditId(null);
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);`);

// Remove backdrops from openMenuId
code = code.replace(
  '<div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }}></div>',
  ''
);

// Remove backdrops from inlineEditId
code = code.replace(
  '<div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setInlineEditId(null); }}></div>',
  ''
);

// Add stopPropagation to menus
code = code.replace(
  '<div className="absolute right-0 top-full mt-1 z-[9999] w-48',
  '<div onClick={e => e.stopPropagation()} className="absolute right-0 top-full mt-1 z-[9999] w-48'
);

fs.writeFileSync('src/components/DraggableDashboard.tsx', code);
