/**
 * SERVICIO DE TEMA
 * Administra los colores globales basados en la configuración de la escuela.
 * Sincronizado con src/constants/themes.ts
 */

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  bgModal: string;
}

// Mapa de temas sincronizado con los IDs de src/constants/themes.ts
const THEME_MAP: Record<string, ThemeColors> = {

  // ─────────────────────────────────────────
  //  TEMAS ORIGINALES
  // ─────────────────────────────────────────
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
  "forest-dojo": {
    primary: "#059669",
    primaryHover: "#047857",
    bgModal: "rgba(5, 150, 105, 0.1)"
  },
  "orange-tiger": {
    primary: "#f97316",
    primaryHover: "#ea6b0a",
    bgModal: "rgba(249, 115, 22, 0.1)"
  },
  "purple-ninja": {
    primary: "#a855f7",
    primaryHover: "#9333ea",
    bgModal: "rgba(168, 85, 247, 0.1)"
  },
  "brown-earth": {
    primary: "#78350f",
    primaryHover: "#5c2a0b",
    bgModal: "rgba(120, 53, 15, 0.1)"
  },
  "sakura-dojo": {
    primary: "#f472b6",
    primaryHover: "#ec4899",
    bgModal: "rgba(244, 114, 182, 0.1)"
  },
  "golden-sun": {
    primary: "#eab308",
    primaryHover: "#ca9e07",
    bgModal: "rgba(234, 179, 8, 0.1)"
  },
  "light": {
    primary: "#3b82f6",
    primaryHover: "#2563eb",
    bgModal: "rgba(59, 130, 246, 0.1)"
  },
  "dark-martial": {
    primary: "#3b82f6",
    primaryHover: "#2563eb",
    bgModal: "rgba(59, 130, 246, 0.1)"
  },
  "black-gold": {
    primary: "#d4af37",
    primaryHover: "#b8962e",
    bgModal: "rgba(212, 175, 55, 0.1)"
  },
  "black-red": {
    primary: "#ef4444",
    primaryHover: "#dc2626",
    bgModal: "rgba(239, 68, 68, 0.1)"
  },
  "black-green": {
    primary: "#22c55e",
    primaryHover: "#16a34a",
    bgModal: "rgba(34, 197, 94, 0.1)"
  },
  "black-orange": {
    primary: "#f97316",
    primaryHover: "#ea6b0a",
    bgModal: "rgba(249, 115, 22, 0.1)"
  },
  "midnight-void": {
    primary: "#6366f1",
    primaryHover: "#4f46e5",
    bgModal: "rgba(99, 102, 241, 0.1)"
  },
  "samurai-armor": {
    primary: "#991b1b",
    primaryHover: "#7f1d1d",
    bgModal: "rgba(153, 27, 27, 0.1)"
  },
  "obsidian-flame": {
    primary: "#ea580c",
    primaryHover: "#c2410c",
    bgModal: "rgba(234, 88, 12, 0.1)"
  },
  "royal-spirit": {
    primary: "#8b5cf6",
    primaryHover: "#7c3aed",
    bgModal: "rgba(139, 92, 246, 0.1)"
  },
  "desert-wind": {
    primary: "#d97706",
    primaryHover: "#b45309",
    bgModal: "rgba(217, 119, 6, 0.1)"
  },
  "cyan-glacier": {
    primary: "#06b6d4",
    primaryHover: "#0891b2",
    bgModal: "rgba(6, 182, 212, 0.1)"
  },
  "silver-moon": {
    primary: "#94a3b8",
    primaryHover: "#64748b",
    bgModal: "rgba(148, 163, 184, 0.1)"
  },

  // ─────────────────────────────────────────
  //  NUEVOS TEMAS CLAROS
  // ─────────────────────────────────────────
  "sky-breeze": {
    primary: "#0ea5e9",
    primaryHover: "#0284c7",
    bgModal: "rgba(14, 165, 233, 0.1)"
  },
  "mint-fresh": {
    primary: "#10b981",
    primaryHover: "#059669",
    bgModal: "rgba(16, 185, 129, 0.1)"
  },
  "lavender-dojo": {
    primary: "#c084fc",
    primaryHover: "#a855f7",
    bgModal: "rgba(192, 132, 252, 0.1)"
  },
  "coral-sunrise": {
    primary: "#f43f5e",
    primaryHover: "#e11d48",
    bgModal: "rgba(244, 63, 94, 0.1)"
  },
  "teal-wave": {
    primary: "#14b8a6",
    primaryHover: "#0d9488",
    bgModal: "rgba(20, 184, 166, 0.1)"
  },
  "peach-blossom": {
    primary: "#fb923c",
    primaryHover: "#f97316",
    bgModal: "rgba(251, 146, 60, 0.1)"
  },
  "lime-energy": {
    primary: "#84cc16",
    primaryHover: "#65a30d",
    bgModal: "rgba(132, 204, 22, 0.1)"
  },
  "rose-garden": {
    primary: "#e11d48",
    primaryHover: "#be123c",
    bgModal: "rgba(225, 29, 72, 0.1)"
  },
  "amber-warm": {
    primary: "#f59e0b",
    primaryHover: "#d97706",
    bgModal: "rgba(245, 158, 11, 0.1)"
  },
  "indigo-clear": {
    primary: "#6366f1",
    primaryHover: "#4f46e5",
    bgModal: "rgba(99, 102, 241, 0.1)"
  },
  "cream-zen": {
    primary: "#b45309",
    primaryHover: "#92400e",
    bgModal: "rgba(180, 83, 9, 0.1)"
  },
  "aqua-dojo": {
    primary: "#22d3ee",
    primaryHover: "#06b6d4",
    bgModal: "rgba(34, 211, 238, 0.1)"
  },

  // ─────────────────────────────────────────
  //  NUEVOS TEMAS OSCUROS
  // ─────────────────────────────────────────
  "dark-cobalt": {
    primary: "#1d4ed8",
    primaryHover: "#1e40af",
    bgModal: "rgba(29, 78, 216, 0.15)"
  },
  "dark-emerald": {
    primary: "#065f46",
    primaryHover: "#064e3b",
    bgModal: "rgba(6, 95, 70, 0.15)"
  },
  "dark-crimson": {
    primary: "#9f1239",
    primaryHover: "#881337",
    bgModal: "rgba(159, 18, 57, 0.15)"
  },
  "dark-violet": {
    primary: "#5b21b6",
    primaryHover: "#4c1d95",
    bgModal: "rgba(91, 33, 182, 0.15)"
  },
  "dark-cyan": {
    primary: "#0e7490",
    primaryHover: "#155e75",
    bgModal: "rgba(14, 116, 144, 0.15)"
  },
  "dark-amber": {
    primary: "#92400e",
    primaryHover: "#78350f",
    bgModal: "rgba(146, 64, 14, 0.15)"
  },
  "dark-rose": {
    primary: "#9f1239",
    primaryHover: "#881337",
    bgModal: "rgba(159, 18, 57, 0.15)"
  },
  "dark-teal": {
    primary: "#134e4a",
    primaryHover: "#0f3d3a",
    bgModal: "rgba(19, 78, 74, 0.15)"
  },
  "neon-purple": {
    primary: "#d946ef",
    primaryHover: "#c026d3",
    bgModal: "rgba(217, 70, 239, 0.15)"
  },
  "neon-green": {
    primary: "#4ade80",
    primaryHover: "#22c55e",
    bgModal: "rgba(74, 222, 128, 0.15)"
  },
  "neon-blue": {
    primary: "#38bdf8",
    primaryHover: "#0ea5e9",
    bgModal: "rgba(56, 189, 248, 0.15)"
  },
  "neon-red": {
    primary: "#fb7185",
    primaryHover: "#f43f5e",
    bgModal: "rgba(251, 113, 133, 0.15)"
  },
  "carbon-steel": {
    primary: "#64748b",
    primaryHover: "#475569",
    bgModal: "rgba(100, 116, 139, 0.15)"
  },
  "deep-space": {
    primary: "#7c3aed",
    primaryHover: "#6d28d9",
    bgModal: "rgba(124, 58, 237, 0.15)"
  },
  "blood-moon": {
    primary: "#dc2626",
    primaryHover: "#b91c1c",
    bgModal: "rgba(220, 38, 38, 0.15)"
  },
};

