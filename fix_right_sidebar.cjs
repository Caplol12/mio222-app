const fs = require('fs');
let code = fs.readFileSync('src/components/RightSidebar.tsx', 'utf-8');

if (!code.includes("import { useAuth }")) {
  code = code.replace("import React from 'react';", "import React from 'react';\nimport { useAuth } from '../contexts/AuthContext';");
}

if (!code.includes("const { user } = useAuth();")) {
  code = code.replace("const { settings } = useSettings();", "const { settings } = useSettings();\n  const { user } = useAuth();");
}

fs.writeFileSync('src/components/RightSidebar.tsx', code);
