const fs = require('fs');
let code = fs.readFileSync('src/components/DraggableDashboard.tsx', 'utf-8');

code = code.replace(
  "import { Plus, MoreHorizontal, MoreVertical } from 'lucide-react';",
  "import { Plus, MoreHorizontal, MoreVertical, ExternalLink, EyeOff, Edit2, Trash2 } from 'lucide-react';"
);

fs.writeFileSync('src/components/DraggableDashboard.tsx', code);
