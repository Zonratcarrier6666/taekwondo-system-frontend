// ============================================================
//  src/views/superadmin/TorneosView.tsx
//  Lista, creación (wizard 4 pasos + categorías) y detalle
//  v3 — UX mejorada: steppers, sliders, templates de categoría
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Plus, ChevronRight, Calendar, MapPin, Users,
  CheckCircle, AlertCircle, RotateCcw, X, Play,
  ChevronLeft, Search, Target, DollarSign,
  FileText, Zap, Shield, UserCheck, Check,
  Tag, Layers, ClipboardList, Minus, Sparkles,
  ChevronDown, ChevronUp, Copy, Loader2,
} from 'lucide-react';

import { torneoService }     from '../../services/torneo.service';
import { torneoAreasService } from '../../services/torneo_areas.service';
import type { Torneo, CrearTorneoDTO, CategoriaInput } from '../../types/torneo.types';
import api from '../../api/axios';

// ─────────────────────────────────────────────────────────────
//  TEMA
// ─────────────────────────────────────────────────────────────
type Tema = {
  bg: string; surface: string; card: string; cardHover: string;
  border: string; violet: string; violetLo: string; violetHi: string;
  cyan: string; cyanLo: string; green: string; greenLo: string;
  orange: string; orangeLo: string; red: string; redLo: string;
  yellow: string; yellowLo: string;
  text: string; textMid: string; textDim: string; navBg: string;
};

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
const ESTATUS_LABEL: Record<number, { label: string; color: string; icon: React.ElementType }> = {
  1: { label: 'Activo',     color: '#10b981', icon: CheckCircle },
  2: { label: 'En Curso',   color: '#f97316', icon: Play        },
  3: { label: 'Finalizado', color: '#94a3b8', icon: Trophy      },
};

function fmtFecha(iso: string) {
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return iso; }
}

const WIZARD_STEPS = [
  { label: 'Evento',     icon: FileText      },
  { label: 'Reglas',     icon: Shield        },
  { label: 'Categorías', icon: Tag           },
  { label: 'Confirmar',  icon: ClipboardList },
];

const defaultCategoria = (): CategoriaInput & { _id: number } => ({
  _id: Date.now() + Math.random(),
  nombre_categoria: '',
  edad_min: undefined,
  edad_max: undefined,
  peso_min: undefined,
  peso_max: undefined,
  genero: 'A',
  grados_permitidos: undefined,
});

// ─── Plantillas de categoría más comunes en TKD ──────────────
const CAT_TEMPLATES = [
  { emoji: '🐣', label: 'Mini (4–7)',   data: { nombre_categoria: 'Mini 4-7 años',  edad_min: 4,  edad_max: 7  } },
  { emoji: '🧒', label: 'Sub-8',        data: { nombre_categoria: 'Sub-8 años',     edad_min: 5,  edad_max: 8  } },
  { emoji: '👦', label: 'Sub-12',       data: { nombre_categoria: 'Sub-12 años',    edad_min: 9,  edad_max: 12 } },
  { emoji: '🧑', label: 'Sub-16',       data: { nombre_categoria: 'Sub-16 años',    edad_min: 13, edad_max: 16 } },
  { emoji: '🧑‍🦱', label: 'Sub-18',  data: { nombre_categoria: 'Sub-18 años',    edad_min: 17, edad_max: 18 } },
  { emoji: '🏋️', label: 'Adulto',      data: { nombre_categoria: 'Adulto 18+',     edad_min: 18, edad_max: 40 } },
  { emoji: '🥋', label: 'Abierta',      data: { nombre_categoria: 'Categoría Abierta' } },
];

// ─────────────────────────────────────────────────────────────
//  MINI COMPONENTES UX
// ─────────────────────────────────────────────────────────────

/** Stepper numérico con botones +/- */
const Stepper: React.FC<{
  value: number; min?: number; max?: number;
  onChange: (v: number) => void; T: Tema; label?: string;
}> = ({ value, min = 1, max = 99, onChange, T, label }) => (
  <div>
    {label && (
      <p style={{ fontSize: 9, fontWeight: 900, color: T.textDim, textTransform: 'uppercase',
        letterSpacing: '0.2em', marginBottom: 6 }}>{label}</p>
    )}
    <div className="flex items-center gap-0 rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${T.border}`, background: T.surface }}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
        className="w-10 h-10 flex items-center justify-center flex-shrink-0"
        style={{ background: 'transparent', border: 'none', cursor: value <= min ? 'not-allowed' : 'pointer',
          opacity: value <= min ? 0.35 : 1 }}>
        <Minus size={13} style={{ color: T.textMid }} />
      </button>
      <span className="flex-1 text-center font-black text-sm" style={{ color: T.text }}>{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))}
        className="w-10 h-10 flex items-center justify-center flex-shrink-0"
        style={{ background: 'transparent', border: 'none', cursor: value >= max ? 'not-allowed' : 'pointer',
          opacity: value >= max ? 0.35 : 1 }}>
        <Plus size={13} style={{ color: T.textMid }} />
      </button>
    </div>
  </div>
);

/** Selector tipo toggle pills */
const TogglePills: React.FC<{
  options: { value: string; label: string; emoji?: string }[];
  value: string; onChange: (v: string) => void; T: Tema; label?: string;
}> = ({ options, value, onChange, T, label }) => (
  <div>
    {label && (
      <p style={{ fontSize: 9, fontWeight: 900, color: T.textDim, textTransform: 'uppercase',
        letterSpacing: '0.2em', marginBottom: 6 }}>{label}</p>
    )}
    <div className="flex gap-2 flex-wrap">
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <motion.button key={opt.value} type="button" whileTap={{ scale: 0.95 }}
            onClick={() => onChange(opt.value)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-[11px] font-black"
            style={{
              background: active ? `${T.violet}22` : T.surface,
              border: `1.5px solid ${active ? T.violet : T.border}`,
              color: active ? T.violetHi : T.textDim,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
            {opt.emoji && <span>{opt.emoji}</span>}
            {opt.label}
            {active && <Check size={10} style={{ color: T.violetHi }} />}
          </motion.button>
        );
      })}
    </div>
  </div>
);

