import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Save,
  MapPin,
  Mail,
  School,
  Loader2,
  Palette,
  Check,
  PhoneCall,
  Globe,
  Sparkles,
  Sun,
  Moon,
  Award,
  Plus,
  Pencil,
  Trash2,
  X,
  GripVertical,
  AlertTriangle,
  CheckCircle2,
  Download,
} from 'lucide-react';

// Servicios y Tipos
import { escuelaService } from '../../services/escuela.service';
import { cintasService } from '../../services/cintas.service';
import type { Cinta as CintaType } from '../../services/cintas.service';
import { useAuth } from '../../context/AuthContext';
import type { Escuela, ThemeName } from '../../types/escuela.types';
import { LISTA_TEMAS, TEMAS_CLAROS, TEMAS_OSCUROS } from '../../constants/themes';

interface Props {
  initialEscuela?: Escuela;
}

/**
 * COMPONENTE: ThemeBackground
 * Genera el ambiente visual dinámico basado en el tema activo.
 */
const ThemeBackground = ({ theme }: { theme: string }) => {
  const themeObj = LISTA_TEMAS.find(t => t.id === theme) ?? LISTA_TEMAS[0];
  const particles = Array.from({ length: 15 });

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[var(--color-background)] transition-colors duration-1000">
      <AnimatePresence mode="wait">
        <motion.div key={theme} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
          {particles.map((_, i) => (
            <motion.div
              key={i}
              className="absolute flex items-center justify-center opacity-10"
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, color: themeObj.color }}
              animate={{
                y: [0, -200, 0],
                opacity: [0.1, 0.4, 0.1],
                scale: [1, 1.4, 1],
              }}
              transition={{
                duration: 10 + Math.random() * 10,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            >
              <span style={{ fontSize: 18 + Math.random() * 20 }}>{themeObj.icon}</span>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────
//  SUBCOMPONENTE: Tarjeta de tema individual
// ─────────────────────────────────────────
const ThemeCard = ({
  tema,
  selected,
  onClick,
}: {
  tema: typeof LISTA_TEMAS[0];
  selected: boolean;
  onClick: () => void;
}) => (
  <motion.button
    type="button"
    onClick={onClick}
    whileTap={{ scale: 0.92 }}
    className={`relative flex flex-col items-center justify-center gap-1.5 p-2 rounded-2xl border-2 transition-all ${
      selected
        ? 'border-[var(--color-text)] shadow-lg ring-4 ring-[var(--color-primary)]/20 scale-105'
        : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
    }`}
    style={{ backgroundColor: `${tema.color}22` }}
  >
    {/* Círculo de color */}
    <div
      className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md relative overflow-hidden"
      style={{ backgroundColor: tema.color }}
    >
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/20"
          >
            <Check size={14} className="text-white" strokeWidth={3.5} />
          </motion.div>
        )}
      </AnimatePresence>
      {!selected && (
        <span style={{ fontSize: 13, lineHeight: 1 }}>{tema.icon}</span>
      )}
    </div>

    {/* Label */}
    <span
      className={`text-[7px] font-black uppercase tracking-wide leading-none text-center truncate w-full ${
        selected ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'
      }`}
    >
      {tema.label}
    </span>
  </motion.button>
);

// ─────────────────────────────────────────
//  SUBCOMPONENTE: Grupo de temas con título
// ─────────────────────────────────────────
const ThemeGroup = ({
  title,
  icon: Icon,
  temas,
  selectedId,
  onSelect,
}: {
  title: string;
  icon: React.ElementType;
  temas: typeof LISTA_TEMAS;
  selectedId: string;
  onSelect: (id: string) => void;
}) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <Icon size={12} className="text-[var(--color-primary)]" />
      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] opacity-60">
        {title}
      </span>
      <div className="flex-1 h-px bg-[var(--color-border)]/30" />
      <span className="text-[7px] font-black text-[var(--color-text-muted)] opacity-40">
        {temas.length}
      </span>
    </div>
    <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
      {temas.map(t => (
        <ThemeCard
          key={t.id}
          tema={t}
          selected={selectedId === t.id}
          onClick={() => onSelect(t.id)}
        />
      ))}
    </div>
  </div>
);


