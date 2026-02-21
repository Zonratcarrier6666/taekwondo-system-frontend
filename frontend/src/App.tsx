import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginView } from './views/auth/LoginView';
import { EscuelaDashboard } from './views/escuela/EscuelaDashboard';
import { Award } from 'lucide-react';

const AppContent = () => {
  const { user, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white dark:bg-[#020617]">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} 
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Award className="text-blue-600" size={80} />
        </motion.div>
        <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Iniciando...</p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {!user ? (
        <LoginView key="login" />
      ) : (
        user.rol === 'Escuela' ? (
          <EscuelaDashboard key="escuela" />
        ) : (
          <div key="error" className="p-20 text-center font-black dark:text-white uppercase italic">
            Dashboard para {user.rol} en desarrollo
          </div>
        )
      )}
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;