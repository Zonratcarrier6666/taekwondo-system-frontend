import React, { createContext, useContext, useState, useEffect } from 'react';
// IMPORTACIÓN DE TIPOS: Usamos 'import type' para cumplir con verbatimModuleSyntax
import type { ReactNode } from 'react';
import type { User, Role, ThemeName, AuthContextType } from '../types/escuela.types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
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
          applyTheme(savedTheme || parsed.tema || 'auto');
        } else {
          applyTheme(savedTheme || 'auto');
        }
      } catch {
        // Limpiamos el catch para evitar el error de variable no usada 'e'
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
    const userData: User = { username, rol: role, tema: 'auto' };
    localStorage.setItem('user_session', JSON.stringify(userData));
    setUser(userData);
    applyTheme('auto');
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_session');
    setUser(null);
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
    <AuthContext.Provider value={{ user, login, logout, isInitializing, setTheme, currentTheme }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};