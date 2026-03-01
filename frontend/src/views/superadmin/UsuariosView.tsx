// ============================================================
//  src/views/superadmin/UsuariosView.tsx
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus, Users, Shield, GraduationCap, Building2,
  ScanLine, Gavel, X, Eye, EyeOff, AlertCircle,
  RotateCcw, ChevronRight, Check, AlertTriangle,
} from 'lucide-react';

import { usuarioService } from '../../services/usuarios.service';
import type {
  Usuario, UserRole,
  RegistroEscuelaDTO, RegistroProfesorDTO,
  RegistroJuezDTO, RegistroStaffDTO,
} from '../../types/usuarios.types';

type Tema = {
  bg: string; surface: string; card: string; cardHover: string;
  border: string; violet: string; violetLo: string; violetHi: string;
  cyan: string; cyanLo: string; green: string; greenLo: string;
  orange: string; orangeLo: string; red: string; redLo: string;
  yellow: string; yellowLo: string;
  text: string; textMid: string; textDim: string; navBg: string;
};

// ─────────────────────────────────────────────────────────────
//  TIPOS
// ─────────────────────────────────────────────────────────────
interface TipoMeta {
  id: UserRole; label: string; desc: string; permisos: string[];
  icon: React.ElementType; color: string; colorLo: string;
}

const TIPOS: TipoMeta[] = [
  {
    id: 'Escuela', label: 'Escuela', icon: Building2,
    desc: 'Administra su dojo: alumnos, profesores y finanzas.',
    permisos: ['Crear profesores', 'Ver alumnos', 'Gestionar finanzas'],
    color: '#7c3aed', colorLo: '#7c3aed20',
  },
  {
    id: 'Profesor', label: 'Profesor', icon: GraduationCap,
    desc: 'Gestiona alumnos y asistencia de su escuela.',
    permisos: ['Ver alumnos', 'Tomar asistencia', 'Ver finanzas propias'],
    color: '#06b6d4', colorLo: '#06b6d420',
  },
  {
    id: 'Juez', label: 'Juez', icon: Gavel,
    desc: 'Árbitro en torneos: registra resultados y ve brackets.',
    permisos: ['Ver brackets', 'Registrar resultados', 'Ver torneo asignado'],
    color: '#f97316', colorLo: '#f9731620',
  },
  {
    id: 'Staff', label: 'Staff', icon: ScanLine,
    desc: 'Control de acceso: escanea QR y hace check-in.',
    permisos: ['Escanear QR', 'Ver datos competidor', 'Registrar check-in'],
    color: '#10b981', colorLo: '#10b98120',
  },
];

const ROL_COLOR: Record<string, string> = {
  SuperAdmin: '#f97316', Escuela: '#7c3aed',
  Profesor: '#06b6d4',   Juez: '#f97316', Staff: '#10b981',
};

// ─────────────────────────────────────────────────────────────
//  VALIDACIONES
// ─────────────────────────────────────────────────────────────
type FormErrors = Record<string, string>;

const BLACKLIST_PW = ['password','contraseña','12345678','admin','taekwondo','tkd2024','master'];

function validarUsername(v: string): string {
  if (!v.trim())              return 'El username es requerido.';
  if (v.length < 4)           return 'Mínimo 4 caracteres.';
  if (v.length > 20)          return 'Máximo 20 caracteres.';
  if (!/^[a-zA-Z0-9_]+$/.test(v)) return 'Solo letras, números y guión bajo (_).';
  return '';
}

