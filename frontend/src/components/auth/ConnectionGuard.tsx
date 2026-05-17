import React, { useEffect, useState, useCallback } from 'react';
import { NotFoundView } from '../../views/errors/NotFoundView';

interface ConnectionGuardProps {
  children: React.ReactNode;
}

export const ConnectionGuard: React.FC<ConnectionGuardProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isServerAlive, setIsServerAlive] = useState<boolean>(true);

  // URL de tu API para hacer pings ligeros
  const API_PING_URL = 'https://almonacisystems.devsweett.com/api/docs';

  // Función para verificar si el servidor está vivo realmente
  const checkServerStatus = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) {
      setIsOnline(false);
      return false;
    }

    try {
      // Intentamos obtener el Swagger o raíz con un timeout bajo para no colgar la UI
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 segundos de límite

      const response = await fetch(API_PING_URL, {
        method: 'GET',
        mode: 'no-cors', // Para evitar problemas de CORS al hacer pings rápidos
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      setIsServerAlive(true);
      setIsOnline(true);
      return true;
    } catch (err) {
      // Si falla la petición (502 bad gateway, timeout o servidor offline)
      setIsServerAlive(false);
      return false;
    }
  }, [API_PING_URL]);

  useEffect(() => {
    // Escuchar el estado de red nativo del navegador
    const handleOnlineStatus = () => {
      setIsOnline(true);
      checkServerStatus();
    };

    const handleOfflineStatus = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);

    // Hacemos un chequeo de salud del backend cada 30 segundos en segundo plano
    checkServerStatus();
    const intervalId = setInterval(checkServerStatus, 30000);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOfflineStatus);
      clearInterval(intervalId);
    };
  }, [checkServerStatus]);

  // Ejecutado manualmente cuando el usuario presiona "Reintentar Conexión"
  const handleManualRetry = async () => {
    const alive = await checkServerStatus();
    if (!alive) {
      throw new Error("Server down");
    }
  };

  // Si no hay internet o el servidor de Nginx/Uvicorn está caído, bloqueamos la UI con estilo
  if (!isOnline || !isServerAlive) {
    return <NotFoundView />;
  }

  return <>{children}</>;
};

export default ConnectionGuard;