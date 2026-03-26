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
  dark?: boolean;
  /** Clase CSS aplicada al contenedor de fondo animado — definida en index.css */
  animationClass?: string;
}

/**
 * ─────────────────────────────────────────────────────────────
 *  ANIMACIONES POR TIPO  ← pega esto en tu index.css / globals.css
 * ─────────────────────────────────────────────────────────────
 *
 * Cada tipo tiene su propio keyframe. El color de las partículas
 * usa var(--color-primary) para adaptarse automáticamente al tema activo.
 *
 * @keyframes tkw-bubble  → burbujas que suben y se desvanecen
 * @keyframes tkw-pulse   → ondas de energía expansivas desde el centro
 * @keyframes tkw-leaf    → hojas que caen en diagonal con rotación
 * @keyframes tkw-spirit  → orbes de energía que aparecen y se elevan
 * @keyframes tkw-sakura  → pétalos que caen en espiral suave
 * @keyframes tkw-star    → estrellas que parpadean con escala
 * @keyframes tkw-ember   → brasas que suben y se apagan
 * @keyframes tkw-fog     → niebla que se desplaza horizontalmente
 * @keyframes tkw-float   → objetos que flotan arriba/abajo con ligera rotación
 *
 * ─── COPIA ESTE BLOQUE A index.css ───────────────────────────
 *
 * @keyframes tkw-bubble {
 *   0%   { transform: translateY(0) scale(1);      opacity: 0.7; }
 *   80%  { transform: translateY(-80vh) scale(1.2); opacity: 0.3; }
 *   100% { transform: translateY(-90vh) scale(0.8); opacity: 0; }
 * }
 * @keyframes tkw-pulse-ring {
 *   0%   { transform: scale(0.6); opacity: 0.6; }
 *   100% { transform: scale(2.8); opacity: 0; }
 * }
 * @keyframes tkw-leaf {
 *   0%   { transform: translate(0, -10px) rotate(0deg);      opacity: 0.8; }
 *   100% { transform: translate(60px, 100vh) rotate(360deg); opacity: 0; }
 * }
 * @keyframes tkw-spirit {
 *   0%   { transform: translateY(0) scale(1);      opacity: 0; }
 *   30%  { opacity: 0.85; }
 *   70%  { opacity: 0.6; }
 *   100% { transform: translateY(-70px) scale(0.3); opacity: 0; }
 * }
 * @keyframes tkw-sakura {
 *   0%   { transform: translate(0, -20px) rotate(0deg) scale(1);       opacity: 0.9; }
 *   50%  { transform: translate(-30px, 50vh) rotate(180deg) scale(0.8); opacity: 0.6; }
 *   100% { transform: translate(20px, 100vh) rotate(360deg) scale(0.4); opacity: 0; }
 * }
 * @keyframes tkw-star {
 *   0%, 100% { opacity: 0.1; transform: scale(0.8); }
 *   50%       { opacity: 1;   transform: scale(1.4); }
 * }
 * @keyframes tkw-ember {
 *   0%   { transform: translateY(0)      translateX(0)     scale(1);   opacity: 1; }
 *   50%  { transform: translateY(-40px)  translateX(10px)  scale(0.8); opacity: 0.7; }
 *   100% { transform: translateY(-100px) translateX(-5px)  scale(0.2); opacity: 0; }
 * }
 * @keyframes tkw-fog {
 *   0%   { transform: translateX(-10%) scaleY(1);   opacity: 0.35; }
 *   50%  { transform: translateX(6%)   scaleY(1.1); opacity: 0.55; }
 *   100% { transform: translateX(-10%) scaleY(1);   opacity: 0.35; }
 * }
 * @keyframes tkw-float {
 *   0%, 100% { transform: translateY(0px)   rotate(0deg); }
 *   33%       { transform: translateY(-14px) rotate(3deg); }
 *   66%       { transform: translateY(-6px)  rotate(-2deg); }
 * }
 * ─────────────────────────────────────────────────────────────
 */