function validarPassword(v: string, username: string): string {
  if (!v.trim())              return 'La contraseña es requerida.';
  if (v.length < 12)          return 'Mínimo 12 caracteres.';
  if (!/[A-Z]/.test(v))       return 'Debe incluir al menos una mayúscula.';
  if (!/[a-z]/.test(v))       return 'Debe incluir al menos una minúscula.';
  if (!/\d/.test(v))          return 'Debe incluir al menos un número.';
  if (!/[!@#$%^&*()_+={}[\]:;<>,.?/|~-]/.test(v))
                               return 'Debe incluir al menos un carácter especial.';
  if (/(.)\1\1\1/.test(v))    return 'No puede tener 4+ caracteres repetidos seguidos.';
  if (BLACKLIST_PW.some(w => v.toLowerCase().includes(w)))
                               return 'Contraseña demasiado común o predecible.';
  if (username && v.toLowerCase().includes(username.toLowerCase()))
                               return 'La contraseña no puede contener el username.';
  return '';
}

function validarNombreCompleto(v: string): string {
  if (!v.trim())     return 'El nombre completo es requerido.';
  if (v.trim().length < 5) return 'Mínimo 5 caracteres.';
  return '';
}

function validarNombreEscuela(v: string): string {
  if (!v.trim())     return 'El nombre de la escuela es requerido.';
  if (v.trim().length < 3) return 'Mínimo 3 caracteres.';
  return '';
}

function validarTelefono(v: string): string {
  if (!v) return ''; // opcional
  if (!/^\d+$/.test(v))  return 'Solo se permiten números.';
  if (v.length < 10)      return 'Mínimo 10 dígitos.';
  if (v.length > 15)      return 'Máximo 15 dígitos.';
  return '';
}

function validarFormulario(tipo: UserRole, form: Record<string, string>): FormErrors {
  const errors: FormErrors = {};

  const eUser = validarUsername(form.username ?? '');
  if (eUser) errors.username = eUser;

  const ePw = validarPassword(form.password ?? '', form.username ?? '');
  if (ePw) errors.password = ePw;

  if (tipo === 'Escuela') {
    const eEsc = validarNombreEscuela(form.nombre_escuela ?? '');
    if (eEsc) errors.nombre_escuela = eEsc;
    const eTel = validarTelefono(form.telefono_oficina ?? '');
    if (eTel) errors.telefono_oficina = eTel;
  }

  if (tipo === 'Profesor') {
    const eNom = validarNombreCompleto(form.nombre_completo ?? '');
    if (eNom) errors.nombre_completo = eNom;
    if (!form.idescuela) errors.idescuela = 'Debes seleccionar una escuela.';
  }

  if (tipo === 'Juez') {
    const eNom = validarNombreCompleto(form.nombre_completo ?? '');
    if (eNom) errors.nombre_completo = eNom;
  }

  if (tipo === 'Staff') {
    const eNom = validarNombreCompleto(form.nombre_completo ?? '');
    if (eNom) errors.nombre_completo = eNom;
  }

  return errors;
}

// ─────────────────────────────────────────────────────────────
//  COMPONENTES INPUT
// ─────────────────────────────────────────────────────────────
const Field: React.FC<{
  label: string; value: string; onChange: (v: string) => void;
  onBlur?: () => void;
  type?: string; placeholder?: string; T: Tema;
  isPassword?: boolean; error?: string; touched?: boolean;
}> = ({ label, value, onChange, onBlur, type = 'text', placeholder = '', T, isPassword, error, touched }) => {
  const [show, setShow] = useState(false);
  const hasError = touched && error;
  return (
    <div>
      <label style={{ color: hasError ? T.red : T.textDim, fontSize: 9, fontWeight: 900,
        textTransform: 'uppercase' as const, letterSpacing: '0.2em',
        marginBottom: 4, display: 'block', transition: 'color 0.2s' }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={isPassword ? (show ? 'text' : 'password') : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          style={{
            background: T.surface,
            border: `1px solid ${hasError ? T.red + '80' : T.border}`,
            borderRadius: 14, padding: '10px 14px',
            paddingRight: isPassword ? 40 : 14,
            color: T.text, fontSize: 12, width: '100%', outline: 'none',
            transition: 'border-color 0.2s',
            boxShadow: hasError ? `0 0 0 3px ${T.red}15` : 'none',
          }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)}
            style={{ position: 'absolute', right: 12, top: '50%',
              transform: 'translateY(-50%)', color: T.textDim,
              background: 'none', border: 'none', cursor: 'pointer' }}>
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
      <AnimatePresence>
        {hasError && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-1 mt-1 text-[9px] font-bold"
            style={{ color: T.red }}>
            <AlertTriangle size={9} /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

const SelectField: React.FC<{
  label: string; value: string; onChange: (v: string) => void;
  onBlur?: () => void;
  options: { value: string; label: string }[]; T: Tema;
  error?: string; touched?: boolean;
}> = ({ label, value, onChange, onBlur, options, T, error, touched }) => {
  const hasError = touched && error;
  return (
    <div>
      <label style={{ color: hasError ? T.red : T.textDim, fontSize: 9, fontWeight: 900,
        textTransform: 'uppercase' as const, letterSpacing: '0.2em',
        marginBottom: 4, display: 'block' }}>
        {label}
      </label>
      <select value={value} onChange={e => onChange(e.target.value)} onBlur={onBlur}
        style={{
          background: T.surface,
          border: `1px solid ${hasError ? T.red + '80' : T.border}`,
          borderRadius: 14, padding: '10px 14px',
          color: value ? T.text : T.textDim, fontSize: 12,
          width: '100%', outline: 'none', cursor: 'pointer',
          boxShadow: hasError ? `0 0 0 3px ${T.red}15` : 'none',
        }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <AnimatePresence>
        {hasError && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-1 mt-1 text-[9px] font-bold"
            style={{ color: T.red }}>
            <AlertTriangle size={9} /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  BARRA DE FUERZA DE CONTRASEÑA
// ─────────────────────────────────────────────────────────────
const PasswordStrength: React.FC<{ password: string; T: Tema }> = ({ password, T }) => {
  if (!password) return null;
  const checks = [
    { ok: password.length >= 12,                              label: '12+ chars' },
    { ok: /[A-Z]/.test(password),                            label: 'Mayúscula' },
    { ok: /[a-z]/.test(password),                            label: 'Minúscula' },
    { ok: /\d/.test(password),                               label: 'Número'    },
    { ok: /[!@#$%^&*()_+={}[\]:;<>,.?/|~-]/.test(password), label: 'Especial'  },
  ];
  const passed   = checks.filter(c => c.ok).length;
  const barColor = passed <= 2 ? T.red : passed <= 3 ? T.orange : passed <= 4 ? T.yellow : T.green;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {checks.map((_, i) => (
          <motion.div key={i} className="flex-1 h-1 rounded-full"
            animate={{ backgroundColor: i < passed ? barColor : T.border }}
            transition={{ duration: 0.3 }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {checks.map(c => (
          <span key={c.label} className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider"
            style={{ color: c.ok ? T.green : T.textDim }}>
            <Check size={7} style={{ opacity: c.ok ? 1 : 0.25 }} /> {c.label}
          </span>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  FORMULARIO POR TIPO CON VALIDACIÓN
// ─────────────────────────────────────────────────────────────
const FormCampos: React.FC<{
  tipo: UserRole;
  form: Record<string, string>;
  errors: FormErrors;
  touched: Record<string, boolean>;
  onChange: (k: string, v: string) => void;
  onBlur:   (k: string) => void;
  escuelas: { value: string; label: string }[];
  T: Tema;
}> = ({ tipo, form, errors, touched, onChange, onBlur, escuelas, T }) => (
  <div className="space-y-3">

    {/* Username */}
    <Field
      label="Username *" value={form.username ?? ''}
      onChange={v => onChange('username', v)} onBlur={() => onBlur('username')}
      placeholder="min. 4 chars · solo letras/números/_"
      error={errors.username} touched={touched.username} T={T}
    />

    {/* Contraseña */}
    <div>
      <Field
        label="Contraseña *" value={form.password ?? ''}
        onChange={v => onChange('password', v)} onBlur={() => onBlur('password')}
        isPassword placeholder="min. 12 chars"
        error={errors.password} touched={touched.password} T={T}
      />
      <PasswordStrength password={form.password ?? ''} T={T} />
    </div>

    {/* ── Escuela ── */}
    {tipo === 'Escuela' && (
      <>
        <Field
          label="Nombre de la escuela *" value={form.nombre_escuela ?? ''}
          onChange={v => onChange('nombre_escuela', v)} onBlur={() => onBlur('nombre_escuela')}
          placeholder="Dojo Dragón Negro"
          error={errors.nombre_escuela} touched={touched.nombre_escuela} T={T}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Teléfono" value={form.telefono_oficina ?? ''}
            onChange={v => onChange('telefono_oficina', v.replace(/\D/g, ''))} onBlur={() => onBlur('telefono_oficina')}
            placeholder="4771234567"
            type="tel"
            error={errors.telefono_oficina} touched={touched.telefono_oficina} T={T}
          />
          <Field
            label="Lema" value={form.lema ?? ''}
            onChange={v => onChange('lema', v)}
            placeholder="Disciplina y Honor" T={T}
          />
        </div>
        <Field
          label="Dirección" value={form.direccion ?? ''}
          onChange={v => onChange('direccion', v)}
          placeholder="Av. Ejemplo 123, León Gto." T={T}
        />
      </>
    )}

    {/* ── Profesor ── */}
    {tipo === 'Profesor' && (
      <>
        <Field
          label="Nombre completo *" value={form.nombre_completo ?? ''}
          onChange={v => onChange('nombre_completo', v)} onBlur={() => onBlur('nombre_completo')}
          placeholder="Juan Pérez López"
          error={errors.nombre_completo} touched={touched.nombre_completo} T={T}
        />
        <SelectField
          label="Escuela *" value={form.idescuela ?? ''}
          onChange={v => onChange('idescuela', v)} onBlur={() => onBlur('idescuela')}
          options={[{ value: '', label: '— Selecciona una escuela —' }, ...escuelas]}
          error={errors.idescuela} touched={touched.idescuela} T={T}
        />
      </>
    )}

    {/* ── Juez ── */}
    {tipo === 'Juez' && (
      <Field
        label="Nombre completo *" value={form.nombre_completo ?? ''}
        onChange={v => onChange('nombre_completo', v)} onBlur={() => onBlur('nombre_completo')}
        placeholder="Carlos Ramírez Torres"
        error={errors.nombre_completo} touched={touched.nombre_completo} T={T}
      />
    )}

    {/* ── Staff ── */}
    {tipo === 'Staff' && (
      <>
        <Field
          label="Nombre completo *" value={form.nombre_completo ?? ''}
          onChange={v => onChange('nombre_completo', v)} onBlur={() => onBlur('nombre_completo')}
          placeholder="María González"
          error={errors.nombre_completo} touched={touched.nombre_completo} T={T}
        />
        <SelectField
          label="Escuela (opcional)" value={form.idescuela ?? ''}
          onChange={v => onChange('idescuela', v)}
          options={[{ value: '', label: '— Sin escuela asignada —' }, ...escuelas]}
          T={T}
        />
      </>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────
//  CARD TIPO (paso 1)
// ─────────────────────────────────────────────────────────────
const TipoCard: React.FC<{ meta: TipoMeta; onClick: () => void; T: Tema }> = ({ meta, onClick, T }) => (
  <motion.button whileTap={{ scale: 0.97 }} onClick={onClick}
    className="w-full text-left p-4 rounded-[1.75rem] flex items-start gap-4"
    style={{ background: `linear-gradient(135deg, ${meta.colorLo}, transparent)`,
      border: `1px solid ${meta.color}30` }}
    onMouseEnter={e => (e.currentTarget.style.borderColor = `${meta.color}70`)}
    onMouseLeave={e => (e.currentTarget.style.borderColor = `${meta.color}30`)}>
    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
      style={{ background: meta.colorLo, border: `1px solid ${meta.color}40` }}>
      <meta.icon size={22} style={{ color: meta.color }} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-black uppercase italic tracking-tighter" style={{ color: T.text }}>
        {meta.label}
      </p>
      <p className="text-[9px] font-bold leading-relaxed mt-0.5 mb-2" style={{ color: T.textDim }}>
        {meta.desc}
      </p>
      <div className="flex flex-wrap gap-1">
        {meta.permisos.map(p => (
          <span key={p} className="px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-wider"
            style={{ background: `${meta.color}15`, color: meta.color }}>{p}</span>
        ))}
      </div>
    </div>
    <ChevronRight size={14} style={{ color: T.textDim, flexShrink: 0, marginTop: 4 }} />
  </motion.button>
);

// ─────────────────────────────────────────────────────────────
//  ROL BADGE
// ─────────────────────────────────────────────────────────────
const RolBadge: React.FC<{ rol: string; T: Tema }> = ({ rol, T }) => {
  const ICONS: Record<string, React.ElementType> = {
    SuperAdmin: Shield, Escuela: Building2,
    Profesor: GraduationCap, Juez: Gavel, Staff: ScanLine,
  };
  const color = ROL_COLOR[rol] ?? '#94a3b8';
  const Icon  = ICONS[rol]  ?? Users;
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
      style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
      <Icon size={9} style={{ color }} />
      <span className="text-[8px] font-black uppercase tracking-wider" style={{ color }}>{rol}</span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  MODAL CREAR USUARIO — 2 pasos + validación completa
// ─────────────────────────────────────────────────────────────
const ModalCrearUsuario: React.FC<{
  T: Tema;
  escuelas: { value: string; label: string }[];
  onClose: () => void;
  onCreado: (u: Usuario) => void;
}> = ({ T, escuelas, onClose, onCreado }) => {
  const [paso, setPaso]     = useState<1 | 2>(1);
  const [meta, setMeta]     = useState<TipoMeta | null>(null);
  const [form, setForm]     = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors]   = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Revalidar en tiempo real cuando cambia el form
  useEffect(() => {
    if (!meta) return;
    setErrors(validarFormulario(meta.id, form));
  }, [form, meta]);

  const handleChange = (k: string, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    setApiError('');
  };

  // Marcar campo como tocado al salir del input
  const handleBlur = (k: string) =>
    setTouched(p => ({ ...p, [k]: true }));

  const elegirTipo = (m: TipoMeta) => {
    setMeta(m); setForm({}); setErrors({});
    setTouched({}); setApiError(''); setPaso(2);
  };

  // Marcar todos los campos como tocados para mostrar errores al intentar enviar
  const touchAll = () => {
    if (!meta) return;
    const keys = ['username', 'password'];
    if (meta.id === 'Escuela')  keys.push('nombre_escuela', 'telefono_oficina');
    if (meta.id === 'Profesor') keys.push('nombre_completo', 'idescuela');
    if (meta.id === 'Juez')     keys.push('nombre_completo');
    if (meta.id === 'Staff')    keys.push('nombre_completo');
    setTouched(Object.fromEntries(keys.map(k => [k, true])));
  };

  const handleSubmit = async () => {
    if (!meta) return;
    touchAll();
    const errs = validarFormulario(meta.id, form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      setLoading(true);
      setApiError('');
      let nuevo: Usuario;
      const base = { username: form.username, password: form.password };

      if (meta.id === 'Escuela') {
        nuevo = await usuarioService.registrarEscuela({
          ...base,
          nombre_escuela:   form.nombre_escuela ?? '',
          direccion:        form.direccion        || undefined,
          lema:             form.lema             || undefined,
          telefono_oficina: form.telefono_oficina || undefined,
        } as RegistroEscuelaDTO);
      } else if (meta.id === 'Profesor') {
        nuevo = await usuarioService.registrarProfesor({
          ...base,
          nombre_completo: form.nombre_completo ?? '',
          idescuela:       Number(form.idescuela),
          idgradodan:      form.idgradodan ? Number(form.idgradodan) : undefined,
        } as RegistroProfesorDTO);
      } else if (meta.id === 'Juez') {
        nuevo = await usuarioService.registrarJuez({
          ...base, nombre_completo: form.nombre_completo ?? '',
        } as RegistroJuezDTO);
      } else {
        nuevo = await usuarioService.registrarStaff({
          ...base,
          nombre_completo: form.nombre_completo ?? '',
          idescuela: form.idescuela ? Number(form.idescuela) : undefined,
        } as RegistroStaffDTO);
      }

      onCreado({ ...nuevo, rol: meta.id });
      onClose();

    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      if (Array.isArray(detail)) {
        setApiError(detail.map((d: any) => d.msg.replace('Value error, ', '')).join(' · '));
      } else {
        setApiError(typeof detail === 'string' ? detail : 'Error al crear usuario.');
      }
    } finally {
      setLoading(false);
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        className="w-full max-w-lg rounded-[2rem] flex flex-col overflow-hidden"
        style={{ background: T.card, border: `1px solid ${T.border}`, maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-3">
            <AnimatePresence mode="wait">
              <motion.div key={meta?.id ?? 'base'}
                initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{
                  background: meta ? `${meta.color}20` : '#7c3aed20',
                  border: `1px solid ${meta ? meta.color + '50' : '#7c3aed40'}`,
                }}>
                {meta
                  ? <meta.icon size={18} style={{ color: meta.color }} />
                  : <UserPlus size={18} style={{ color: '#7c3aed' }} />}
              </motion.div>
            </AnimatePresence>
            <div>
              <p className="text-sm font-black uppercase italic tracking-tighter" style={{ color: T.text }}>
                {paso === 1 ? 'Nuevo Usuario' : `Crear ${meta?.label}`}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {[1, 2].map(s => (
                  <div key={s} className="w-5 h-1 rounded-full"
                    style={{ background: paso >= s ? (meta?.color ?? '#7c3aed') : T.border }} />
                ))}
                <span className="text-[7px] font-black uppercase tracking-widest ml-1"
                  style={{ color: T.textDim }}>Paso {paso}/2</span>
              </div>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.88 }} onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-2xl"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <X size={14} style={{ color: T.textDim }} />
          </motion.button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait">

            {paso === 1 && (
              <motion.div key="p1"
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="space-y-3">
                <p className="text-[8px] font-black uppercase tracking-[0.3em] mb-3"
                  style={{ color: T.textDim }}>Selecciona el tipo de cuenta:</p>
                {TIPOS.map(t => <TipoCard key={t.id} meta={t} onClick={() => elegirTipo(t)} T={T} />)}
              </motion.div>
            )}

            {paso === 2 && meta && (
              <motion.div key="p2"
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                className="space-y-4">

                <button onClick={() => { setPaso(1); setApiError(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer',
                    color: T.textDim, fontSize: 9, fontWeight: 900,
                    textTransform: 'uppercase' as const, letterSpacing: '0.2em' }}>
                  ← Cambiar tipo
                </button>

                {/* Banner */}
                <div className="flex items-center gap-3 p-3 rounded-2xl"
                  style={{ background: `${meta.color}12`, border: `1px solid ${meta.color}30` }}>
                  <meta.icon size={16} style={{ color: meta.color }} />
                  <div>
                    <p className="text-[10px] font-black uppercase italic tracking-tighter"
                      style={{ color: T.text }}>{meta.label}</p>
                    <p className="text-[8px] font-bold" style={{ color: T.textDim }}>{meta.desc}</p>
                  </div>
                </div>

                <FormCampos tipo={meta.id} form={form} errors={errors} touched={touched}
                  onChange={handleChange} onBlur={handleBlur} escuelas={escuelas} T={T} />

                {/* Error de API */}
                <AnimatePresence>
                  {apiError && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-2 p-3 rounded-2xl"
                      style={{ background: T.redLo, border: `1px solid ${T.red}30` }}>
                      <AlertCircle size={12} style={{ color: T.red, marginTop: 1, flexShrink: 0 }} />
                      <p className="text-[9px] font-bold leading-relaxed" style={{ color: T.red }}>
                        {apiError}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Botones paso 2 */}
        {paso === 2 && meta && (
          <div className="flex gap-3 px-6 py-4 flex-shrink-0"
            style={{ borderTop: `1px solid ${T.border}` }}>
            <motion.button whileTap={{ scale: 0.95 }} onClick={onClose}
              className="flex-1 h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest"
              style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textMid }}>
              Cancelar
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleSubmit}
              disabled={loading}
              className="flex-[2] h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)`,
                color: '#fff', opacity: loading ? 0.7 : 1,
              }}>
              {loading ? 'Creando...' : `Crear ${meta.label}`}
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
//  VISTA PRINCIPAL
// ─────────────────────────────────────────────────────────────
const UsuariosView: React.FC<{ T: Tema }> = ({ T }) => {
  const [usuarios, setUsuarios]   = useState<Usuario[]>([]);
  const [escuelas, setEscuelas]   = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filtroRol, setFiltroRol] = useState<string>('todos');

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const data = await usuarioService.listar();
      setUsuarios(data);
    } catch {
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarEscuelas = useCallback(async () => {
    try {
      const data = await usuarioService.listarEscuelas();
      setEscuelas(data);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => { cargar(); cargarEscuelas(); }, [cargar, cargarEscuelas]);

  const FILTROS  = ['todos', 'Escuela', 'Profesor', 'Juez', 'Staff'];
  const kpis     = TIPOS.map(t => ({ ...t, count: usuarios.filter(u => u.rol === t.id).length }));
  const filtrados = filtroRol === 'todos' ? usuarios : usuarios.filter(u => u.rol === filtroRol);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-lg font-black uppercase italic tracking-tighter leading-none"
            style={{ color: T.text }}>Usuarios</p>
          <p className="text-[8px] font-black uppercase tracking-[0.3em] mt-1"
            style={{ color: T.textDim }}>{usuarios.length} cuentas registradas</p>
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
            <UserPlus size={14} /> Nuevo
          </motion.button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k, i) => (
          <motion.div key={k.id}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }} whileHover={{ y: -2 }}
            onClick={() => setFiltroRol(filtroRol === k.id ? 'todos' : k.id)}
            className="relative overflow-hidden rounded-[1.75rem] p-4 cursor-pointer"
            style={{
              background: filtroRol === k.id
                ? `linear-gradient(135deg, ${k.color}22, ${k.color}08)`
                : `linear-gradient(135deg, ${T.card}, ${T.surface})`,
              border: `1px solid ${filtroRol === k.id ? k.color + '60' : T.border}`,
            }}>
            <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none"
              style={{ background: `radial-gradient(circle, ${k.color}15 0%, transparent 70%)`,
                transform: 'translate(25%,-25%)' }} />
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: k.colorLo, border: `1px solid ${k.color}30` }}>
              <k.icon size={16} style={{ color: k.color }} />
            </div>
            <p className="text-2xl font-black tracking-tighter leading-none" style={{ color: T.text }}>
              {k.count}
            </p>
            <p className="text-[8px] font-black uppercase tracking-widest mt-1.5" style={{ color: T.textDim }}>
              {k.label}{k.count !== 1 ? 's' : ''}
            </p>
            {filtroRol === k.id && (
              <motion.div layoutId="kpi-bar"
                className="absolute bottom-0 left-0 h-[2px] w-2/3 rounded-full"
                style={{ background: `linear-gradient(90deg, ${k.color}, transparent)` }} />
            )}
          </motion.div>
        ))}
      </div>

      {/* Directorio */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-[2rem] p-5"
        style={{ background: `linear-gradient(135deg, ${T.card}, ${T.surface})`,
          border: `1px solid ${T.border}` }}>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: T.violetLo, border: `1px solid ${T.violet}30` }}>
            <Users size={14} style={{ color: T.violetHi }} />
          </div>
          <div>
            <p className="text-xs font-black uppercase italic tracking-tighter" style={{ color: T.text }}>
              Directorio
            </p>
            <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: T.textDim }}>
              {filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {FILTROS.map(f => (
            <motion.button key={f} whileTap={{ scale: 0.92 }}
              onClick={() => setFiltroRol(f)}
              className="h-7 px-3 rounded-xl text-[8px] font-black uppercase tracking-wider"
              style={{
                background: filtroRol === f ? `${ROL_COLOR[f] ?? T.violet}22` : T.surface,
                border: `1px solid ${filtroRol === f ? (ROL_COLOR[f] ?? T.violet) + '60' : T.border}`,
                color: filtroRol === f ? (ROL_COLOR[f] ?? T.violetHi) : T.textMid,
              }}>
              {f === 'todos' ? 'Todos' : f}
            </motion.button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <motion.div animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 rounded-full"
              style={{ border: `2px solid ${T.border}`, borderTop: `2px solid ${T.violet}` }} />
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-3">
            <Users size={28} style={{ color: T.textDim }} />
            <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: T.textDim }}>
              Sin usuarios en este filtro
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filtrados.map((u, i) => (
              <motion.div key={u.idusuario}
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.025 }}
                className="flex items-center gap-3 p-3 rounded-2xl"
                style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0"
                  style={{
                    background: `${ROL_COLOR[u.rol] ?? T.violet}20`,
                    color: ROL_COLOR[u.rol] ?? T.violetHi,
                    border: `1px solid ${ROL_COLOR[u.rol] ?? T.violet}25`,
                  }}>
                  {u.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black uppercase italic tracking-tighter truncate"
                    style={{ color: T.text }}>{u.username}</p>
                  <p className="text-[8px] font-bold" style={{ color: T.textDim }}>
                    #{u.idusuario}
                    {u.fecha_creacion && ` · ${new Date(u.fecha_creacion).toLocaleDateString('es-MX')}`}
                  </p>
                </div>
                <RolBadge rol={u.rol} T={T} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <ModalCrearUsuario
            T={T} escuelas={escuelas}
            onClose={() => setShowModal(false)}
            onCreado={nuevo => setUsuarios(prev => [nuevo, ...prev])}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UsuariosView;