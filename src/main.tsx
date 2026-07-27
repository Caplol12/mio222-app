import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import './index.css';
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AuthPage from './components/AuthPage.tsx';
import { isAdmin } from './utils/admin';

const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!isAdmin(user?.email)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <AuthProvider>
      <SettingsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/admin" element={
            <ProtectedAdminRoute>
              <AdminPanel />
            </ProtectedAdminRoute>
          } />
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);