/** Range slider doble — visualización de rango */
const RangeDisplay: React.FC<{
  label: string; minVal: string; maxVal: string;
  onMin: (v: string) => void; onMax: (v: string) => void;
  placeholder?: [string, string]; unit?: string;
  T: Tema;
}> = ({ label, minVal, maxVal, onMin, onMax, placeholder = ['Mín', 'Máx'], unit, T }) => {
  const iStyle: React.CSSProperties = {
    background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
    padding: '9px 12px', color: T.text, fontSize: 13, width: '100%',
    outline: 'none', boxSizing: 'border-box', fontWeight: 700,
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p style={{ fontSize: 9, fontWeight: 900, color: T.textDim,
          textTransform: 'uppercase', letterSpacing: '0.2em' }}>{label}</p>
        {(minVal || maxVal) && (
          <span className="text-[9px] font-black px-2 py-0.5 rounded-lg"
            style={{ background: `${T.cyan}15`, color: T.cyan, border: `1px solid ${T.cyan}25` }}>
            {minVal || '?'} – {maxVal || '?'}{unit}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input type="number" style={iStyle} placeholder={placeholder[0]}
          value={minVal} onChange={e => onMin(e.target.value)} min="0" />
        <input type="number" style={iStyle} placeholder={placeholder[1]}
          value={maxVal} onChange={e => onMax(e.target.value)} min="0" />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  BADGE ESTATUS
// ─────────────────────────────────────────────────────────────
const EstatusBadge: React.FC<{ estatus: number; T: Tema }> = ({ estatus, T }) => {
  const info = ESTATUS_LABEL[estatus] ?? { label: 'Desconocido', color: T.textDim, icon: AlertCircle };
  const Icon = info.icon;
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
      style={{ background: `${info.color}18`, border: `1px solid ${info.color}30` }}>
      <Icon size={9} style={{ color: info.color }} />
      <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: info.color }}>
        {info.label}
      </span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  WIZARD STEP INDICATOR
// ─────────────────────────────────────────────────────────────
const WizardSteps: React.FC<{ current: number; T: Tema }> = ({ current, T }) => (
  <div className="flex items-center justify-between px-1 mb-6">
    {WIZARD_STEPS.map((step, i) => {
      const done   = i < current;
      const active = i === current;
      const Icon   = step.icon;
      const color  = done ? T.green : active ? T.violetHi : T.textDim;
      return (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center gap-1.5" style={{ minWidth: 52 }}>
            <motion.div animate={{ scale: active ? 1.1 : 1 }}
              className="w-9 h-9 rounded-[14px] flex items-center justify-center"
              style={{
                background: done ? `${T.green}20` : active ? `${T.violet}25` : T.surface,
                border: `1.5px solid ${done ? T.green + '40' : active ? T.violet + '60' : T.border}`,
                boxShadow: active ? `0 0 0 4px ${T.violet}18` : 'none',
              }}>
              {done ? <Check size={14} style={{ color: T.green }} /> : <Icon size={14} style={{ color }} />}
            </motion.div>
            <span className="text-[8px] font-black uppercase tracking-wider text-center leading-tight"
              style={{ color, maxWidth: 52 }}>{step.label}</span>
          </div>
          {i < WIZARD_STEPS.length - 1 && (
            <div className="flex-1 h-px mx-1 mb-4"
              style={{ background: i < current ? T.green : T.border, transition: 'background 0.3s' }} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ─────────────────────────────────────────────────────────────
//  STEP 1 — Datos básicos del evento
// ─────────────────────────────────────────────────────────────
const Step1: React.FC<{ data: any; set: (d: any) => void; T: Tema }> = ({ data, set, T }) => {
  const iStyle: React.CSSProperties = {
    background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14,
    padding: '10px 14px', color: T.text, fontSize: 13, width: '100%',
    outline: 'none', boxSizing: 'border-box', fontWeight: 600,
  };
  const f = (k: string) => (e: React.ChangeEvent<any>) => set({ ...data, [k]: e.target.value });

  return (
    <div className="space-y-4">
      {/* Nombre */}
      <div>
        <label style={{ display: 'block', marginBottom: 6, color: T.textDim, fontSize: 9,
          fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
          Nombre del torneo <span style={{ color: T.orange }}>*</span>
        </label>
        <input style={iStyle} placeholder="Ej: Torneo Regional Guanajuato 2026"
          value={data.nombre} onChange={f('nombre')} />
      </div>

      {/* Fecha + Hora */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label style={{ display: 'block', marginBottom: 6, color: T.textDim, fontSize: 9,
            fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
            Fecha <span style={{ color: T.orange }}>*</span>
          </label>
          <input type="date" style={iStyle} value={data.fecha} onChange={f('fecha')} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6, color: T.textDim, fontSize: 9,
            fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
            Hora inicio
          </label>
          <input type="time" style={iStyle} value={data.hora_inicio} onChange={f('hora_inicio')} />
        </div>
      </div>

      {/* Sede */}
      <div>
        <label style={{ display: 'block', marginBottom: 6, color: T.textDim, fontSize: 9,
          fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
          Sede / Gimnasio <span style={{ color: T.orange }}>*</span>
        </label>
        <input style={iStyle} placeholder="Ej: Gimnasio Municipal, Dojo Central..."
          value={data.sede} onChange={f('sede')} />
      </div>

      {/* Ciudad */}
      <div>
        <label style={{ display: 'block', marginBottom: 6, color: T.textDim, fontSize: 9,
          fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
          Ciudad
        </label>
        <input style={iStyle} placeholder="León, Gto."
          value={data.ciudad} onChange={f('ciudad')} />
      </div>

      {/* Tipo torneo — visual y descriptivo */}
      <div>
        <label style={{ display: 'block', marginBottom: 8, color: T.textDim, fontSize: 9,
          fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
          Modalidad del torneo
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              v: 'competencia', emoji: '🏆', title: 'Competencia',
              desc: 'Eliminación directa — solo avanza el ganador. Ideal para torneos formales.',
            },
            {
              v: 'local', emoji: '🏠', title: 'Local / Amistoso',
              desc: 'Todos pelean hasta N combates. Se asignan 1°/2°/3° manualmente.',
            },
          ].map(opt => {
            const active = data.tipo_torneo === opt.v;
            return (
              <motion.button key={opt.v} type="button" whileTap={{ scale: 0.97 }}
                onClick={() => set({ ...data, tipo_torneo: opt.v })}
                className="p-4 rounded-2xl text-left"
                style={{
                  background: active ? `${T.violet}18` : T.surface,
                  border: `2px solid ${active ? T.violet : T.border}`,
                  cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: active ? `0 0 0 3px ${T.violet}15` : 'none',
                }}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: 22 }}>{opt.emoji}</span>
                  {active && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: T.violet }}>
                      <Check size={10} color="#fff" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] font-black uppercase tracking-tight mb-1"
                  style={{ color: active ? T.violetHi : T.text }}>{opt.title}</p>
                <p className="text-[9px] font-bold leading-relaxed"
                  style={{ color: T.textDim }}>{opt.desc}</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Descripción opcional */}
      <div>
        <label style={{ display: 'block', marginBottom: 6, color: T.textDim, fontSize: 9,
          fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
          Descripción <span style={{ color: T.textDim, fontWeight: 400 }}>(opcional)</span>
        </label>
        <textarea style={{ ...iStyle, resize: 'none', height: 64 } as React.CSSProperties}
          placeholder="Detalles adicionales, convocatoria, reglas especiales..."
          value={data.descripcion} onChange={f('descripcion')} />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  STEP 2 — Reglas y configuración
// ─────────────────────────────────────────────────────────────
const Step2: React.FC<{ data: any; set: (d: any) => void; T: Tema }> = ({ data, set, T }) => {
  const iStyle: React.CSSProperties = {
    background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14,
    padding: '10px 14px', color: T.text, fontSize: 13, width: '100%',
    outline: 'none', boxSizing: 'border-box', fontWeight: 600,
  };

  const esLocal = data.tipo_torneo === 'local';

  return (
    <div className="space-y-5">

      {/* Costo y participantes */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label style={{ display: 'block', marginBottom: 6, color: T.textDim, fontSize: 9,
            fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
            Costo inscripción ($)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-sm"
              style={{ color: T.textDim }}>$</span>
            <input type="number" style={{ ...iStyle, paddingLeft: 22 }} placeholder="0.00"
              min="0" step="0.01" value={data.costo_inscripcion}
              onChange={e => set({ ...data, costo_inscripcion: e.target.value })} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6, color: T.textDim, fontSize: 9,
            fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
            Máx. participantes
          </label>
          <input type="number" style={iStyle} placeholder="Sin límite" min="0"
            value={data.max_participantes}
            onChange={e => set({ ...data, max_participantes: e.target.value })} />
        </div>
      </div>

      {/* Género */}
      <TogglePills
        label="Género permitido"
        options={[
          { value: 'A', label: 'Ambos',      emoji: '⚡' },
          { value: 'M', label: 'Masculino',  emoji: '♂️' },
          { value: 'F', label: 'Femenino',   emoji: '♀️' },
        ]}
        value={data.genero}
        onChange={v => set({ ...data, genero: v })}
        T={T}
      />

      {/* Rango de edad */}
      <RangeDisplay
        label="Rango de edad (años)"
        minVal={data.edad_minima} maxVal={data.edad_maxima}
        onMin={v => set({ ...data, edad_minima: v })}
        onMax={v => set({ ...data, edad_maxima: v })}
        placeholder={['Ej: 6', 'Ej: 18']}
        unit=" años"
        T={T}
      />

      {/* Rango de peso */}
      <RangeDisplay
        label="Rango de peso (kg)"
        minVal={data.peso_minimo} maxVal={data.peso_maximo}
        onMin={v => set({ ...data, peso_minimo: v })}
        onMax={v => set({ ...data, peso_maximo: v })}
        placeholder={['Ej: 20', 'Ej: 100']}
        unit=" kg"
        T={T}
      />

      {/* Rings y combates */}
      <div className="grid grid-cols-2 gap-4 pt-1">
        <Stepper
          label="Áreas / Rings"
          value={+data.num_areas || 1}
          min={1} max={20}
          onChange={v => set({ ...data, num_areas: v })}
          T={T}
        />
        <div>
          <Stepper
            label={`Combates por competidor${esLocal ? '' : ' (comp.)'}`}
            value={+data.max_combates_por_competidor || 3}
            min={1} max={10}
            onChange={v => set({ ...data, max_combates_por_competidor: v })}
            T={T}
          />
          {!esLocal && (
            <p style={{ fontSize: 9, color: T.textDim, marginTop: 4, fontStyle: 'italic' }}>
              Solo aplica en torneos locales
            </p>
          )}
        </div>
      </div>

      {/* Info contextual según tipo */}
      <div className="flex items-start gap-2 p-3 rounded-2xl"
        style={{ background: `${T.cyan}0d`, border: `1px solid ${T.cyan}20` }}>
        <span style={{ fontSize: 14 }}>{esLocal ? '🏠' : '🏆'}</span>
        <p className="text-[9px] font-bold leading-relaxed" style={{ color: T.textDim }}>
          {esLocal
            ? 'Torneo local: cada competidor pelea hasta ' + (data.max_combates_por_competidor || 3) + ' combates y se asignan lugares manualmente al final.'
            : 'Torneo de competencia: eliminación directa. El campo "Combates por competidor" no aplica en esta modalidad.'}
        </p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  STEP 3 — Categorías con templates
// ─────────────────────────────────────────────────────────────
const Step3: React.FC<{
  categorias: (CategoriaInput & { _id: number })[];
  setCategorias: (c: any[]) => void;
  T: Tema;
}> = ({ categorias, setCategorias, T }) => {
  const [expandido, setExpandido] = useState<number | null>(null);

  const iStyle: React.CSSProperties = {
    background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12,
    padding: '9px 12px', color: T.text, fontSize: 12, width: '100%',
    outline: 'none', boxSizing: 'border-box', fontWeight: 600,
  };

  const addDesdeTemplate = (tpl: typeof CAT_TEMPLATES[0]) => {
    const nueva = { ...defaultCategoria(), ...tpl.data };
    const newList = [...categorias, nueva];
    setCategorias(newList);
    setExpandido(nueva._id);
  };

  const addVacia = () => {
    const nueva = defaultCategoria();
    setCategorias([...categorias, nueva]);
    setExpandido(nueva._id);
  };

  const remove = (id: number) => {
    setCategorias(categorias.filter(c => c._id !== id));
    if (expandido === id) setExpandido(null);
  };

  const update = (id: number, k: string, v: any) =>
    setCategorias(categorias.map(c => c._id === id ? { ...c, [k]: v } : c));

  // Auto-generar nombre descriptivo
  const autoNombre = (cat: any) => {
    const partes: string[] = [];
    if (cat.edad_min && cat.edad_max) partes.push(`${cat.edad_min}–${cat.edad_max} años`);
    else if (cat.edad_max) partes.push(`Hasta ${cat.edad_max} años`);
    if (cat.peso_min && cat.peso_max) partes.push(`${cat.peso_min}–${cat.peso_max}kg`);
    const gen = cat.genero === 'M' ? 'Masc.' : cat.genero === 'F' ? 'Fem.' : '';
    if (gen) partes.push(gen);
    return partes.join(' · ') || '';
  };

  return (
    <div className="space-y-4">
      {/* Info */}
      <div className="flex items-start gap-2 p-3 rounded-2xl"
        style={{ background: `${T.violet}10`, border: `1px solid ${T.violet}20` }}>
        <Layers size={12} style={{ color: T.violetHi, flexShrink: 0, marginTop: 1 }} />
        <p className="text-[9px] font-bold leading-relaxed" style={{ color: T.textDim }}>
          Cada categoría tendrá su propio bracket. Puedes usar las plantillas rápidas o crear una desde cero.
        </p>
      </div>

      {/* Plantillas rápidas */}
      <div>
        <p className="text-[8px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5"
          style={{ color: T.textDim }}>
          <Sparkles size={9} style={{ color: T.yellow }} /> Plantillas rápidas
        </p>
        <div className="flex flex-wrap gap-2">
          {CAT_TEMPLATES.map(tpl => (
            <motion.button key={tpl.label} type="button" whileTap={{ scale: 0.93 }}
              onClick={() => addDesdeTemplate(tpl)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[10px] font-black"
              style={{
                background: T.surface, border: `1px solid ${T.border}`,
                color: T.textMid, cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = T.violet;
                (e.currentTarget as HTMLElement).style.color = T.violetHi;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = T.border;
                (e.currentTarget as HTMLElement).style.color = T.textMid;
              }}>
              <span>{tpl.emoji}</span> {tpl.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Lista de categorías */}
      {categorias.length === 0 ? (
        <div className="py-8 text-center rounded-2xl"
          style={{ border: `1.5px dashed ${T.border}` }}>
          <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: T.textDim }}>
            Sin categorías — usa las plantillas ↑ o crea una ↓
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {categorias.map((cat, idx) => {
            const open = expandido === cat._id;
            const preview = cat.nombre_categoria || autoNombre(cat) || `Categoría ${idx + 1}`;
            return (
              <motion.div key={cat._id} layout
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-[1.5rem] overflow-hidden"
                style={{ border: `1px solid ${open ? T.violet + '50' : T.border}`,
                  background: open ? `${T.violet}08` : T.surface }}>

                {/* Header colapsable */}
                <div className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                  onClick={() => setExpandido(open ? null : cat._id)}>
                  <div className="w-6 h-6 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${T.violet}25`, border: `1px solid ${T.violet}30` }}>
                    <span className="text-[9px] font-black" style={{ color: T.violetHi }}>{idx + 1}</span>
                  </div>
                  <span className="flex-1 text-[11px] font-black uppercase italic tracking-tighter truncate"
                    style={{ color: open ? T.violetHi : T.text }}>{preview}</span>
                  <div className="flex items-center gap-2">
                    {open ? (
                      <ChevronUp size={13} style={{ color: T.textDim }} />
                    ) : (
                      <ChevronDown size={13} style={{ color: T.textDim }} />
                    )}
                    <button type="button" onClick={e => { e.stopPropagation(); remove(cat._id); }}
                      className="w-6 h-6 rounded-xl flex items-center justify-center"
                      style={{ background: `${T.red}15`, border: `1px solid ${T.red}20`, cursor: 'pointer' }}>
                      <X size={10} style={{ color: T.red }} />
                    </button>
                  </div>
                </div>

                {/* Contenido expandible */}
                <AnimatePresence>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${T.border}` }}>
                        <div className="pt-3">
                          <label style={{ display: 'block', marginBottom: 5, color: T.textDim, fontSize: 9,
                            fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                            Nombre de la categoría <span style={{ color: T.orange }}>*</span>
                          </label>
                          <input style={iStyle} placeholder="Ej: Sub-12 Masculino 30-35kg"
                            value={cat.nombre_categoria}
                            onChange={e => update(cat._id, 'nombre_categoria', e.target.value)} />
                          {/* Sugerencia auto */}
                          {!cat.nombre_categoria && autoNombre(cat) && (
                            <motion.button type="button"
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                              onClick={() => update(cat._id, 'nombre_categoria', autoNombre(cat))}
                              className="mt-1 text-[9px] font-black"
                              style={{ color: T.cyan, cursor: 'pointer', background: 'none', border: 'none' }}>
                              ✨ Usar: "{autoNombre(cat)}"
                            </motion.button>
                          )}
                        </div>

                        {/* Edad + Peso en grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <RangeDisplay
                            label="Edad (años)"
                            minVal={cat.edad_min?.toString() ?? ''}
                            maxVal={cat.edad_max?.toString() ?? ''}
                            onMin={v => update(cat._id, 'edad_min', v ? +v : undefined)}
                            onMax={v => update(cat._id, 'edad_max', v ? +v : undefined)}
                            placeholder={['Min', 'Max']}
                            T={T}
                          />
                          <RangeDisplay
                            label="Peso (kg)"
                            minVal={cat.peso_min?.toString() ?? ''}
                            maxVal={cat.peso_max?.toString() ?? ''}
                            onMin={v => update(cat._id, 'peso_min', v ? +v : undefined)}
                            onMax={v => update(cat._id, 'peso_max', v ? +v : undefined)}
                            placeholder={['Min', 'Max']}
                            unit="kg"
                            T={T}
                          />
                        </div>

                        {/* Género */}
                        <TogglePills
                          label="Género"
                          options={[
                            { value: 'A', label: 'Ambos' },
                            { value: 'M', label: '♂ Masc.' },
                            { value: 'F', label: '♀ Fem.' },
                          ]}
                          value={cat.genero ?? 'A'}
                          onChange={v => update(cat._id, 'genero', v)}
                          T={T}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Botón agregar vacía */}
      <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={addVacia}
        className="w-full h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
        style={{ background: 'transparent', border: `1.5px dashed ${T.border}`,
          color: T.textDim, cursor: 'pointer', transition: 'all 0.2s' }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = T.violet;
          (e.currentTarget as HTMLElement).style.color = T.violetHi;
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = T.border;
          (e.currentTarget as HTMLElement).style.color = T.textDim;
        }}>
        <Plus size={13} /> Crear categoría personalizada
      </motion.button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  STEP 4 — Confirmar
// ─────────────────────────────────────────────────────────────
const Step4: React.FC<{
  torneo: any;
  categorias: (CategoriaInput & { _id: number })[];
  T: Tema;
}> = ({ torneo, categorias, T }) => {
  const chip = (label: string, val: any) =>
    val ? (
      <span key={label} className="px-2 py-0.5 rounded-lg text-[9px] font-bold"
        style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textMid }}>
        <span style={{ color: T.textDim }}>{label} </span>
        <span style={{ color: T.text, fontWeight: 900 }}>{val}</span>
      </span>
    ) : null;

  return (
    <div className="space-y-4">
      {/* Resumen torneo */}
      <div className="rounded-[1.5rem] p-4 space-y-3"
        style={{ background: `${T.green}0a`, border: `1px solid ${T.green}25` }}>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 18 }}>{torneo.tipo_torneo === 'local' ? '🏠' : '🏆'}</span>
          <p className="text-sm font-black uppercase italic tracking-tighter" style={{ color: T.green }}>
            {torneo.nombre || 'Sin nombre'}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {chip('📅', torneo.fecha)}
          {chip('⏰', torneo.hora_inicio)}
          {chip('📍', torneo.sede)}
          {chip('🏙', torneo.ciudad)}
          {chip('Tipo', torneo.tipo_torneo)}
          {chip('Género', torneo.genero === 'M' ? 'Masculino' : torneo.genero === 'F' ? 'Femenino' : 'Ambos')}
          {chip('💰', torneo.costo_inscripcion ? `$${torneo.costo_inscripcion}` : 'Gratis')}
          {chip('Rings', torneo.num_areas)}
          {torneo.tipo_torneo === 'local' && chip('Comb/comp', torneo.max_combates_por_competidor)}
          {(torneo.edad_minima || torneo.edad_maxima) && chip('Edad', `${torneo.edad_minima ?? '?'}–${torneo.edad_maxima ?? '?'} años`)}
          {(torneo.peso_minimo || torneo.peso_maximo) && chip('Peso', `${torneo.peso_minimo ?? '?'}–${torneo.peso_maximo ?? '?'}kg`)}
        </div>
        {torneo.descripcion && (
          <p className="text-[9px] font-bold leading-relaxed italic" style={{ color: T.textDim }}>
            {torneo.descripcion}
          </p>
        )}
      </div>

      {/* Categorías */}
      <div>
        <p className="text-[8px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5"
          style={{ color: T.textDim }}>
          <Tag size={9} /> {categorias.length} categoría{categorias.length !== 1 ? 's' : ''}
        </p>
        {categorias.length === 0 ? (
          <div className="flex items-center gap-2 p-3 rounded-2xl"
            style={{ background: `${T.orange}10`, border: `1px solid ${T.orange}25` }}>
            <AlertCircle size={13} style={{ color: T.orange }} />
            <p className="text-[9px] font-black" style={{ color: T.orange }}>
              Sin categorías — el matchmaking las necesitará para agrupar competidores.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {categorias.map((c, i) => (
              <div key={c._id} className="flex items-center justify-between gap-2 p-3 rounded-2xl"
                style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-lg flex items-center justify-center text-[8px] font-black"
                    style={{ background: `${T.violet}20`, color: T.violetHi }}>{i + 1}</span>
                  <span className="text-[10px] font-black uppercase italic tracking-tighter"
                    style={{ color: T.text }}>
                    {c.nombre_categoria || <span style={{ color: T.red }}>Sin nombre</span>}
                  </span>
                </div>
                <div className="flex gap-1 flex-wrap justify-end">
                  {(c.edad_min || c.edad_max) && chip('Edad', `${c.edad_min ?? '?'}–${c.edad_max ?? '?'}`)}
                  {(c.peso_min || c.peso_max) && chip('Peso', `${c.peso_min ?? '?'}–${c.peso_max ?? '?'}kg`)}
                  {chip('Gén.', c.genero === 'M' ? '♂' : c.genero === 'F' ? '♀' : '⚡')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Checklist de validación */}
      <div className="rounded-2xl p-3 space-y-2"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        {[
          { ok: !!torneo.nombre,  label: 'Nombre del torneo' },
          { ok: !!torneo.fecha,   label: 'Fecha del evento' },
          { ok: !!torneo.sede,    label: 'Sede / Gimnasio' },
          { ok: categorias.length > 0, label: 'Al menos 1 categoría', warn: true },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: item.ok ? `${T.green}20` : item.warn ? `${T.orange}20` : `${T.red}20` }}>
              {item.ok
                ? <Check size={9} style={{ color: T.green }} />
                : <X size={9} style={{ color: item.warn ? T.orange : T.red }} />
              }
            </div>
            <span className="text-[9px] font-bold" style={{
              color: item.ok ? T.textMid : item.warn ? T.orange : T.red
            }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};


// ─────────────────────────────────────────────────────────────
//  STEP 5 — Credenciales de jueces generados
// ─────────────────────────────────────────────────────────────
interface JuezGenerado {
  area:     string;
  username: string;
  password: string;
  idusuario: number;
}

const Step5Credenciales: React.FC<{
  jueces: JuezGenerado[];
  T: Tema;
}> = ({ jueces, T }) => {
  const [copiado, setCopiado] = useState<string | null>(null);

  const copiar = (texto: string, key: string) => {
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(key);
      setTimeout(() => setCopiado(null), 1800);
    });
  };

  const copiarTodo = () => {
    const texto = jueces.map(j =>
      `${j.area}: usuario=${j.username}  contraseña=${j.password}`
    ).join('\n');
    copiar(texto, 'all');
  };

  return (
    <div className="space-y-4">
      {/* Banner éxito */}
      <div className="flex items-center gap-3 p-4 rounded-[1.5rem]"
        style={{ background: `${T.green}12`, border: `1px solid ${T.green}30` }}>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${T.green}20` }}>
          <span style={{ fontSize: 20 }}>🎉</span>
        </div>
        <div>
          <p className="text-sm font-black uppercase italic tracking-tighter" style={{ color: T.green }}>
            ¡Torneo creado!
          </p>
          <p className="text-[9px] font-bold leading-relaxed" style={{ color: T.textDim }}>
            Se generaron {jueces.length} usuario{jueces.length !== 1 ? 's' : ''} de juez. Copia y entrega las credenciales.
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 p-3 rounded-2xl"
        style={{ background: `${T.violet}0d`, border: `1px solid ${T.violet}20` }}>
        <span style={{ fontSize: 13 }}>💡</span>
        <p className="text-[9px] font-bold leading-relaxed" style={{ color: T.textDim }}>
          Cada juez usa estas credenciales para entrar desde su dispositivo. El área queda asignada automáticamente.
        </p>
      </div>

      {/* Lista de jueces */}
      <div className="space-y-2">
        {jueces.map((j, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-[1.5rem] p-4 space-y-2"
            style={{ background: T.card, border: `1px solid ${T.border}` }}>

            {/* Header área */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black"
                style={{ background: `${T.violet}20`, color: T.violetHi }}>
                {i + 1}
              </div>
              <p className="text-[11px] font-black uppercase italic tracking-tight" style={{ color: T.text }}>
                {j.area}
              </p>
            </div>

            {/* Credenciales */}
            <div className="grid grid-cols-2 gap-2">
              {/* Usuario */}
              <div className="space-y-1">
                <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: T.textDim }}>
                  Usuario
                </p>
                <div className="flex items-center gap-1">
                  <span className="flex-1 text-[10px] font-black font-mono truncate" style={{ color: T.text }}>
                    {j.username}
                  </span>
                  <motion.button whileTap={{ scale: 0.85 }}
                    onClick={() => copiar(j.username, `u${i}`)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: copiado === `u${i}` ? `${T.green}20` : T.surface,
                      border: `1px solid ${copiado === `u${i}` ? T.green : T.border}`,
                    }}>
                    {copiado === `u${i}`
                      ? <Check size={9} style={{ color: T.green }} />
                      : <Copy size={9} style={{ color: T.textDim }} />}
                  </motion.button>
                </div>
              </div>

              {/* Contraseña */}
              <div className="space-y-1">
                <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: T.textDim }}>
                  Contraseña
                </p>
                <div className="flex items-center gap-1">
                  <span className="flex-1 text-[10px] font-black font-mono truncate" style={{ color: T.violetHi }}>
                    {j.password}
                  </span>
                  <motion.button whileTap={{ scale: 0.85 }}
                    onClick={() => copiar(j.password, `p${i}`)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: copiado === `p${i}` ? `${T.green}20` : T.surface,
                      border: `1px solid ${copiado === `p${i}` ? T.green : T.border}`,
                    }}>
                    {copiado === `p${i}`
                      ? <Check size={9} style={{ color: T.green }} />
                      : <Copy size={9} style={{ color: T.textDim }} />}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Copiar todo */}
      <motion.button whileTap={{ scale: 0.96 }} onClick={copiarTodo}
        className="w-full h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
        style={{
          background: copiado === 'all' ? `${T.green}15` : T.surface,
          border: `1px solid ${copiado === 'all' ? T.green : T.border}`,
          color: copiado === 'all' ? T.green : T.textMid,
        }}>
        {copiado === 'all'
          ? <><Check size={13} /> ¡Copiado!</>
          : <><Copy size={13} /> Copiar todo</>}
      </motion.button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  MODAL CREAR TORNEO — WIZARD 4 PASOS
// ─────────────────────────────────────────────────────────────
const ModalCrearTorneo: React.FC<{
  T: Tema;
  onClose: () => void;
  onCreado: (t: Torneo) => void;
}> = ({ T, onClose, onCreado }) => {
  const [step, setStep] = useState(0);
  const [torneo, setTorneo] = useState<any>({
    nombre: '', fecha: '', hora_inicio: '09:00', sede: '', ciudad: '',
    descripcion: '', tipo_torneo: 'competencia',
    costo_inscripcion: '', monto_inscripcion: '',
    edad_minima: '', edad_maxima: '',
    peso_minimo: '', peso_maximo: '',
    genero: 'A', max_participantes: '',
    num_areas: 1, max_combates_por_competidor: 3,
    cinta_minima: '', cinta_maxima: '',
  });
  const [categorias, setCategorias] = useState<(CategoriaInput & { _id: number })[]>([]);
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState('');
  const [juecesGenerados,  setJuecesGenerados]  = useState<JuezGenerado[]>([]);
  const [creado,           setCreado]           = useState(false);

  const canNext = () => {
    if (step === 0) return !!(torneo.nombre && torneo.fecha && torneo.sede);
    return true;
  };

  // Genera password segura: 12+ chars, mayúsculas, minúsculas, números y especiales
  const genPassword = () => {
    const lower   = 'abcdefghjkmnpqrstuvwxyz';
    const upper   = 'ABCDEFGHJKMNPQRSTUVWXYZ';
    const nums    = '23456789';
    const special = '@#$!%&*';
    const all     = lower + upper + nums + special;
    const rand    = (s: string) => s[Math.floor(Math.random() * s.length)];
    // Garantizar al menos 1 de cada tipo
    const required = [rand(lower), rand(lower), rand(upper), rand(upper), rand(nums), rand(nums), rand(special)];
    // Rellenar hasta 13 caracteres con cualquier tipo
    const fill = Array.from({ length: 6 }, () => rand(all));
    // Mezclar con Fisher-Yates
    const combined = [...required, ...fill];
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }
    return combined.join('');
  };

  const handleSubmit = async () => {
    if (!torneo.nombre || !torneo.fecha || !torneo.sede) {
      setError('Nombre, fecha y sede son requeridos.');
      return;
    }
    try {
      setLoading(true);
      setError('');

      // — PASO 1: Crear torneo —
      const payload: CrearTorneoDTO = {
        nombre:            torneo.nombre,
        fecha:             torneo.fecha,
        hora_inicio:       torneo.hora_inicio,
        sede:              torneo.sede,
        ciudad:            torneo.ciudad || undefined,
        descripcion:       torneo.descripcion || undefined,
        tipo_torneo:       torneo.tipo_torneo,
        costo_inscripcion: torneo.costo_inscripcion ? +torneo.costo_inscripcion : 0,
        monto_inscripcion: torneo.costo_inscripcion ? +torneo.costo_inscripcion : 0,
        genero:            torneo.genero,
        max_participantes: torneo.max_participantes ? +torneo.max_participantes : undefined,
        num_areas:         +torneo.num_areas || 1,
        max_combates_por_competidor: +torneo.max_combates_por_competidor || 3,
        edad_minima:       torneo.edad_minima  ? +torneo.edad_minima  : undefined,
        edad_maxima:       torneo.edad_maxima  ? +torneo.edad_maxima  : undefined,
        peso_minimo:       torneo.peso_minimo  ? +torneo.peso_minimo  : undefined,
        peso_maximo:       torneo.peso_maximo  ? +torneo.peso_maximo  : undefined,
        cinta_minima:      torneo.cinta_minima ? +torneo.cinta_minima : undefined,
        cinta_maxima:      torneo.cinta_maxima ? +torneo.cinta_maxima : undefined,
        categorias: categorias.map((c, i) => ({
          nombre_categoria:  c.nombre_categoria,
          edad_min:          c.edad_min ?? undefined,
          edad_max:          c.edad_max ?? undefined,
          peso_min:          c.peso_min ?? undefined,
          peso_max:          c.peso_max ?? undefined,
          genero:            c.genero ?? 'A',
          orden_ejecucion:   i + 1,
          grados_permitidos: c.grados_permitidos
            ? (typeof c.grados_permitidos === 'string'
                ? (c.grados_permitidos as string).split(',').map(g => parseInt(g.trim())).filter(Boolean)
                : c.grados_permitidos as number[])
            : undefined,
        })),
      };
      const res   = await torneoService.crear(payload);
      const nuevo: Torneo = (res as any)?.torneo ?? res;
      const idtorneo = nuevo.idtorneo;

      // — PASO 2 + 3: Por cada área, crear usuario Juez + crear área asignada —
      const numAreas = +torneo.num_areas || 1;
      const generados: JuezGenerado[] = [];

      const ts = Date.now().toString(36).slice(-4); // 4 chars base-36 del timestamp
      for (let i = 1; i <= numAreas; i++) {
        const nombreArea = `Área ${i}`;
        const username   = `juez_t${idtorneo}_a${i}_${ts}`;
        const password   = genPassword();

        // Crear usuario juez
        const juezRes = await api.post('/usuarios/usuarios/registrar-juez', {
          username,
          password,
          nombre_completo: `Juez ${nombreArea} — Torneo ${idtorneo}`,
        });
        const idusuario = juezRes.data?.idusuario ?? juezRes.data?.data?.idusuario;

        // Crear área con juez asignado
        await torneoAreasService.crearArea(idtorneo, { nombre_area: nombreArea, idjuez_asignado: idusuario });

        generados.push({ area: nombreArea, username, password, idusuario });
      }

      setJuecesGenerados(generados);
      setCreado(true);
      setStep(4);         // paso extra: mostrar credenciales
      onCreado(nuevo);    // actualiza la lista en el padre

    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Error al crear el torneo. Revisa los datos.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <motion.div className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 20 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        exit={{    scale: 0.93, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="w-full max-w-lg flex flex-col"
        style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: '2rem', maxHeight: 'calc(100dvh - 40px)',
        }}
        onClick={e => e.stopPropagation()}>

        {/* HEADER */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: T.violetLo, border: `1px solid ${T.violet}40` }}>
              <Trophy size={18} style={{ color: T.violetHi }} />
            </div>
            <div>
              <p className="text-sm font-black uppercase italic tracking-tighter" style={{ color: T.text }}>
                Nuevo Torneo
              </p>
              <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: T.textDim }}>
                {step < WIZARD_STEPS.length ? `${WIZARD_STEPS[step].label} — paso ${step + 1} de ${WIZARD_STEPS.length}` : '¡Torneo creado!'}
              </p>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.88 }} onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-2xl"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <X size={14} style={{ color: T.textDim }} />
          </motion.button>
        </div>

        {/* WIZARD INDICATOR */}
        <div className="px-5 pt-4 flex-shrink-0">
          {step < WIZARD_STEPS.length && <WizardSteps current={step} T={T} />}
        </div>

        {/* CONTENIDO */}
        <div className="flex-1 overflow-y-auto px-5 pb-2" style={{ overscrollBehavior: 'contain' }}>
          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
              {step === 0 && <Step1 data={torneo} set={setTorneo} T={T} />}
              {step === 1 && <Step2 data={torneo} set={setTorneo} T={T} />}
              {step === 2 && <Step3 categorias={categorias} setCategorias={setCategorias} T={T} />}
              {step === 3 && <Step4 torneo={torneo} categorias={categorias} T={T} />}
              {step === 4 && <Step5Credenciales jueces={juecesGenerados} T={T} />}
            </motion.div>
          </AnimatePresence>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mt-3 text-[10px] font-black uppercase tracking-wider text-center"
              style={{ color: T.red }}>
              ⚠️ {error}
            </motion.p>
          )}
        </div>

        {/* NAVEGACIÓN */}
        <div className="flex gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderTop: `1px solid ${T.border}`,
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          {step < 4 && (
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => step === 0 ? onClose() : setStep(s => s - 1)}
              className="flex-1 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest"
              style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textMid }}>
              {step === 0 ? 'Cancelar' : '← Anterior'}
            </motion.button>
          )}

          {step === 4 ? (
            <motion.button whileTap={{ scale: 0.95 }} onClick={onClose}
              className="flex-[2] h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg, ${T.green}, #059669)`, color: '#fff' }}>
              <Check size={14} /> Listo — Cerrar
            </motion.button>
          ) : step < WIZARD_STEPS.length - 1 ? (
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => { setError(''); setStep(s => s + 1); }}
              disabled={!canNext()}
              className="flex-[2] h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest"
              style={{
                background: canNext()
                  ? `linear-gradient(135deg, ${T.violet}, ${T.violetHi})`
                  : T.surface,
                color: canNext() ? '#fff' : T.textDim,
                border: !canNext() ? `1px solid ${T.border}` : 'none',
              }}>
              Siguiente →
            </motion.button>
          ) : (
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleSubmit} disabled={loading}
              className="flex-[2] h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${T.green}, #059669)`,
                color: '#fff', opacity: loading ? 0.7 : 1,
              }}>
              {loading
                ? <><Loader2 size={14} className="animate-spin" /> Creando áreas...</>
                : <><Check size={14} /> Crear Torneo</>}
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};

// ─────────────────────────────────────────────────────────────
//  TARJETA TORNEO (sin cambios)
// ─────────────────────────────────────────────────────────────
const TorneoCard: React.FC<{
  torneo: Torneo; T: Tema; delay?: number;
  onVerDetalle: (t: Torneo) => void;
}> = ({ torneo, T, delay = 0, onVerDetalle }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    whileHover={{ y: -3 }}
    className="rounded-[2rem] p-5 cursor-pointer"
    style={{
      background: `linear-gradient(135deg, ${T.card}, ${T.surface})`,
      border: `1px solid ${T.border}`,
      boxShadow: `0 4px 20px rgba(0,0,0,0.12)`,
    }}
    onClick={() => onVerDetalle(torneo)}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: T.violetLo, border: `1px solid ${T.violet}30` }}>
        <Trophy size={20} style={{ color: T.violetHi }} />
      </div>
      <EstatusBadge estatus={torneo.estatus} T={T} />
    </div>

    <p className="text-sm font-black uppercase italic tracking-tighter leading-tight mb-1"
      style={{ color: T.text }}>{torneo.nombre}</p>
    <p className="text-[8px] font-black uppercase tracking-widest mb-4" style={{ color: T.textDim }}>
      ID #{torneo.idtorneo}
      {(torneo as any).tipo_torneo && (
        <span className="ml-2 px-1.5 py-0.5 rounded-lg"
          style={{ background: `${T.violet}20`, color: T.violetHi }}>
          {(torneo as any).tipo_torneo}
        </span>
      )}
    </p>

    <div className="space-y-2 mb-4">
      <div className="flex items-center gap-2">
        <Calendar size={10} style={{ color: T.cyan }} />
        <span className="text-[10px] font-bold" style={{ color: T.textMid }}>
          {fmtFecha(torneo.fecha)}{torneo.hora_inicio && ` · ${torneo.hora_inicio}`}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <MapPin size={10} style={{ color: T.orange }} />
        <span className="text-[10px] font-bold truncate" style={{ color: T.textMid }}>
          {torneo.sede}{torneo.ciudad ? `, ${torneo.ciudad}` : ''}
        </span>
      </div>
      {(torneo.max_participantes ?? 0) > 0 && (
        <div className="flex items-center gap-2">
          <Users size={10} style={{ color: T.green }} />
          <span className="text-[10px] font-bold" style={{ color: T.textMid }}>
            Máx. {torneo.max_participantes} participantes
          </span>
        </div>
      )}
    </div>

    <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${T.border}` }}>
      {(torneo.monto_inscripcion ?? 0) > 0 ? (
        <span className="text-sm font-black" style={{ color: T.green }}>
          ${torneo.monto_inscripcion?.toLocaleString('es-MX')}
        </span>
      ) : (
        <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: T.textDim }}>Sin costo</span>
      )}
      <div className="flex items-center gap-1" style={{ color: T.violetHi }}>
        <span className="text-[9px] font-black uppercase tracking-wider">Ver detalle</span>
        <ChevronRight size={12} />
      </div>
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────
//  DETALLE TORNEO (sin cambios)
// ─────────────────────────────────────────────────────────────
const DetalleTorneo: React.FC<{
  torneo: Torneo; T: Tema; onVolver: () => void;
}> = ({ torneo, T, onVolver }) => {
  const [inscritos, setInscritos]           = useState<any[]>([]);
  const [loadingInsc, setLoadingInsc]       = useState(true);
  const [loadingCheckin, setLoadingCheckin] = useState(false);
  const [checkinResult, setCheckinResult]   = useState<any>(null);
  const [errorCheckin, setErrorCheckin]     = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await torneoService.listarInscritos(torneo.idtorneo);
        setInscritos(data);
      } catch { /* silencioso */ }
      finally { setLoadingInsc(false); }
    })();
  }, [torneo.idtorneo]);

  const handleCerrarCheckin = async () => {
    if (!confirm('¿Cerrar check-in y generar brackets? Esta acción no se puede deshacer.')) return;
    try {
      setLoadingCheckin(true);
      setErrorCheckin('');
      const res = await torneoService.cerrarCheckin(torneo.idtorneo);
      setCheckinResult(res);
    } catch (e: any) {
      setErrorCheckin(e?.response?.data?.detail || 'Error al cerrar check-in');
    } finally { setLoadingCheckin(false); }
  };

  const pagados = inscritos.filter(i => i.estatus_pago === 'pagado').length;
  const checkin = inscritos.filter(i => i.estatus_checkin).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onVolver}
          className="w-10 h-10 flex items-center justify-center rounded-2xl flex-shrink-0"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <ChevronLeft size={16} style={{ color: T.textDim }} />
        </motion.button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black uppercase italic tracking-tighter truncate" style={{ color: T.text }}>
            {torneo.nombre}
          </p>
          <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: T.textDim }}>
            {fmtFecha(torneo.fecha)} · {torneo.sede}
          </p>
        </div>
        <EstatusBadge estatus={torneo.estatus} T={T} />
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] p-5 space-y-3"
        style={{ background: `linear-gradient(135deg, ${T.card}, ${T.surface})`, border: `1px solid ${T.border}` }}>
        <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: T.textDim }}>
          Información del evento
        </p>
        {[
          { icon: Calendar,   label: 'Fecha',        value: `${fmtFecha(torneo.fecha)} · ${torneo.hora_inicio ?? '—'}`, color: T.cyan   },
          { icon: MapPin,     label: 'Sede',          value: `${torneo.sede}${torneo.ciudad ? ', ' + torneo.ciudad : ''}`, color: T.orange },
          { icon: Users,      label: 'Participantes', value: `Máx. ${torneo.max_participantes ?? '∞'}`, color: T.green  },
          { icon: DollarSign, label: 'Inscripción',   value: torneo.monto_inscripcion ? `$${torneo.monto_inscripcion}` : 'Sin costo', color: T.violet },
          { icon: Target,     label: 'Género',        value: torneo.genero === 'M' ? 'Masculino' : torneo.genero === 'F' ? 'Femenino' : 'Ambos', color: T.yellow },
          { icon: Layers,     label: 'Tipo',          value: (torneo as any).tipo_torneo ?? '—', color: T.cyan },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${item.color}18`, border: `1px solid ${item.color}25` }}>
              <item.icon size={12} style={{ color: item.color }} />
            </div>
            <div className="flex-1 flex items-center justify-between">
              <span className="text-[8px] font-black uppercase tracking-wider" style={{ color: T.textDim }}>
                {item.label}
              </span>
              <span className="text-[10px] font-bold" style={{ color: T.text }}>{item.value}</span>
            </div>
          </div>
        ))}
        {torneo.descripcion && (
          <div className="pt-3 mt-1" style={{ borderTop: `1px solid ${T.border}` }}>
            <p className="text-[9px] font-bold leading-relaxed" style={{ color: T.textMid }}>
              {torneo.descripcion}
            </p>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Inscritos', value: inscritos.length, icon: FileText,    accent: T.violet, accentLo: T.violetLo },
          { label: 'Pagados',   value: pagados,          icon: CheckCircle, accent: T.green,  accentLo: T.greenLo  },
          { label: 'Check-in',  value: checkin,          icon: Zap,         accent: T.cyan,   accentLo: T.cyanLo   },
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-[1.5rem] p-4"
            style={{ background: `linear-gradient(135deg, ${T.card}, ${T.surface})`, border: `1px solid ${T.border}` }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
              style={{ background: item.accentLo, border: `1px solid ${item.accent}30` }}>
              <item.icon size={14} style={{ color: item.accent }} />
            </div>
            <p className="text-2xl font-black tracking-tighter" style={{ color: T.text }}>
              {loadingInsc ? '—' : item.value}
            </p>
            <p className="text-[8px] font-black uppercase tracking-widest mt-1" style={{ color: T.textDim }}>
              {item.label}
            </p>
          </motion.div>
        ))}
      </div>

      {torneo.estatus === 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] p-5"
          style={{ background: `linear-gradient(135deg, ${T.orangeLo}, ${T.yellowLo})`,
            border: `1px solid ${T.orange}30` }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: T.orangeLo, border: `1px solid ${T.orange}40` }}>
                <Zap size={18} style={{ color: T.orange }} />
              </div>
              <div>
                <p className="text-xs font-black uppercase italic tracking-tighter" style={{ color: T.text }}>
                  Cerrar Check-In
                </p>
                <p className="text-[8px] font-black uppercase tracking-wider" style={{ color: T.textDim }}>
                  Genera brackets automáticamente · {checkin} con check-in
                </p>
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleCerrarCheckin}
              disabled={loadingCheckin || checkin < 2}
              className="h-10 px-5 rounded-2xl text-[10px] font-black uppercase tracking-widest"
              style={{
                background: checkin >= 2 ? `linear-gradient(135deg, ${T.orange}, ${T.yellow})` : T.surface,
                color: checkin >= 2 ? '#fff' : T.textDim,
                border: checkin < 2 ? `1px solid ${T.border}` : 'none',
                opacity: loadingCheckin ? 0.7 : 1,
                cursor: checkin < 2 ? 'not-allowed' : 'pointer',
              }}>
              {loadingCheckin ? 'Generando...' : checkin < 2 ? 'Mín. 2 check-in' : '🚀 Generar Brackets'}
            </motion.button>
          </div>
          <AnimatePresence>
            {checkinResult && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-4 space-y-2" style={{ borderTop: `1px solid ${T.border}` }}>
                <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: T.green }}>
                  ✅ {checkinResult.mensaje} — {checkinResult.combates_creados} combates creados
                </p>
                {checkinResult.categorias?.map((cat: any) => (
                  <div key={cat.idcategoria} className="flex items-center justify-between">
                    <span className="text-[9px] font-bold" style={{ color: T.textMid }}>{cat.nombre}</span>
                    <span className="text-[9px] font-black" style={{ color: cat.nota ? T.red : T.green }}>
                      {cat.nota ?? `${cat.combates_r1} combates · R${cat.total_rondas}`}
                    </span>
                  </div>
                ))}
                <p className="text-[8px] font-bold mt-2" style={{ color: T.textDim }}>
                  Ve a la sección <span style={{ color: T.cyan }}>Combates</span> para ver los brackets en vivo.
                </p>
              </motion.div>
            )}
            {errorCheckin && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mt-3 text-[9px] font-black uppercase tracking-wider"
                style={{ color: T.red }}>⚠️ {errorCheckin}</motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-[2rem] p-5"
        style={{ background: `linear-gradient(135deg, ${T.card}, ${T.surface})`, border: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: T.cyanLo, border: `1px solid ${T.cyan}30` }}>
            <Users size={14} style={{ color: T.cyan }} />
          </div>
          <div>
            <p className="text-xs font-black uppercase italic tracking-tighter" style={{ color: T.text }}>Inscritos</p>
            <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: T.textDim }}>
              {inscritos.length} registros
            </p>
          </div>
        </div>

        {loadingInsc ? (
          <div className="flex justify-center py-8">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 rounded-full"
              style={{ border: `2px solid ${T.border}`, borderTop: `2px solid ${T.cyan}` }} />
          </div>
        ) : inscritos.length === 0 ? (
          <p className="text-center text-[10px] font-black uppercase tracking-wider py-6"
            style={{ color: T.textDim }}>Sin inscritos aún</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {inscritos.map((insc: any, i: number) => {
              const al     = insc.alumnos ?? insc;
              const nombre = al.nombres
                ? `${al.nombres} ${al.apellidopaterno}`
                : insc.nombre_completo ?? `Inscripción #${insc.idinscripcion}`;
              const pagado = insc.estatus_pago === 'pagado';
              const chk    = insc.estatus_checkin;
              return (
                <motion.div key={insc.idinscripcion ?? i}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 p-3 rounded-2xl"
                  style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] flex-shrink-0"
                    style={{ background: `${T.violet}20`, color: T.violetHi, border: `1px solid ${T.violet}20` }}>
                    {nombre[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase italic tracking-tighter truncate"
                      style={{ color: T.text }}>{nombre}</p>
                    <p className="text-[7px] font-bold" style={{ color: T.textDim }}>
                      {insc.peso_declarado ? `${insc.peso_declarado} kg` : '—'}
                      {insc.edad_al_momento ? ` · ${insc.edad_al_momento} años` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="px-1.5 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-wider"
                      style={{ background: pagado ? `${T.green}20` : `${T.red}20`,
                        color: pagado ? T.green : T.red }}>
                      {pagado ? 'Pagado' : 'Pendiente'}
                    </span>
                    {chk && (
                      <span className="px-1.5 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-wider"
                        style={{ background: `${T.cyan}20`, color: T.cyan }}>
                        ✓ Check
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  VISTA PRINCIPAL
// ─────────────────────────────────────────────────────────────
const TorneosView: React.FC<{
  T: Tema;
  onAbrirAreas?:   (idtorneo: number) => void;
  onAbrirCheckin?: (idtorneo: number) => void;
}> = ({ T, onAbrirAreas, onAbrirCheckin }) => {
  const [torneos, setTorneos]             = useState<Torneo[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [showModal, setShowModal]         = useState(false);
  const [torneoDetalle, setTorneoDetalle] = useState<Torneo | null>(null);
  const [filtro, setFiltro]               = useState<'todos' | 'activo' | 'en_curso' | 'finalizado'>('todos');
  const [busqueda, setBusqueda]           = useState('');

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await torneoService.listar();
      setTorneos(data);
    } catch {
      setError('Error al cargar torneos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const torneosFiltrados = torneos.filter(t => {
    const matchFiltro =
      filtro === 'todos'      ? true :
      filtro === 'activo'     ? t.estatus === 1 :
      filtro === 'en_curso'   ? t.estatus === 2 :
      filtro === 'finalizado' ? t.estatus === 3 : true;
    const matchBusqueda = t.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchFiltro && matchBusqueda;
  });

  if (torneoDetalle) {
    return <DetalleTorneo torneo={torneoDetalle} T={T} onVolver={() => setTorneoDetalle(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-lg font-black uppercase italic tracking-tighter leading-none"
            style={{ color: T.text }}>Torneos</p>
          <p className="text-[8px] font-black uppercase tracking-[0.3em] mt-1"
            style={{ color: T.textDim }}>{torneos.length} eventos registrados</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileTap={{ scale: 0.88 }} onClick={cargar}
            className="w-10 h-10 flex items-center justify-center rounded-2xl"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <RotateCcw size={14} style={{ color: T.textDim }} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowModal(true)}
            className="flex items-center gap-2 h-10 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest"
            style={{ background: `linear-gradient(135deg, ${T.violet}, ${T.violetHi})`, color: '#fff' }}>
            <Plus size={14} /> Nuevo
          </motion.button>
        </div>
      </div>

      <div className="relative">
        <Search size={12} className="absolute left-4 top-1/2 -translate-y-1/2"
          style={{ color: T.textDim }} />
        <input placeholder="Buscar torneo..." value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full h-11 pl-9 pr-4 rounded-2xl text-xs font-bold outline-none"
          style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['todos', 'activo', 'en_curso', 'finalizado'] as const).map(f => (
          <motion.button key={f} whileTap={{ scale: 0.92 }} onClick={() => setFiltro(f)}
            className="h-8 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider"
            style={{
              background: filtro === f ? T.violetLo : T.surface,
              border: `1px solid ${filtro === f ? T.violet + '60' : T.border}`,
              color: filtro === f ? T.violetHi : T.textMid,
            }}>
            {f === 'todos' ? 'Todos' : f === 'en_curso' ? 'En Curso' : f.charAt(0).toUpperCase() + f.slice(1)}
          </motion.button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 rounded-full"
            style={{ border: `3px solid ${T.border}`, borderTop: `3px solid ${T.violet}`,
              boxShadow: `0 0 20px ${T.violet}40` }} />
          <p className="text-[9px] font-black uppercase tracking-[0.4em] animate-pulse"
            style={{ color: T.textDim }}>Cargando torneos...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-14 h-14 rounded-[2rem] flex items-center justify-center"
            style={{ background: T.redLo, border: `1px solid ${T.red}40` }}>
            <AlertCircle size={24} style={{ color: T.red }} />
          </div>
          <p className="text-sm font-bold italic" style={{ color: T.textMid }}>{error}</p>
          <motion.button whileTap={{ scale: 0.95 }} onClick={cargar}
            className="flex items-center gap-2 px-5 h-10 rounded-2xl text-[10px] font-black uppercase tracking-widest"
            style={{ background: T.violetLo, border: `1px solid ${T.violet}50`, color: T.violetHi }}>
            <RotateCcw size={14} /> Reintentar
          </motion.button>
        </div>
      ) : torneosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <motion.div animate={{ rotate: [0, 6, -6, 0], scale: [1, 1.06, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-16 h-16 rounded-[2rem] flex items-center justify-center"
            style={{ background: T.violetLo, border: `1px solid ${T.violet}40` }}>
            <Trophy size={28} style={{ color: T.violetHi }} />
          </motion.div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: T.textDim }}>
            {busqueda ? 'Sin resultados' : 'Sin torneos registrados'}
          </p>
          {!busqueda && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 h-10 rounded-2xl text-[10px] font-black uppercase tracking-widest"
              style={{ background: T.violetLo, border: `1px solid ${T.violet}50`, color: T.violetHi }}>
              <Plus size={14} /> Crear primer torneo
            </motion.button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {torneosFiltrados.map((t, i) => (
            <div key={t.idtorneo} className="flex flex-col gap-1.5">
              <TorneoCard torneo={t} T={T} delay={i * 0.08} onVerDetalle={setTorneoDetalle} />
              {t.estatus === 2 && (
                <div className="flex gap-2">
                  {onAbrirAreas && (
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() => onAbrirAreas(t.idtorneo)}
                      className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl text-[8px] font-black uppercase tracking-wider"
                      style={{ background: `${T.violet}15`, border: `1px solid ${T.violet}30`, color: T.violetHi }}>
                      <Shield size={11} /> Áreas / Matchmaking
                    </motion.button>
                  )}
                  {onAbrirCheckin && (
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() => onAbrirCheckin(t.idtorneo)}
                      className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl text-[8px] font-black uppercase tracking-wider"
                      style={{ background: `${T.green}15`, border: `1px solid ${T.green}30`, color: T.green }}>
                      <UserCheck size={11} /> Check-in
                    </motion.button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <ModalCrearTorneo
            T={T}
            onClose={() => setShowModal(false)}
            onCreado={nuevo => setTorneos(prev => [nuevo, ...prev])}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TorneosView;