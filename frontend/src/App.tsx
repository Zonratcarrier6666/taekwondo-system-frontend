import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

/**
 * --- IMPORTACIONES DE CONTEXTO Y VISTAS ---
 * Nota: Si el compilador del Canvas muestra errores de resolución, 
 * es debido a que estos archivos residen en tu sistema local.
 */
// @ts-ignore
import { AuthProvider, useAuth } from './context/AuthContext';
// @ts-ignore
import { LoginView } from './views/auth/LoginView';
// @ts-ignore
import { EscuelaDashboard } from './views/escuela/EscuelaDashboard';

/**
 * Componente para proteger rutas privadas.
 * Utiliza 'isInitializing' para mostrar una pantalla de carga mientras
 * el AuthContext verifica el token guardado en el almacenamiento.
 */
const PrivateRoute = ({ children, role }: { children: React.ReactNode, role?: string }) => {
  const { user, isInitializing } = useAuth();

  // Pantalla de carga profesional durante la inicialización del estado
  if (isInitializing) return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617]">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(59,130,246,0.4)]"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse">
          Validando Credenciales...
        </p>
      </div>
    </div>
  );

  // Redirección si no hay sesión
  if (!user) return <Navigate to="/auth/login" replace />;
  
  // Redirección si el rol (rol/role) no coincide
  // Nota: Usamos 'user.rol' para coincidir con la respuesta del backend
  if (role && (user.rol !== role && user.role !== role)) return <Navigate to="/" replace />;

  return <>{children}</>;
};

/**
 * AppContent gestiona el enrutamiento y los metadatos globales.
 */
const AppContent = () => {
  const { user, isInitializing } = useAuth();

  // Efecto para la identidad visual de la pestaña
  useEffect(() => {
    document.title = "TKW SYSTEM | Management Elite";
    const favicon = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (favicon) {
      favicon.href = "../src/assets/TKW_Logo_claro.png";
    }
  }, []);

  // Evitamos renderizar las rutas hasta que sepamos si el usuario está logueado
  if (isInitializing) return null;

  return (
    <Routes>
      {/* Si ya hay usuario, al entrar a login redirigimos al inicio */}
      <Route 
        path="/auth/login" 
        element={user ? <Navigate to="/" replace /> : <LoginView />} 
      />

      {/* Rutas de Escuela */}
      <Route 
        path="/escuela/*" 
        element={
          <PrivateRoute role="Escuela">
            <EscuelaDashboard />
          </PrivateRoute>
        } 
      />

      {/* Redirección Raíz Dinámica */}
      <Route 
        path="/" 
        element={
          user 
            ? <Navigate to={(user.rol === 'Escuela' || user.role === 'Escuela') ? "/escuela" : "/auth/login"} replace /> 
            : <Navigate to="/auth/login" replace />
        } 
      />

      {/* Fallback universal */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

/**
 * COMPONENTE PRINCIPAL: Punto de entrada de la lógica React.
 */
export const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;