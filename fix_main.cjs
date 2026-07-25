const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf-8');

const targetImports = "import { SettingsProvider } from './contexts/SettingsContext';";
const replacementImports = "import { SettingsProvider } from './contexts/SettingsContext';\nimport { AuthProvider } from './contexts/AuthContext';\nimport { GoogleOAuthProvider } from '@react-oauth/google';\nimport AuthPage from './components/AuthPage.tsx';";

const targetProviders = "<SettingsProvider>";
const replacementProviders = "<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>\n      <AuthProvider>\n      <SettingsProvider>";

const targetRoutes = "<Route path=\"/\" element={<App />} />";
const replacementRoutes = "<Route path=\"/\" element={<App />} />\n          <Route path=\"/login\" element={<AuthPage />} />";

const targetProvidersEnd = "</SettingsProvider>";
const replacementProvidersEnd = "</SettingsProvider>\n      </AuthProvider>\n    </GoogleOAuthProvider>";

code = code.replace(targetImports, replacementImports);
code = code.replace(targetProviders, replacementProviders);
code = code.replace(targetRoutes, replacementRoutes);
code = code.replace(targetProvidersEnd, replacementProvidersEnd);

fs.writeFileSync('src/main.tsx', code);
