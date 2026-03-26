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
import {ProfesorDashboard} from "./views/profesor/ProfesorDashboard";
// @ts-ignore
import { JuezDashboard } from './views/juez/JuezDashboard';
// @ts-ignore
import { FormularioInscripcion } from './pages/FormularioInscripcion';
// @ts-ignore
import { StaffTorneoApp } from './views/staff/Stafftorneoapp';
// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
const getRol = (user: any): string =>
  (user?.rol || user?.role || '').toLowerCase();

// ─────────────────────────────────────────────────────────────
//  PRIVATE ROUTE
//  Acepta un array de roles o un rol único
// ─────────────────────────────────────────────────────────────
const PrivateRoute = ({
  children,
  role,
  roles,
}: {
  children: React.ReactNode;
  role?:  string;
  roles?: string[];
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

  const userRol = getRol(user);

  // Acepta lista de roles o rol único
  const permitidos = roles
    ? roles.map(r => r.toLowerCase())
    : role
    ? [role.toLowerCase()]
    : [];

  if (permitidos.length > 0 && !permitidos.includes(userRol))
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
  if (rol === 'escuela')    return <Navigate to="/escuela"    replace />;
  if (rol === 'superadmin') return <Navigate to="/superadmin" replace />;
  if (rol === 'profesor')   return <Navigate to="/profesor"   replace />;
  if (rol === 'juez')       return <Navigate to="/juez"       replace />;
  if (rol === 'staff')      return <Navigate to="/staff"      replace />;

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
      {/* Login */}
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

      {/* Staff — usa el mismo dashboard que Escuela */}
      <Route
        path="/staff/*"
        element={
          <PrivateRoute role="Staff">
            <StaffTorneoApp />
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

      {/* Profesor */}
      <Route
        path="/profesor/*"
        element={
          <PrivateRoute role="Profesor">
            <ProfesorDashboard />
          </PrivateRoute>
        }
      />

      {/* Juez */}
      <Route
        path="/juez/*"
        element={
          <PrivateRoute role="Juez">
            <JuezDashboard />
          </PrivateRoute>
        }
      />

      {/* Inscripción pública */}
      <Route path="/registro/:slug" element={<FormularioInscripcion />} />

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