export const themeService = {
  /**
   * Aplica las variables CSS al elemento :root y sincroniza localStorage
   * @param themeId El ID del tema (ej: 'rojo-dragon')
   */
  applyTheme: (themeId: string | null) => {
    const id = (themeId === 'auto' || !themeId) ? "blue-ocean" : themeId;
    const theme = THEME_MAP[id] || THEME_MAP["blue-ocean"];

    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-primary-hover', theme.primaryHover);
    root.style.setProperty('--color-bg-theme-modal', theme.bgModal);
    root.setAttribute('data-theme', id);

    localStorage.setItem('current_theme_name', id);
    localStorage.setItem('theme_preference', id);
  },

  /**
   * Recupera e inicializa el tema guardado
   */
  init: () => {
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
  },

  /**
   * Devuelve los colores de un tema sin aplicarlos
   * @param themeId El ID del tema
   */
  getThemeColors: (themeId: string): ThemeColors => {
    const id = (themeId === 'auto' || !themeId) ? "blue-ocean" : themeId;
    return THEME_MAP[id] || THEME_MAP["blue-ocean"];
  },

  /**
   * Verifica si un ID de tema existe en el mapa
   * @param themeId El ID del tema
   */
  isValidTheme: (themeId: string): boolean => {
    return themeId in THEME_MAP;
  }
};