export const LISTA_TEMAS: ThemeConfig[] = [

  // ─────────────────────────────────────────
  //  TEMAS ORIGINALES
  // ─────────────────────────────────────────
  { id: 'blue-ocean',      color: '#2563eb', label: 'Azul',     type: 'bubbles', icon: '🫧', animationClass: 'anim-bubbles' },
  { id: 'rojo-dragon',     color: '#c8102e', label: 'Rojo D',   type: 'pulse',   icon: '🔥', animationClass: 'anim-pulse' },
  { id: 'forest-dojo',     color: '#059669', label: 'Verde',    type: 'leaves',  icon: '🍃', animationClass: 'anim-leaves' },
  { id: 'orange-tiger',    color: '#f97316', label: 'Tigre',    type: 'pulse',   icon: '🔸', animationClass: 'anim-pulse' },
  { id: 'purple-ninja',    color: '#a855f7', label: 'Ninja',    type: 'spirit',  icon: '🔮', animationClass: 'anim-spirit' },
  { id: 'brown-earth',     color: '#78350f', label: 'Tierra',   type: 'leaves',  icon: '🍂', animationClass: 'anim-leaves' },
  { id: 'sakura-dojo',     color: '#f472b6', label: 'Sakura',   type: 'sakura',  icon: '🌸', animationClass: 'anim-sakura' },
  { id: 'golden-sun',      color: '#eab308', label: 'Sol',      type: 'stars',   icon: '☀️', animationClass: 'anim-stars' },
  { id: 'light',           color: '#3b82f6', label: 'Claro',    type: 'float',   icon: '•',  animationClass: 'anim-float' },
  { id: 'dark-martial',    color: '#3b82f6', label: 'Noche',    type: 'fog',     icon: '☁️', dark: true, animationClass: 'anim-fog' },
  { id: 'black-gold',      color: '#d4af37', label: 'Oro/N',    type: 'stars',   icon: '✨', dark: true, animationClass: 'anim-stars' },
  { id: 'black-red',       color: '#ef4444', label: 'Rojo/N',   type: 'embers',  icon: '🔥', dark: true, animationClass: 'anim-embers' },
  { id: 'black-green',     color: '#22c55e', label: 'Verde/N',  type: 'pulse',   icon: '⚡', dark: true, animationClass: 'anim-pulse' },
  { id: 'black-orange',    color: '#f97316', label: 'Nara/N',   type: 'embers',  icon: '💥', dark: true, animationClass: 'anim-embers' },
  { id: 'midnight-void',   color: '#6366f1', label: 'Abismo',   type: 'fog',     icon: '🌌', dark: true, animationClass: 'anim-fog' },
  { id: 'samurai-armor',   color: '#991b1b', label: 'Honor',    type: 'float',   icon: '🛡️', dark: true, animationClass: 'anim-float' },
  { id: 'obsidian-flame',  color: '#ea580c', label: 'Magma',    type: 'embers',  icon: '🏮', dark: true, animationClass: 'anim-embers' },
  { id: 'royal-spirit',    color: '#8b5cf6', label: 'Místico',  type: 'spirit',  icon: '🔱', dark: true, animationClass: 'anim-spirit' },
  { id: 'desert-wind',     color: '#d97706', label: 'Viento',   type: 'fog',     icon: '🌪️', animationClass: 'anim-fog' },
  { id: 'cyan-glacier',    color: '#06b6d4', label: 'Glaciar',  type: 'bubbles', icon: '❄️', animationClass: 'anim-bubbles' },
  { id: 'silver-moon',     color: '#94a3b8', label: 'Luna',     type: 'stars',   icon: '🌙', dark: true, animationClass: 'anim-stars' },

  // ─────────────────────────────────────────
  //  NUEVOS TEMAS CLAROS
  // ─────────────────────────────────────────
  { id: 'sky-breeze',      color: '#0ea5e9', label: 'Cielo',    type: 'bubbles', icon: '🌤️', animationClass: 'anim-bubbles' },
  { id: 'mint-fresh',      color: '#10b981', label: 'Menta',    type: 'leaves',  icon: '🌿', animationClass: 'anim-leaves' },
  { id: 'lavender-dojo',   color: '#c084fc', label: 'Lavanda',  type: 'spirit',  icon: '💜', animationClass: 'anim-spirit' },
  { id: 'coral-sunrise',   color: '#f43f5e', label: 'Coral',    type: 'sakura',  icon: '🌅', animationClass: 'anim-sakura' },
  { id: 'teal-wave',       color: '#14b8a6', label: 'Turquesa', type: 'bubbles', icon: '🌊', animationClass: 'anim-bubbles' },
  { id: 'peach-blossom',   color: '#fb923c', label: 'Durazno',  type: 'sakura',  icon: '🍑', animationClass: 'anim-sakura' },
  { id: 'lime-energy',     color: '#84cc16', label: 'Lima',     type: 'pulse',   icon: '⚡', animationClass: 'anim-pulse' },
  { id: 'rose-garden',     color: '#e11d48', label: 'Rosa',     type: 'sakura',  icon: '🌹', animationClass: 'anim-sakura' },
  { id: 'amber-warm',      color: '#f59e0b', label: 'Ámbar',    type: 'stars',   icon: '🔆', animationClass: 'anim-stars' },
  { id: 'indigo-clear',    color: '#6366f1', label: 'Índigo',   type: 'float',   icon: '🔷', animationClass: 'anim-float' },
  { id: 'cream-zen',       color: '#b45309', label: 'Zen',      type: 'float',   icon: '☮️', animationClass: 'anim-float' },
  { id: 'aqua-dojo',       color: '#22d3ee', label: 'Aqua',     type: 'bubbles', icon: '💎', animationClass: 'anim-bubbles' },

  // ─────────────────────────────────────────
  //  NUEVOS TEMAS OSCUROS
  // ─────────────────────────────────────────
  { id: 'dark-cobalt',     color: '#1d4ed8', label: 'Cobalto',   type: 'fog',     icon: '🌑', dark: true, animationClass: 'anim-fog' },
  { id: 'dark-emerald',    color: '#065f46', label: 'Esmeralda', type: 'leaves',  icon: '🌲', dark: true, animationClass: 'anim-leaves' },
  { id: 'dark-crimson',    color: '#9f1239', label: 'Carmesí',   type: 'embers',  icon: '🩸', dark: true, animationClass: 'anim-embers' },
  { id: 'dark-violet',     color: '#5b21b6', label: 'Violeta',   type: 'spirit',  icon: '🌒', dark: true, animationClass: 'anim-spirit' },
  { id: 'dark-cyan',       color: '#0e7490', label: 'Cian/N',    type: 'bubbles', icon: '🫙', dark: true, animationClass: 'anim-bubbles' },
  { id: 'dark-amber',      color: '#92400e', label: 'Ámbar/N',   type: 'embers',  icon: '🕯️', dark: true, animationClass: 'anim-embers' },
  { id: 'dark-rose',       color: '#9f1239', label: 'Rosa/N',    type: 'sakura',  icon: '🥀', dark: true, animationClass: 'anim-sakura' },
  { id: 'dark-teal',       color: '#134e4a', label: 'Teal/N',    type: 'fog',     icon: '🌿', dark: true, animationClass: 'anim-fog' },
  { id: 'neon-purple',     color: '#d946ef', label: 'Neón/P',    type: 'spirit',  icon: '🟣', dark: true, animationClass: 'anim-spirit' },
  { id: 'neon-green',      color: '#4ade80', label: 'Neón/V',    type: 'pulse',   icon: '🟢', dark: true, animationClass: 'anim-pulse' },
  { id: 'neon-blue',       color: '#38bdf8', label: 'Neón/A',    type: 'bubbles', icon: '🔵', dark: true, animationClass: 'anim-bubbles' },
  { id: 'neon-red',        color: '#fb7185', label: 'Neón/R',    type: 'embers',  icon: '🔴', dark: true, animationClass: 'anim-embers' },
  { id: 'carbon-steel',    color: '#64748b', label: 'Acero',     type: 'fog',     icon: '⚙️', dark: true, animationClass: 'anim-fog' },
  { id: 'deep-space',      color: '#7c3aed', label: 'Cosmos',    type: 'stars',   icon: '🚀', dark: true, animationClass: 'anim-stars' },
  { id: 'blood-moon',      color: '#dc2626', label: 'Eclipse',   type: 'embers',  icon: '🌕', dark: true, animationClass: 'anim-embers' },
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