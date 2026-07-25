const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

if (!code.includes("import { useAuth }")) {
  code = "import { useAuth } from './contexts/AuthContext';\nimport { Navigate } from 'react-router-dom';\n" + code;
  
  const compStart = "export default function App() {";
  const authLogic = `
  const { user, isLoading: authLoading, logout } = useAuth();
  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B] text-white">در حال بارگذاری...</div>;
  if (!user) return <Navigate to="/login" replace />;
  `;
  
  code = code.replace(compStart, compStart + authLogic);
  fs.writeFileSync('src/App.tsx', code);
}
