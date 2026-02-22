/**
 * SERVICIO DE TEMA
 * Administra los colores globales basados en la configuración de la escuela.
 */

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  bgModal: string;
}

// Mapa de temas sincronizado con los IDs de src/constants/themes.ts
const THEME_MAP: Record<string, ThemeColors> = {
  "blue-ocean": {
    primary: "#2563eb",
    primaryHover: "#1d4ed8",
    bgModal: "rgba(37, 99, 235, 0.1)"
  },
  "rojo-dragon": {
    primary: "#c8102e",
    primaryHover: "#a60d26",
    bgModal: "rgba(200, 16, 46, 0.1)"
  },
  "purple-ninja": {
    primary: "#a855f7",
    primaryHover: "#9333ea",
    bgModal: "rgba(168, 85, 247, 0.1)"
  },
  "forest-dojo": {
    primary: "#059669",
    primaryHover: "#047857",
    bgModal: "rgba(5, 150, 105, 0.1)"
  },
  "black-gold": {
    primary: "#d4af37",
    primaryHover: "#b8962e",
    bgModal: "rgba(212, 175, 55, 0.1)"
  },
  "midnight-void": {
    primary: "#6366f1",
    primaryHover: "#4f46e5",
    bgModal: "rgba(99, 102, 241, 0.1)"
  }
};

export const themeService = {
  /**
   * Aplica las variables CSS al elemento :root y sincroniza localstorage
   * @param themeId El ID del tema (ej: 'rojo-dragon')
   */
  applyTheme: (themeId: string | null) => {
    // Si viene 'auto' o null, usamos el por defecto 'blue-ocean'
    const id = (themeId === 'auto' || !themeId) ? "blue-ocean" : themeId;
    const theme = THEME_MAP[id] || THEME_MAP["blue-ocean"];
    
    const root = document.documentElement;
    
    // Aplicamos variables CSS para que los componentes que usan var() reaccionen
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-primary-hover', theme.primaryHover);
    root.style.setProperty('--color-bg-theme-modal', theme.bgModal);
    
    // Aplicamos el atributo data-theme para los estilos definidos en index.css
    root.setAttribute('data-theme', id);
    
    // Sincronizamos las llaves de localStorage para que los componentes autónomos lo detecten
    localStorage.setItem('current_theme_name', id);
    localStorage.setItem('theme_preference', id);
  },

  /**
   * Recupera e inicializa el tema guardado
   */
  init: () => {
    // Prioridad: 1. Preferencia guardada, 2. Sesión de usuario, 3. Por defecto
    const savedTheme = localStorage.getItem('theme_preference');
    const userSession = localStorage.getItem('user_session');
    
    let themeToApply = 'blue-ocean';

    if (savedTheme && savedTheme !== 'auto') {
      themeToApply = savedTheme;
    } else if (userSession) {
      try {
        const parsed = JSON.parse(userSession);
        if (parsed.tema && parsed.tema !== 'auto') {
          themeToApply = parsed.tema;
        }
      } catch (e) {
        console.error("Error al leer sesión para el tema");
      }
    }

    themeService.applyTheme(themeToApply);
  }
};