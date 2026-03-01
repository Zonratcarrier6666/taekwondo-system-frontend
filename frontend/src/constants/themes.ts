/**
 * ARCHIVO: src/constants/themes.ts
 * Este es el único lugar donde se definen los colores, iconos y lógicas de fondo.
 * Si quieres cambiar un color o agregar un tema, hazlo aquí y se reflejará en toda la app.
 */

export interface ThemeConfig {
  id: string;
  color: string;
  label: string;
  type: 'bubbles' | 'pulse' | 'leaves' | 'spirit' | 'sakura' | 'stars' | 'embers' | 'fog' | 'float';
  icon: string;
  dark?: boolean; // true = tema oscuro, false/undefined = claro
}

export const LISTA_TEMAS: ThemeConfig[] = [

  // ─────────────────────────────────────────
  //  TEMAS ORIGINALES
  // ─────────────────────────────────────────
  { id: 'blue-ocean',      color: '#2563eb', label: 'Azul',    type: 'bubbles', icon: '🫧' },
  { id: 'rojo-dragon',     color: '#c8102e', label: 'Rojo D',  type: 'pulse',   icon: '🔥' },
  { id: 'forest-dojo',     color: '#059669', label: 'Verde',   type: 'leaves',  icon: '🍃' },
  { id: 'orange-tiger',    color: '#f97316', label: 'Tigre',   type: 'pulse',   icon: '🔸' },
  { id: 'purple-ninja',    color: '#a855f7', label: 'Ninja',   type: 'spirit',  icon: '🔮' },
  { id: 'brown-earth',     color: '#78350f', label: 'Tierra',  type: 'leaves',  icon: '🍂' },
  { id: 'sakura-dojo',     color: '#f472b6', label: 'Sakura',  type: 'sakura',  icon: '🌸' },
  { id: 'golden-sun',      color: '#eab308', label: 'Sol',     type: 'stars',   icon: '☀️' },
  { id: 'light',           color: '#3b82f6', label: 'Claro',   type: 'float',   icon: '•' },
  { id: 'dark-martial',    color: '#3b82f6', label: 'Noche',   type: 'fog',     icon: '☁️',  dark: true },
  { id: 'black-gold',      color: '#d4af37', label: 'Oro/N',   type: 'stars',   icon: '✨',  dark: true },
  { id: 'black-red',       color: '#ef4444', label: 'Rojo/N',  type: 'embers',  icon: '🔥',  dark: true },
  { id: 'black-green',     color: '#22c55e', label: 'Verde/N', type: 'pulse',   icon: '⚡',  dark: true },
  { id: 'black-orange',    color: '#f97316', label: 'Nara/N',  type: 'embers',  icon: '💥',  dark: true },
  { id: 'midnight-void',   color: '#6366f1', label: 'Abismo',  type: 'fog',     icon: '🌌',  dark: true },
  { id: 'samurai-armor',   color: '#991b1b', label: 'Honor',   type: 'float',   icon: '🛡️',  dark: true },
  { id: 'obsidian-flame',  color: '#ea580c', label: 'Magma',   type: 'embers',  icon: '🏮',  dark: true },
  { id: 'royal-spirit',    color: '#8b5cf6', label: 'Místico', type: 'spirit',  icon: '🔱',  dark: true },
  { id: 'desert-wind',     color: '#d97706', label: 'Viento',  type: 'fog',     icon: '🌪️' },
  { id: 'cyan-glacier',    color: '#06b6d4', label: 'Glaciar', type: 'bubbles', icon: '❄️' },
  { id: 'silver-moon',     color: '#94a3b8', label: 'Luna',    type: 'stars',   icon: '🌙',  dark: true },

  // ─────────────────────────────────────────
  //  NUEVOS TEMAS CLAROS
  // ─────────────────────────────────────────
  { id: 'sky-breeze',      color: '#0ea5e9', label: 'Cielo',   type: 'bubbles', icon: '🌤️' },
  { id: 'mint-fresh',      color: '#10b981', label: 'Menta',   type: 'leaves',  icon: '🌿' },
  { id: 'lavender-dojo',   color: '#c084fc', label: 'Lavanda', type: 'spirit',  icon: '💜' },
  { id: 'coral-sunrise',   color: '#f43f5e', label: 'Coral',   type: 'sakura',  icon: '🌅' },
  { id: 'teal-wave',       color: '#14b8a6', label: 'Turquesa',type: 'bubbles', icon: '🌊' },
  { id: 'peach-blossom',   color: '#fb923c', label: 'Durazno', type: 'sakura',  icon: '🍑' },
  { id: 'lime-energy',     color: '#84cc16', label: 'Lima',    type: 'pulse',   icon: '⚡' },
  { id: 'rose-garden',     color: '#e11d48', label: 'Rosa',    type: 'sakura',  icon: '🌹' },
  { id: 'amber-warm',      color: '#f59e0b', label: 'Ámbar',   type: 'stars',   icon: '🔆' },
  { id: 'indigo-clear',    color: '#6366f1', label: 'Índigo',  type: 'float',   icon: '🔷' },
  { id: 'cream-zen',       color: '#b45309', label: 'Zen',     type: 'float',   icon: '☮️' },
  { id: 'aqua-dojo',       color: '#22d3ee', label: 'Aqua',    type: 'bubbles', icon: '💎' },

  // ─────────────────────────────────────────
  //  NUEVOS TEMAS OSCUROS
  // ─────────────────────────────────────────
  { id: 'dark-cobalt',     color: '#1d4ed8', label: 'Cobalto', type: 'fog',     icon: '🌑',  dark: true },
  { id: 'dark-emerald',    color: '#065f46', label: 'Esmeralda',type: 'leaves', icon: '🌲',  dark: true },
  { id: 'dark-crimson',    color: '#9f1239', label: 'Carmesí', type: 'embers',  icon: '🩸',  dark: true },
  { id: 'dark-violet',     color: '#5b21b6', label: 'Violeta', type: 'spirit',  icon: '🌒',  dark: true },
  { id: 'dark-cyan',       color: '#0e7490', label: 'Cian/N',  type: 'bubbles', icon: '🫙',  dark: true },
  { id: 'dark-amber',      color: '#92400e', label: 'Ámbar/N', type: 'embers',  icon: '🕯️',  dark: true },
  { id: 'dark-rose',       color: '#9f1239', label: 'Rosa/N',  type: 'sakura',  icon: '🥀',  dark: true },
  { id: 'dark-teal',       color: '#134e4a', label: 'Teal/N',  type: 'fog',     icon: '🌿',  dark: true },
  { id: 'neon-purple',     color: '#d946ef', label: 'Neón/P',  type: 'spirit',  icon: '🟣',  dark: true },
  { id: 'neon-green',      color: '#4ade80', label: 'Neón/V',  type: 'pulse',   icon: '🟢',  dark: true },
  { id: 'neon-blue',       color: '#38bdf8', label: 'Neón/A',  type: 'bubbles', icon: '🔵',  dark: true },
  { id: 'neon-red',        color: '#fb7185', label: 'Neón/R',  type: 'embers',  icon: '🔴',  dark: true },
  { id: 'carbon-steel',    color: '#64748b', label: 'Acero',   type: 'fog',     icon: '⚙️',  dark: true },
  { id: 'deep-space',      color: '#7c3aed', label: 'Cosmos',  type: 'stars',   icon: '🚀',  dark: true },
  { id: 'blood-moon',      color: '#dc2626', label: 'Eclipse', type: 'embers',  icon: '🌕',  dark: true },
];

// ─────────────────────────────────────────
//  HELPERS DE FILTRADO
// ─────────────────────────────────────────

/** Solo temas claros */
export const TEMAS_CLAROS = LISTA_TEMAS.filter(t => !t.dark);

/** Solo temas oscuros */
export const TEMAS_OSCUROS = LISTA_TEMAS.filter(t => t.dark);

/** Buscar tema por id */
export const getTemaById = (id: string): ThemeConfig | undefined =>
  LISTA_TEMAS.find(t => t.id === id);