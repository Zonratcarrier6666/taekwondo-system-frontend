import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// @ts-ignore
import { AuthProvider, useAuth } from './context/AuthContext';
// @ts-ignore
import { LoginView } from './views/auth/LoginView';
// @ts-ignore
import { EscuelaDashboard } from './views/escuela/EscuelaDashboard';
// @ts-ignore
import { SuperAdminDashboard } from './views/superadmin/SuperAdminDashboard';

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

/** Normaliza el rol sin importar si viene como 'rol' o 'role' */
const getRol = (user: any): string =>
  (user?.rol || user?.role || '').toLowerCase();

// ─────────────────────────────────────────────────────────────
//  PRIVATE ROUTE
// ─────────────────────────────────────────────────────────────
const PrivateRoute = ({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: string;
}) => {
  const { user, isInitializing } = useAuth();

  if (isInitializing) return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617]">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(59,130,246,0.4)]" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse">
          Validando Credenciales...
        </p>
      </div>
    </div>
  );

  if (!user) return <Navigate to="/auth/login" replace />;

  if (role && getRol(user) !== role.toLowerCase())
    return <Navigate to="/" replace />;

  return <>{children}</>;
};

// ─────────────────────────────────────────────────────────────
//  REDIRECCIÓN RAÍZ según rol
// ─────────────────────────────────────────────────────────────
const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth/login" replace />;

  const rol = getRol(user);
  if (rol === 'escuela')     return <Navigate to="/escuela"     replace />;
  if (rol === 'superadmin')  return <Navigate to="/superadmin"  replace />;
  if (rol === 'profesor')    return <Navigate to="/profesor"    replace />;

  // Rol desconocido → login
  return <Navigate to="/auth/login" replace />;
};

// ─────────────────────────────────────────────────────────────
//  APP CONTENT
// ─────────────────────────────────────────────────────────────
const AppContent = () => {
  const { user, isInitializing } = useAuth();

  useEffect(() => {
    document.title = 'TKW SYSTEM | Management Elite';
    const favicon = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (favicon) favicon.href = '../src/assets/TKW_Logo_claro.png';
  }, []);

  if (isInitializing) return null;

  return (
    <Routes>
      {/* Login — redirige al home si ya hay sesión */}
      <Route
        path="/auth/login"
        element={user ? <Navigate to="/" replace /> : <LoginView />}
      />

      {/* Escuela */}
      <Route
        path="/escuela/*"
        element={
          <PrivateRoute role="Escuela">
            <EscuelaDashboard />
          </PrivateRoute>
        }
      />

      {/* Superadmin */}
      <Route
        path="/superadmin/*"
        element={
          <PrivateRoute role="Superadmin">
            <SuperAdminDashboard />
          </PrivateRoute>
        }
      />

      {/* Raíz dinámica */}
      <Route path="/" element={<RootRedirect />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// ─────────────────────────────────────────────────────────────
//  ENTRY POINT
// ─────────────────────────────────────────────────────────────
export const App = () => (
  <AuthProvider>
    <Router>
      <AppContent />
    </Router>
  </AuthProvider>
);

export default App;