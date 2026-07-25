const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

const imports = `import { useAuth } from '../contexts/AuthContext';\nimport { Navigate } from 'react-router-dom';\nimport { isAdmin } from '../utils/admin';\n`;

if (!code.includes('import { isAdmin }')) {
  code = code.replace(`import React,`, imports + `import React,`);
}

const componentStart = `export default function AdminPanel() {
  const { getGlassStyle } = useGlassStyle();`;
  
const protectedComponentStart = `export default function AdminPanel() {
  const { user } = useAuth();
  const { getGlassStyle } = useGlassStyle();

  if (!isAdmin(user?.email)) {
    return <Navigate to="/" replace />;
  }
`;

if (code.includes(componentStart)) {
  code = code.replace(componentStart, protectedComponentStart);
} else {
  console.log("Could not find component start");
}

fs.writeFileSync('src/components/AdminPanel.tsx', code);