// ─────────────────────────────────────────────────────────────
//  TIPOS y helpers para cintas
// ─────────────────────────────────────────────────────────────
// Cinta type imported from cintas.service
type Cinta = CintaType;
interface CintaForm { nivelkupdan: string; color: string; color_stripe: string; significado: string; orden: string }
const EMPTY_CINTA_FORM: CintaForm = { nivelkupdan: '', color: '', color_stripe: '', significado: '', orden: '' };

const COLOR_MAP: Record<string, string> = {
  blanca:'#f8f8f8', crema:'#fffde7', marfil:'#fffff0', perla:'#f5f5f0',
  amarilla:'#facc15', amarillo:'#facc15', dorada:'#d97706', dorado:'#d97706', oro:'#f59e0b',
  naranja:'#f97316', anaranjada:'#f97316', salmon:'#ff7f7f', coral:'#ff6b6b',
  roja:'#dc2626', rojo:'#dc2626', vino:'#7f1d1d', granate:'#991b1b', carmesi:'#be123c', guinda:'#881337',
  cafe:'#7c2d12', cafe_claro:'#a16207', marron:'#78350f', cafe_oscuro:'#431407',
  verde:'#16a34a', verde_claro:'#4ade80', verde_oscuro:'#14532d', oliva:'#65a30d', esmeralda:'#059669',
  azul:'#2563eb', azul_claro:'#60a5fa', azul_oscuro:'#1e3a8a', azul_marino:'#1e40af', celeste:'#38bdf8', cian:'#06b6d4',
  morada:'#7c3aed', morado:'#7c3aed', purpura:'#9333ea', violeta:'#8b5cf6', lila:'#c084fc', lavanda:'#a78bfa',
  rosa:'#ec4899', rosa_claro:'#f9a8d4', fucsia:'#db2777', magenta:'#d946ef',
  negra:'#111111', negro:'#111111', negro_azulado:'#0f172a',
  gris:'#6b7280', gris_claro:'#d1d5db', gris_oscuro:'#374151', plata:'#c0c0c0', plateada:'#d1d5db', plateado:'#d1d5db',
  cafe_con_franja:'#7c2d12',
};
function getCintaColor(c: string) {
  if (!c) return 'transparent';
  const k = c.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // remove accents
    .replace(/\s+/g, '_')   // spaces → underscore
    .replace(/[^a-z_]/g, ''); // remove non-alpha
  return COLOR_MAP[k] ?? COLOR_MAP[k.replace(/_.*/, '')] ?? '#888888';
}

// Componente visual de cinta (rectángulo con franja opcional)
const CintaBelt = ({ color, stripe, width = 'full', height = 6 }: { color: string; stripe?: string | null; width?: string; height?: number }) => {
  // Try to get hex from BELT_PRESETS first (most accurate), fallback to COLOR_MAP
  const resolveColor = (c: string) => {
    if (!c) return 'transparent';
    const preset = BELT_PRESETS.find(p => p.name.toLowerCase() === c.toLowerCase());
    return preset ? preset.hex : getCintaColor(c);
  };
  const bg = resolveColor(color);
  const stripeBg = stripe ? resolveColor(stripe) : null;
  return (
    <div
      className={`relative w-${width} rounded-sm overflow-hidden border border-white/10 shadow-inner`}
      style={{ height: `${height * 4}px`, background: bg }}
    >
      {stripeBg && (
        <div
          className="absolute right-3 top-0 bottom-0"
          style={{ width: '10%', background: stripeBg }}
        />
      )}
    </div>
  );
};



// fetch helpers removed — using cintasService



