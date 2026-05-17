import React, { useEffect, useState, useRef } from 'react';
// @ts-ignore
import { useAuth } from '../../context/AuthContext';
import { SessionTimeoutView } from '../../views/auth/SessionTimeoutView';

interface IdleTimerProps {
  children: React.ReactNode;
}

export const IdleTimer: React.FC<IdleTimerProps> = ({ children }) => {
  const { user } = useAuth();
  const [isTimedOut, setIsTimedOut] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 30 minutos en milisegundos (30 * 60 * 1000)
  // NOTA: Para pruebas rápidas locales puedes cambiarlo a 10000 (10 segundos)
  const TIMEOUT_IN_MS = 30 * 60 * 1000;
  //const TIMEOUT_IN_MS = 10000;
  useEffect(() => {
    // Función de cierre de sesión
    const logoutUser = () => {
      localStorage.clear(); // Limpia los tokens guardados en local storage
      setIsTimedOut(true);  // Activa la pantalla de bloqueo
    };

    // Función que reinicia el temporizador de inactividad
    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      
      // Solo corremos el cronómetro si el usuario está autenticado y no ha expirado
      if (user && !isTimedOut) {
        timerRef.current = setTimeout(logoutUser, TIMEOUT_IN_MS);
      }
    };

    // Si el usuario está activo y logueado, iniciamos la escucha de eventos
    if (user && !isTimedOut) {
      timerRef.current = setTimeout(logoutUser, TIMEOUT_IN_MS);

      // Eventos de interacción del usuario
      const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
      events.forEach(event => window.addEventListener(event, resetTimer));

      // Limpieza de eventos al desmontar el componente o cambiar estados
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        events.forEach(event => window.removeEventListener(event, resetTimer));
      };
    }
  }, [user, isTimedOut]);

  const handleRestartSession = () => {
    setIsTimedOut(false);
    // Redirige limpiamente al login de la plataforma
    window.location.href = '/auth/login';
  };

  // Bloquear la UI con la pantalla de timeout si se agotó el tiempo
  if (isTimedOut) {
    return <SessionTimeoutView onRestart={handleRestartSession} />;
  }

  return <>{children}</>;
};

export default IdleTimer;