import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, Role, ThemeName, AuthContextType } from '../types/escuela.types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  // FIX: Agregamos el estado para 'role' que pide tu AuthContextType
  const [role, setRole] = useState<Role | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('auto');

  useEffect(() => {
    const initAuth = () => {
      try {
        const savedUser = localStorage.getItem('user_session');
        const savedTheme = localStorage.getItem('theme_preference') as ThemeName;
        
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          // FIX: También recuperamos el rol del usuario guardado
          setRole(parsed.role || null);
          applyTheme(savedTheme || parsed.tema || 'auto');
        } else {
          applyTheme(savedTheme || 'auto');
        }
      } catch {
        localStorage.clear();
      } finally {
        setIsInitializing(false);
      }
    };
    initAuth();
  }, []);

  const applyTheme = (theme: ThemeName) => {
    setCurrentTheme(theme);
    const themeToApply = theme === 'auto' ? 'default' : theme;
    document.documentElement.setAttribute('data-theme', themeToApply);
  };

  const login = (token: string, role: Role, username: string) => {
    localStorage.setItem('access_token', token);
    // FIX: Cambiamos 'rol' por 'role' para que coincida con tu interfaz User
    const userData: User = { username, role, tema: 'auto' };
    localStorage.setItem('user_session', JSON.stringify(userData));
    setUser(userData);
    setRole(role); // FIX: Guardamos el rol en el estado
    applyTheme('auto');
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_session');
    setUser(null);
    setRole(null); // FIX: Limpiamos el rol al salir
  };

  const setTheme = (newTheme: ThemeName) => {
    localStorage.setItem('theme_preference', newTheme);
    applyTheme(newTheme);
    if (user) {
      const updatedUser = { ...user, tema: newTheme };
      setUser(updatedUser);
      localStorage.setItem('user_session', JSON.stringify(updatedUser));
    }
  };

  return (
    // FIX: Agregamos 'role' al value del Provider
    <AuthContext.Provider value={{ user, role, login, logout, isInitializing, setTheme, currentTheme }}>
      {children}
    </AuthContext.Provider>
  );
};

// FIX: Añadimos el ignore para que ESLint no se queje del Fast Refresh
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};