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
}

export const LISTA_TEMAS: ThemeConfig[] = [
  { id: 'blue-ocean', color: '#2563eb', label: 'Azul', type: 'bubbles', icon: '🫧' },
  { id: 'rojo-dragon', color: '#c8102e', label: 'Rojo D', type: 'pulse', icon: '🔥' },
  { id: 'forest-dojo', color: '#059669', label: 'Verde', type: 'leaves', icon: '🍃' },
  { id: 'orange-tiger', color: '#f97316', label: 'Tigre', type: 'pulse', icon: '🔸' },
  { id: 'purple-ninja', color: '#a855f7', label: 'Ninja', type: 'spirit', icon: '🔮' },
  { id: 'brown-earth', color: '#78350f', label: 'Tierra', type: 'leaves', icon: '🍂' },
  { id: 'sakura-dojo', color: '#f472b6', label: 'Sakura', type: 'sakura', icon: '🌸' },
  { id: 'golden-sun', color: '#eab308', label: 'Sol', type: 'stars', icon: '☀️' },
  { id: 'light', color: '#3b82f6', label: 'Claro', type: 'float', icon: '•' },
  { id: 'dark-martial', color: '#3b82f6', label: 'Noche', type: 'fog', icon: '☁️' },
  { id: 'black-gold', color: '#d4af37', label: 'Oro/N', type: 'stars', icon: '✨' },
  { id: 'black-red', color: '#ef4444', label: 'Rojo/N', type: 'embers', icon: '🔥' },
  { id: 'black-green', color: '#22c55e', label: 'Verde/N', type: 'pulse', icon: '⚡' },
  { id: 'black-orange', color: '#f97316', label: 'Nara/N', type: 'embers', icon: '💥' },
  { id: 'midnight-void', color: '#6366f1', label: 'Abismo', type: 'fog', icon: '🌌' },
  { id: 'samurai-armor', color: '#991b1b', label: 'Honor', type: 'float', icon: '🛡️' },
  { id: 'obsidian-flame', color: '#ea580c', label: 'Magma', type: 'embers', icon: '🏮' },
  { id: 'royal-spirit', color: '#8b5cf6', label: 'Místico', type: 'spirit', icon: '🔱' },
  { id: 'desert-wind', color: '#d97706', label: 'Viento', type: 'fog', icon: '🌪️' },
  { id: 'cyan-glacier', color: '#06b6d4', label: 'Glaciar', type: 'bubbles', icon: '❄️' },
  { id: 'silver-moon', color: '#94a3b8', label: 'Luna', type: 'stars', icon: '🌙' },
];