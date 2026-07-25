const fs = require('fs');
let code = fs.readFileSync('src/components/WallpaperModal.tsx', 'utf-8');

const newPresets = `  { type: 'image', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2048&auto=format&fit=crop' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=2048&auto=format&fit=crop' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?q=80&w=2048&auto=format&fit=crop' },
`;

code = code.replace(/const PRESETS = \[/, 'const PRESETS = [\n' + newPresets);

fs.writeFileSync('src/components/WallpaperModal.tsx', code);