// Lista predefinida de niveles Kup/Dan
const KUP_DAN_NIVELES = [
  // Kups (principiante → avanzado, orden descendente tradicional)
  { value: '10° Kup', label: '10° Kup', grupo: 'Kup' },
  { value: '9° Kup',  label: '9° Kup',  grupo: 'Kup' },
  { value: '8° Kup',  label: '8° Kup',  grupo: 'Kup' },
  { value: '7° Kup',  label: '7° Kup',  grupo: 'Kup' },
  { value: '6° Kup',  label: '6° Kup',  grupo: 'Kup' },
  { value: '5° Kup',  label: '5° Kup',  grupo: 'Kup' },
  { value: '4° Kup',  label: '4° Kup',  grupo: 'Kup' },
  { value: '3° Kup',  label: '3° Kup',  grupo: 'Kup' },
  { value: '2° Kup',  label: '2° Kup',  grupo: 'Kup' },
  { value: '1° Kup',  label: '1° Kup',  grupo: 'Kup' },
  // Dans
  { value: '1° Dan',  label: '1° Dan — Cho Dan', grupo: 'Dan' },
  { value: '2° Dan',  label: '2° Dan — Yi Dan',  grupo: 'Dan' },
  { value: '3° Dan',  label: '3° Dan — Sam Dan', grupo: 'Dan' },
  { value: '4° Dan',  label: '4° Dan — Sa Dan',  grupo: 'Dan' },
  { value: '5° Dan',  label: '5° Dan — Oh Dan',  grupo: 'Dan' },
  { value: '6° Dan',  label: '6° Dan — Yuk Dan', grupo: 'Dan' },
  { value: '7° Dan',  label: '7° Dan — Chil Dan',grupo: 'Dan' },
  { value: '8° Dan',  label: '8° Dan — Pal Dan', grupo: 'Dan' },
  { value: '9° Dan',  label: '9° Dan — Ku Dan',  grupo: 'Dan' },
];


