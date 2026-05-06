/**
 * UTILIDAD COMPARTIDA: Resolución de colores de cintas
 * ─────────────────────────────────────────────────────
 * Fuente única de verdad. Los HEX son idénticos a los de
 * BELT_PRESETS en PerfilConfiguracion.tsx.
 *
 * Uso:
 *   import { getBeltHex } from '../../utils/beltColors';
 *   const hex = getBeltHex('Blanca Avanzada'); // '#f8f8f8'
 */

export const BELT_PRESETS: { name: string; hex: string }[] = [
  // ── Claros ───────────────────────────────────────────
  { name: 'Blanca',        hex: '#f8f8f8' },
  { name: 'Crema',         hex: '#fffde7' },
  { name: 'Marfil',        hex: '#fffff0' },
  // ── Amarillos / Dorados ──────────────────────────────
  { name: 'Amarilla',      hex: '#facc15' },
  { name: 'Dorada',        hex: '#d97706' },
  { name: 'Naranja',       hex: '#f97316' },
  // ── Verdes ───────────────────────────────────────────
  { name: 'Verde',         hex: '#16a34a' },
  { name: 'Verde Claro',   hex: '#4ade80' },
  { name: 'Verde Oscuro',  hex: '#14532d' },
  // ── Azules ───────────────────────────────────────────
  { name: 'Celeste',       hex: '#38bdf8' },
  { name: 'Azul',          hex: '#2563eb' },
  { name: 'Azul Marino',   hex: '#1e40af' },
  { name: 'Cian',          hex: '#06b6d4' },
  // ── Rojos / Guindas ──────────────────────────────────
  { name: 'Coral',         hex: '#ff6b6b' },
  { name: 'Roja',          hex: '#dc2626' },
  { name: 'Guinda',        hex: '#881337' },
  { name: 'Granate',       hex: '#991b1b' },
  // ── Morados / Rosas ──────────────────────────────────
  { name: 'Lila',          hex: '#c084fc' },
  { name: 'Morada',        hex: '#7c3aed' },
  { name: 'Purpura',       hex: '#9333ea' },
  { name: 'Rosa',          hex: '#ec4899' },
  { name: 'Fucsia',        hex: '#db2777' },
  // ── Cafés ────────────────────────────────────────────
  { name: 'Cafe Claro',    hex: '#a16207' },
  { name: 'Cafe',          hex: '#7c2d12' },
  { name: 'Vino',          hex: '#7f1d1d' },
  // ── Neutros ──────────────────────────────────────────
  { name: 'Gris',          hex: '#6b7280' },
  { name: 'Plateada',      hex: '#d1d5db' },
  { name: 'Negra',         hex: '#111111' },
];

/** Normaliza un string: minúsculas + sin acentos */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Convierte el nombre de color guardado en la BD a su HEX.
 *
 * Estrategia:
 * 1. Coincidencia exacta (ignorando mayúsculas y acentos)
 * 2. Coincidencia por primera palabra  → "Blanca Avanzada" → "Blanca"
 * 3. Fallback: #94a3b8
 */
export function getBeltHex(colorName: string | null | undefined): string {
  if (!colorName) return '#94a3b8';

  const input = normalize(colorName);

  // 1. Exact match
  const exact = BELT_PRESETS.find(p => normalize(p.name) === input);
  if (exact) return exact.hex;

  // 2. First-word match (cubre "Blanca Avanzada", "Roja Avanzada", etc.)
  const firstWord = input.split(' ')[0];
  const partial = BELT_PRESETS.find(p => normalize(p.name) === firstWord);
  if (partial) return partial.hex;

  return '#94a3b8';
}