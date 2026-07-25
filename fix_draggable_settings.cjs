const fs = require('fs');
let code = fs.readFileSync('src/components/DraggableDashboard.tsx', 'utf-8');

if (!code.includes("useSettings")) {
  code = code.replace(
    "import { Plus, MoreHorizontal, MoreVertical } from 'lucide-react';",
    "import { Plus, MoreHorizontal, MoreVertical } from 'lucide-react';\nimport { useSettings } from '../contexts/SettingsContext';"
  );
  
  code = code.replace(
    "export default function DraggableDashboard({",
    "export default function DraggableDashboard({\n  settings,"
  );

  code = code.replace(
    "  widgetVisibility: Record<string, boolean>;\n}) {",
    "  widgetVisibility: Record<string, boolean>;\n  settings: any;\n}) {"
  );
}

fs.writeFileSync('src/components/DraggableDashboard.tsx', code);