// Selector de nivel Kup/Dan
const NivelSelector: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const kups = KUP_DAN_NIVELES.filter(n => n.grupo === 'Kup');
  const dans = KUP_DAN_NIVELES.filter(n => n.grupo === 'Dan');

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
        Nivel / Grado *
      </span>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all
          ${open ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)]'}
          bg-[var(--color-background)]/60`}
      >
        <span className={`text-sm font-bold ${value ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}>
          {value || 'Seleccionar nivel...'}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="p-3 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-2xl"
          >
            {/* Kups */}
            <p className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-muted)] opacity-50 mb-2 px-1">
              Kup (Cinturón de Color)
            </p>
            <div className="grid grid-cols-5 gap-1.5 mb-3">
              {kups.map(n => (
                <button key={n.value} type="button"
                  onClick={() => { onChange(n.value); setOpen(false); }}
                  className={`py-2 px-1 rounded-xl text-[10px] font-black transition-all text-center
                    ${value === n.value
                      ? 'bg-[var(--color-primary)] text-white scale-105'
                      : 'bg-[var(--color-background)]/60 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:scale-105'}`}
                >
                  {n.value}
                </button>
              ))}
            </div>
            {/* Dans */}
            <p className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-muted)] opacity-50 mb-2 px-1">
              Dan (Cinturón Negro)
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              {dans.map(n => (
                <button key={n.value} type="button"
                  onClick={() => { onChange(n.value); setOpen(false); }}
                  className={`py-2 px-1 rounded-xl text-[10px] font-black transition-all text-center
                    ${value === n.value
                      ? 'bg-[var(--color-primary)] text-white scale-105'
                      : 'bg-[var(--color-background)]/60 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:scale-105'}`}
                >
                  {n.value}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  SUBCOMPONENTE: ColorPickerCinta
//  Panel de colores predefinidos + picker libre para cintas
// ─────────────────────────────────────────────────────────────
const BELT_PRESETS = [
  // Claros
  { label: 'Blanca',      hex: '#f8f8f8', name: 'Blanca'      },
  { label: 'Crema',       hex: '#fffde7', name: 'Crema'        },
  { label: 'Marfil',      hex: '#fffff0', name: 'Marfil'       },
  // Amarillos/Dorados
  { label: 'Amarilla',    hex: '#facc15', name: 'Amarilla'     },
  { label: 'Dorada',      hex: '#d97706', name: 'Dorada'       },
  { label: 'Naranja',     hex: '#f97316', name: 'Naranja'      },
  // Verdes
  { label: 'Verde',       hex: '#16a34a', name: 'Verde'        },
  { label: 'V. Claro',    hex: '#4ade80', name: 'Verde Claro'  },
  { label: 'V. Oscuro',   hex: '#14532d', name: 'Verde Oscuro' },
  // Azules
  { label: 'Celeste',     hex: '#38bdf8', name: 'Celeste'      },
  { label: 'Azul',        hex: '#2563eb', name: 'Azul'         },
  { label: 'A. Marino',   hex: '#1e40af', name: 'Azul Marino'  },
  { label: 'Cian',        hex: '#06b6d4', name: 'Cian'         },
  // Rojos/Guindas
  { label: 'Coral',       hex: '#ff6b6b', name: 'Coral'        },
  { label: 'Roja',        hex: '#dc2626', name: 'Roja'         },
  { label: 'Guinda',      hex: '#881337', name: 'Guinda'       },
  { label: 'Granate',     hex: '#991b1b', name: 'Granate'      },
  // Morados/Rosas
  { label: 'Lila',        hex: '#c084fc', name: 'Lila'         },
  { label: 'Morada',      hex: '#7c3aed', name: 'Morada'       },
  { label: 'Púrpura',     hex: '#9333ea', name: 'Purpura'      },
  { label: 'Rosa',        hex: '#ec4899', name: 'Rosa'         },
  { label: 'Fucsia',      hex: '#db2777', name: 'Fucsia'       },
  // Cafés
  { label: 'Café Cl.',    hex: '#a16207', name: 'Cafe Claro'   },
  { label: 'Café',        hex: '#7c2d12', name: 'Cafe'         },
  { label: 'Vino',        hex: '#7f1d1d', name: 'Vino'         },
  // Neutros
  { label: 'Gris',        hex: '#6b7280', name: 'Gris'         },
  { label: 'Plateada',    hex: '#d1d5db', name: 'Plateada'     },
  { label: 'Negra',       hex: '#111111', name: 'Negra'        },
  { label: 'Ninguna',     hex: '',        name: ''             },
];

interface ColorPickerCintaProps {
  label: string;
  value: string;        // nombre del color ej: "Amarilla"
  onChange: (name: string, hex: string) => void;
  optional?: boolean;
}

const ColorPickerCinta: React.FC<ColorPickerCintaProps> = ({ label, value, onChange, optional }) => {
  const [open, setOpen] = useState(false);
  const current = BELT_PRESETS.find(p => p.name.toLowerCase() === value.toLowerCase()) ?? null;
  const currentHex = current?.hex ?? (value ? '#888' : '');

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
        {label}{optional && <span className="ml-1 opacity-40">(opcional)</span>}
      </span>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all
          ${open ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)]'}
          bg-[var(--color-background)]/60`}
      >
        {/* Preview rectángulo */}
        <div
          className="w-10 h-5 rounded-sm border border-white/10 shadow-inner shrink-0"
          style={{ background: currentHex || 'transparent', borderStyle: currentHex ? 'solid' : 'dashed' }}
        />
        <span className="text-xs font-bold text-[var(--color-text)] flex-1 text-left">
          {value || <span className="text-[var(--color-text-muted)] font-normal">Sin color</span>}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </motion.div>
      </button>

      {/* Panel de colores */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="p-3 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-2xl"
          >
            <div className="grid grid-cols-7 gap-2 max-h-48 overflow-y-auto">
              {BELT_PRESETS.map(p => {
                const isSelected = p.name.toLowerCase() === value.toLowerCase();
                const isEmpty = p.name === '';
                return (
                  <button
                    key={p.name || 'none'}
                    type="button"
                    onClick={() => { onChange(p.name, p.hex); setOpen(false); }}
                    className={`relative flex flex-col items-center gap-1 p-1 rounded-xl transition-all
                      ${isSelected ? 'ring-2 ring-[var(--color-primary)] scale-110' : 'hover:scale-110'}`}
                  >
                    <div
                      className="w-7 h-7 rounded-lg border border-white/20 shadow-inner"
                      style={{
                        background: isEmpty ? 'transparent' : p.hex,
                        borderStyle: isEmpty ? 'dashed' : 'solid',
                        borderColor: isEmpty ? 'var(--color-border)' : undefined,
                      }}
                    >
                      {isSelected && !isEmpty && (
                        <div className="w-full h-full rounded-lg flex items-center justify-center bg-black/20">
                          <CheckCircle2 size={12} className="text-white drop-shadow" />
                        </div>
                      )}
                      {isEmpty && (
                        <div className="w-full h-full flex items-center justify-center">
                          <X size={10} className="text-[var(--color-text-muted)] opacity-40" />
                        </div>
                      )}
                    </div>
                    <span className="text-[7px] font-bold text-[var(--color-text-muted)] leading-none truncate w-full text-center">
                      {isEmpty ? 'Nada' : p.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  SUBCOMPONENTE: CintasBlock (embebido en PerfilConfiguracion)
// ─────────────────────────────────────────────────────────────
const CintasBlock: React.FC = () => {
  const [cintas, setCintas]           = useState<Cinta[]>([]);
  const [loadingC, setLoadingC]       = useState(true);
  const [savingC, setSavingC]         = useState(false);
  const [modalC, setModalC]           = useState(false);
  const [editingC, setEditingC]       = useState<Cinta | null>(null);
  const [formC, setFormC]             = useState<CintaForm>(EMPTY_CINTA_FORM);
  const [deleteC, setDeleteC]         = useState<Cinta | null>(null);
  const [importingC, setImportingC]   = useState(false);
  const [cintaToast, setCintaToast]   = useState<{msg:string;ok:boolean}|null>(null);

  const showToast = (msg: string, ok = true) => {
    setCintaToast({ msg, ok });
    setTimeout(() => setCintaToast(null), 3000);
  };

  const cargarCintas = useCallback(async () => {
    setLoadingC(true);
    try {
      const data = await cintasService.listarMiEscuela();
      setCintas(data);
    } catch(e: any) { showToast(e?.response?.data?.detail ?? e.message ?? 'Error al cargar', false); }
    finally { setLoadingC(false); }
  }, []);

  useEffect(() => { cargarCintas(); }, [cargarCintas]);

  const openCreateC = () => {
    setEditingC(null);
    setFormC({ ...EMPTY_CINTA_FORM, orden: String(cintas.length + 1) });
    setModalC(true);
  };
  const openEditC = (c: Cinta) => {
    setEditingC(c);
    setFormC({ nivelkupdan: c.nivelkupdan, color: c.color, color_stripe: c.color_stripe ?? '', significado: c.significado ?? '', orden: String(c.orden ?? '') });
    setModalC(true);
  };

  const handleSaveC = async () => {
    if (!formC.nivelkupdan || !formC.color.trim()) { showToast('Selecciona el nivel y el color', false); return; }
    setSavingC(true);
    try {
      const payload = { nivelkupdan: formC.nivelkupdan.trim(), color: formC.color.trim(), color_stripe: formC.color_stripe.trim() || null, significado: formC.significado.trim() || null, orden: formC.orden ? parseInt(formC.orden) : null };
      if (editingC) {
        await cintasService.actualizar(editingC.idgrado, payload);
        showToast('Cinta actualizada');
      } else {
        await cintasService.crear(payload);
        showToast('Cinta creada');
      }
      setModalC(false);
      cargarCintas();
    } catch(e: any) { showToast(e?.response?.data?.detail ?? e.message ?? 'Error', false); }
    finally { setSavingC(false); }
  };

  const handleDeleteC = async () => {
    if (!deleteC) return;
    setSavingC(true);
    try {
      await cintasService.eliminar(deleteC.idgrado);
      showToast('Cinta eliminada');
      setDeleteC(null);
      cargarCintas();
    } catch(e: any) { showToast(e?.response?.data?.detail ?? e.message ?? 'Error', false); }
    finally { setSavingC(false); }
  };

  const handleImportarC = async () => {
    setImportingC(true);
    try {
      const r = await cintasService.importarGlobal();
      showToast(r.mensaje);
      cargarCintas();
    } catch(e: any) { showToast(e?.response?.data?.detail ?? e.message ?? 'Error al importar', false); }
    finally { setImportingC(false); }
  };

  const esGlobal = cintas.length > 0 && cintas[0].idescuela === null;

  return (
    <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-xl relative">
      {/* Toast local */}
      <AnimatePresence>
        {cintaToast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className={`absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold shadow-lg
              ${cintaToast.ok ? 'bg-[var(--color-primary)]/90 text-white' : 'bg-red-500/90 text-white'}`}
          >
            {cintaToast.ok ? <CheckCircle2 size={13}/> : <AlertTriangle size={13}/>}
            {cintaToast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-2 border-b border-[var(--color-border)]/30">
        <div className="flex items-center gap-2">
          <Award size={16} className="text-[var(--color-primary)]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Cintas & Grados</span>
          <span className="text-[9px] text-[var(--color-text-muted)] opacity-50">({cintas.length})</span>
        </div>
        <div className="flex gap-2">
          {(cintas.length === 0 || esGlobal) && (
            <button onClick={handleImportarC} disabled={importingC}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-[var(--color-background)]/60 border border-[var(--color-border)] text-[9px] font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors disabled:opacity-40">
              {importingC ? <Loader2 size={11} className="animate-spin"/> : <Download size={11}/>}
              Importar
            </button>
          )}
          <button onClick={openCreateC}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-[var(--color-primary)] text-white text-[9px] font-bold">
            <Plus size={11}/> Nueva
          </button>
        </div>
      </div>

      {/* Banner global */}
      {esGlobal && (
        <div className="mb-3 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-1.5 text-amber-400 text-[9px] font-medium">
          <AlertTriangle size={11}/> Catálogo global. Importa o crea cintas propias para personalizar.
        </div>
      )}

      {/* Lista */}
      {loadingC ? (
        <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-[var(--color-primary)]"/></div>
      ) : cintas.length === 0 ? (
        <p className="text-center text-[var(--color-text-muted)] text-xs py-6 opacity-50">Sin cintas. Crea la primera o importa el catálogo.</p>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
          {cintas.map((c, i) => (
            <motion.div key={c.idgrado} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.03 }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-[var(--color-background)]/50 group">
              <GripVertical size={12} className="text-[var(--color-text-muted)] opacity-20 shrink-0"/>
              <div className="w-20 shrink-0"><CintaBelt color={c.color} stripe={c.color_stripe} height={5}/></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[var(--color-text)] truncate">
                  {c.nivelkupdan} <span className="font-normal text-[var(--color-text-muted)]">· {c.color}</span>
                </p>
                {c.significado && <p className="text-[9px] text-[var(--color-text-muted)] truncate opacity-60">{c.significado}</p>}
              </div>
              {c.orden != null && <span className="text-[9px] font-black text-[var(--color-text-muted)] opacity-30 shrink-0">#{c.orden}</span>}
              {!esGlobal && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => openEditC(c)} className="w-6 h-6 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]"><Pencil size={10}/></button>
                  <button onClick={() => setDeleteC(c)} className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400"><Trash2 size={10}/></button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal crear/editar — portal escapa stacking context */}
      {createPortal(
      <AnimatePresence>
        {modalC && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setModalC(false)}>
            <motion.div initial={{opacity:0,scale:0.93}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.93}}
              transition={{type:'spring',bounce:0.2,duration:0.3}}
              className="bg-[var(--color-card)] rounded-3xl border border-[var(--color-border)] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-black text-[var(--color-text)]">{editingC ? 'Editar cinta' : 'Nueva cinta'}</h2>
                <button onClick={() => setModalC(false)} className="w-7 h-7 rounded-xl bg-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)]"><X size={14}/></button>
              </div>
              {/* Preview */}
              <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl bg-[var(--color-background)]/60">
                <div className="w-28"><CintaBelt color={formC.color} stripe={formC.color_stripe} height={7}/></div>
                <div>
                  <p className="text-sm font-bold text-[var(--color-text)]">{formC.nivelkupdan || 'Nivel...'}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{formC.color || 'Color...'}</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <NivelSelector
                  value={formC.nivelkupdan}
                  onChange={(v) => {
                    const nivel = KUP_DAN_NIVELES.find(n => n.value === v);
                    const num = parseInt(v);
                    const autoOrden = nivel ? (nivel.grupo === 'Kup' ? String(num) : String(10 + num)) : '';
                    setFormC(f => ({...f, nivelkupdan: v, orden: autoOrden}));
                  }}
                />
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <ColorPickerCinta
                      label="Color base"
                      value={formC.color}
                      onChange={(name) => setFormC(f => ({...f, color: name}))}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 w-16">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Orden</span>
                    <input type="number" value={formC.orden} onChange={e => setFormC(f => ({...f, orden: e.target.value}))}
                      placeholder="#" className="w-full px-2 py-2.5 rounded-xl bg-[var(--color-background)]/60 border border-[var(--color-border)] text-[var(--color-text)] text-sm outline-none focus:border-[var(--color-primary)] transition-colors text-center"/>
                  </div>
                </div>
                <ColorPickerCinta
                  label="Franja / Stripe"
                  value={formC.color_stripe}
                  onChange={(name) => setFormC(f => ({...f, color_stripe: name}))}
                  optional
                />
                <textarea value={formC.significado} onChange={e => setFormC(f => ({...f, significado: e.target.value}))}
                  placeholder="Significado (opcional)" rows={2}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-background)]/60 border border-[var(--color-border)] text-[var(--color-text)] text-sm outline-none focus:border-[var(--color-primary)] transition-colors resize-none"/>
              </div>
              <motion.button whileTap={{scale:0.97}} onClick={handleSaveC} disabled={savingC}
                className="mt-4 w-full py-3 rounded-2xl bg-[var(--color-primary)] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {savingC ? <Loader2 size={16} className="animate-spin"/> : <Award size={16}/>}
                {editingC ? 'Guardar cambios' : 'Crear cinta'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      , document.body)}

      {/* Modal eliminar — portal */}
      {createPortal(
      <AnimatePresence>
        {deleteC && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setDeleteC(null)}>
            <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.9}}
              className="bg-[var(--color-card)] rounded-3xl border border-[var(--color-border)] p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center"><Trash2 size={16} className="text-red-400"/></div>
                <h2 className="font-black text-sm text-[var(--color-text)]">Eliminar cinta</h2>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mb-5">
                ¿Eliminar <strong className="text-[var(--color-text)]">{deleteC.nivelkupdan}</strong>? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteC(null)} className="flex-1 py-2.5 rounded-xl border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-muted)]">Cancelar</button>
                <button onClick={handleDeleteC} disabled={savingC} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">
                  {savingC ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>} Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      , document.body)}
    </div>
  );
};

// ─────────────────────────────────────────
//  COMPONENTE PRINCIPAL
// ─────────────────────────────────────────
export const PerfilConfiguracion: React.FC<Props> = ({ initialEscuela }) => {
  const { setTheme } = useAuth();

  const [formData, setFormData] = useState<Partial<Escuela>>(initialEscuela || {
    nombreescuela: '',
    lema: '',
    direccion: '',
    correo_escuela: '',
    telefono_oficina: '',
    color_paleta: 'blue-ocean'
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleThemeSelect = (id: string) => {
    setFormData(p => ({ ...p, color_paleta: id }));
    setTheme(id as ThemeName);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await escuelaService.updatePerfil(formData);
      setTheme(formData.color_paleta as ThemeName);

      // Fade out suave → reload sin que se note el corte
      setFadingOut(true);
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err) {
      console.error("Error al guardar perfil:", err);
      setSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await escuelaService.uploadLogo(file);
      setFormData(prev => ({ ...prev, logo_url: res.logo_url }));
    } catch (err) {
      console.error("Error subiendo logo:", err);
    } finally {
      setUploading(false);
    }
  };

  const temaActivo = LISTA_TEMAS.find(t => t.id === formData.color_paleta);

  return (
    <motion.div
      className="space-y-8 pb-44"
      animate={{ opacity: fadingOut ? 0 : 1, scale: fadingOut ? 0.98 : 1 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <ThemeBackground theme={formData.color_paleta || 'blue-ocean'} />

      {/* SECCIÓN: CABECERA */}
      <div className="flex flex-col items-center">
        <div className="relative group">
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="w-32 h-32 rounded-[2.5rem] bg-[var(--color-card)] shadow-2xl border-4 border-[var(--color-background)] overflow-hidden flex items-center justify-center transition-all"
          >
            {uploading ? (
              <Loader2 className="animate-spin text-[var(--color-primary)]" size={40} />
            ) : formData.logo_url ? (
              <img src={formData.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <School size={60} className="text-[var(--color-text-muted)] opacity-20" />
            )}
          </motion.div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 bg-[var(--color-primary)] text-white p-3 rounded-2xl shadow-xl border-4 border-[var(--color-background)] active:scale-90 transition-all hover:brightness-110 disabled:opacity-50"
          >
            <Camera size={20} />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>

        <div className="text-center mt-6">
          <h2 className="text-xl font-black italic uppercase tracking-tighter text-[var(--color-text)] leading-tight">
            {formData.nombreescuela || 'Institución'}
          </h2>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--color-text-muted)] mt-1 opacity-60">
            {formData.lema || 'Disciplina ante todo'}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* BLOQUE: IDENTIDAD */}
        <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-xl">
          <div className="flex items-center gap-2 mb-5 pb-2 border-b border-[var(--color-border)]/30">
            <Sparkles size={16} className="text-[var(--color-primary)]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Identidad Maestra</span>
          </div>
          <div className="space-y-4">
            <input
              name="nombreescuela"
              value={formData.nombreescuela || ''}
              onChange={handleChange}
              placeholder="Nombre Institucional"
              className="w-full h-12 px-5 rounded-2xl bg-[var(--color-background)]/50 border border-transparent focus:border-[var(--color-primary)] outline-none font-bold text-sm text-[var(--color-text)] transition-all"
            />
            <input
              name="lema"
              value={formData.lema || ''}
              onChange={handleChange}
              placeholder="Eslogan o Lema"
              className="w-full h-12 px-5 rounded-2xl bg-[var(--color-background)]/50 border border-transparent focus:border-[var(--color-primary)] outline-none font-bold italic text-sm text-[var(--color-text)] transition-all"
            />
          </div>
        </div>

        {/* BLOQUE: LOCALIZACIÓN */}
        <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-xl">
          <div className="flex items-center gap-2 mb-5 pb-2 border-b border-[var(--color-border)]/30">
            <Globe size={16} className="text-[var(--color-primary)]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Localización y Contacto</span>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <PhoneCall className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" size={16} />
              <input
                name="telefono_oficina"
                value={formData.telefono_oficina || ''}
                onChange={e => setFormData(p => ({ ...p, telefono_oficina: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                placeholder="Teléfono (10 dígitos)"
                className="w-full h-12 pl-11 pr-4 rounded-2xl bg-[var(--color-background)]/50 border border-transparent focus:border-[var(--color-primary)] outline-none font-bold text-sm text-[var(--color-text)] transition-all"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" size={18} />
              <input
                name="direccion"
                value={formData.direccion || ''}
                onChange={handleChange}
                placeholder="Dirección Física Completa"
                className="w-full h-12 pl-12 pr-5 rounded-2xl bg-[var(--color-background)]/50 border border-transparent focus:border-[var(--color-primary)] outline-none font-bold text-xs text-[var(--color-text)] transition-all"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" size={16} />
              <input
                name="correo_escuela"
                value={formData.correo_escuela || ''}
                onChange={handleChange}
                placeholder="E-mail Institucional"
                className="w-full h-12 pl-11 pr-4 rounded-2xl bg-[var(--color-background)]/50 border border-transparent focus:border-[var(--color-primary)] outline-none font-bold text-sm text-[var(--color-text)] transition-all"
              />
            </div>
          </div>
        </div>

        {/* BLOQUE: AMBIENTE VISUAL — Selector mejorado */}
        <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-xl">
          {/* Header con tema activo */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Palette size={16} className="text-[var(--color-primary)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                Ambiente Visual
              </span>
            </div>
            {/* Badge del tema seleccionado */}
            {temaActivo && (
              <motion.div
                key={temaActivo.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-border)]"
                style={{ backgroundColor: `${temaActivo.color}22` }}
              >
                <span style={{ fontSize: 12 }}>{temaActivo.icon}</span>
                <span
                  className="text-[8px] font-black uppercase tracking-wider"
                  style={{ color: temaActivo.color }}
                >
                  {temaActivo.label}
                </span>
              </motion.div>
            )}
          </div>

          {/* Scroll con dos secciones */}
          <div className="space-y-5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
            <ThemeGroup
              title="Temas Claros"
              icon={Sun}
              temas={TEMAS_CLAROS}
              selectedId={formData.color_paleta || 'blue-ocean'}
              onSelect={handleThemeSelect}
            />
            <ThemeGroup
              title="Temas Oscuros"
              icon={Moon}
              temas={TEMAS_OSCUROS}
              selectedId={formData.color_paleta || 'blue-ocean'}
              onSelect={handleThemeSelect}
            />
          </div>
        </div>


        {/* BLOQUE: CINTAS Y GRADOS */}
        <CintasBlock />

        {/* ACCIÓN PRINCIPAL */}
        <div className="pt-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={saving}
            className="w-full h-20 bg-[var(--color-text)] text-[var(--color-card)] font-black rounded-[2rem] shadow-2xl flex items-center justify-center gap-4 transition-all active:brightness-125 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={28} />
            ) : (
              <>
                <Save size={24} />
                <div className="flex flex-col items-start leading-none">
                  <span className="text-lg uppercase italic tracking-tighter">Sincronizar Dojo</span>
                  <span className="text-[8px] opacity-50 uppercase tracking-widest font-bold mt-1">Guardar cambios en Render</span>
                </div>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default PerfilConfiguracion;