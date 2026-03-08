// ============================================================
//  src/pages/FormularioInscripcion.tsx
//  Formulario público de inscripción — sin autenticación
//  Ruta: /registro/:slug
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getEscuelaBySlug, registrarAlumno } from '../services/inscripciones_publicas.service';
import type { EscuelaInfo, InscripcionForm, RegistrarAlumnoResponse } from '../types/inscripciones_publicas.types';
import { EMPTY_INSCRIPCION_FORM } from '../types/inscripciones_publicas.types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Calendar, Phone, Mail, MapPin, Heart,
  Shield, School, ChevronRight, ChevronLeft,
  CheckCircle2, AlertTriangle, Loader2, Printer,
  Users, BookOpen, Stethoscope, ClipboardList,
} from 'lucide-react';

// ─── Tipos e inicialización — ver inscripciones_publicas.types.ts ───

// ─── Helpers ─────────────────────────────────────────────────
function calcularEdad(fechanacimiento: string): number {
  if (!fechanacimiento) return 0;
  const hoy = new Date();
  const nac = new Date(fechanacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

// ─── Secciones del formulario ────────────────────────────────
interface Seccion {
  id: string;
  titulo: string;
  icono: React.ElementType;
  color: string;
}

const SECCIONES: Seccion[] = [
  { id: 'basicos',     titulo: 'Datos Personales',   icono: User,          color: '#3b82f6' },
  { id: 'contacto',   titulo: 'Contacto / Tutor',    icono: Users,         color: '#8b5cf6' },
  { id: 'domicilio',  titulo: 'Domicilio',            icono: MapPin,        color: '#f97316' },
  { id: 'medicos',    titulo: 'Datos Médicos',        icono: Stethoscope,   color: '#ef4444' },
  { id: 'escolar',    titulo: 'Datos Escolares',      icono: BookOpen,      color: '#22c55e' },
  { id: 'resumen',    titulo: 'Confirmar y Enviar',   icono: ClipboardList, color: '#06b6d4' },
];

// ─── Validadores ─────────────────────────────────────────────
const validarTelefono = (v: string) => /^\d{10}$/.test(v.replace(/\D/g, ''));
const validarEmail    = (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validarFecha    = (v: string) => {
  if (!v) return false;
  const d = new Date(v + 'T00:00:00');
  const hoy = new Date();
  if (d >= hoy || d.getFullYear() <= 1920) return false;
  const edad = calcularEdad(v);
  return edad >= 5;
};

// ─── Sub-componente: campo de input ──────────────────────────
const Field: React.FC<{
  label: string; name: keyof InscripcionForm; value: string;
  onChange: (n: keyof InscripcionForm, v: string) => void;
  type?: string; required?: boolean; placeholder?: string;
  maxLength?: number; hint?: string; error?: string; opcional?: boolean;
}> = ({ label, name, value, onChange, type = 'text', required, placeholder, maxLength, hint, error, opcional }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
      {label}
      {required && <span className="text-red-500">*</span>}
      {opcional && <span className="text-[9px] font-semibold text-gray-400 normal-case tracking-normal">(opcional)</span>}
    </label>
    <input
      type={type} value={value} maxLength={maxLength}
      placeholder={placeholder}
      onChange={e => onChange(name, e.target.value)}
      className={`w-full px-4 py-3 rounded-xl border outline-none text-sm text-gray-800 bg-white transition-all
        ${error ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}
    />
    {error && <p className="text-[11px] text-red-500 font-semibold flex items-center gap-1">⚠ {error}</p>}
    {!error && hint && <p className="text-[10px] text-gray-400">{hint}</p>}
  </div>
);

const SelectField: React.FC<{
  label: string; name: keyof InscripcionForm; value: string;
  onChange: (n: keyof InscripcionForm, v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean; error?: string;
}> = ({ label, name, value, onChange, options, required, error }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <select
      value={value} onChange={e => onChange(name, e.target.value)}
      className={`w-full px-4 py-3 rounded-xl border outline-none text-sm text-gray-800 bg-white transition-all appearance-none
        ${error ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error && <p className="text-[11px] text-red-500 font-semibold flex items-center gap-1">⚠ {error}</p>}
  </div>
);

// ─── Componente principal ─────────────────────────────────────
export const FormularioInscripcion: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [escuela, setEscuela]     = useState<EscuelaInfo | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error404, setError404]   = useState(false);
  const [form, setForm]           = useState<InscripcionForm>(EMPTY_INSCRIPCION_FORM);
  const [paso, setPaso]           = useState(0);
  const [enviando, setEnviando]   = useState(false);
  const [exito, setExito]         = useState<RegistrarAlumnoResponse | null>(null);
  const [errEnvio, setErrEnvio]   = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof InscripcionForm, string>>>({});
  const setFE = (key: keyof InscripcionForm, msg: string) =>
    setFieldErrors(e => ({ ...e, [key]: msg }));
  const clearFE = (key: keyof InscripcionForm) =>
    setFieldErrors(e => { const n = { ...e }; delete n[key]; return n; });

  // Cargar info escuela
  useEffect(() => {
    if (!slug) return;
    getEscuelaBySlug(slug)
      .then(setEscuela)
      .catch(() => setError404(true))
      .finally(() => setLoading(false));
  }, [slug]);

  // Auto-detectar mayoría de edad
  useEffect(() => {
    if (form.fechanacimiento) {
      const edad = calcularEdad(form.fechanacimiento);
      setForm(f => ({ ...f, es_mayor_de_edad: edad >= 18 }));
    }
  }, [form.fechanacimiento]);

  const handleChange = useCallback((name: keyof InscripcionForm, value: string) => {
    setForm(f => ({ ...f, [name]: value }));
  }, []);



  // Validar paso actual — marca errores por campo
  const validarPaso = (): boolean => {
    const errs: Partial<Record<keyof InscripcionForm, string>> = {};

    switch (SECCIONES[paso].id) {
      case 'basicos':
        if (!form.nombres.trim())
          errs.nombres = 'El nombre es obligatorio';
        if (!form.apellidopaterno.trim())
          errs.apellidopaterno = 'El apellido paterno es obligatorio';
        if (!form.fechanacimiento)
          errs.fechanacimiento = 'La fecha de nacimiento es obligatoria';
        else if (!validarFecha(form.fechanacimiento))
          errs.fechanacimiento = calcularEdad(form.fechanacimiento) < 5
            ? 'El alumno debe tener al menos 5 años'
            : 'Fecha inválida o futura';
        break;

      case 'contacto':
        if (!form.es_mayor_de_edad) {
          if (!form.nombretutor?.trim())
            errs.nombretutor = 'El nombre del tutor es obligatorio';
          if (!form.telefonocontacto?.trim())
            errs.telefonocontacto = 'El teléfono es obligatorio';
          else if (!validarTelefono(form.telefonocontacto))
            errs.telefonocontacto = 'Debe tener 10 dígitos';
          if (!form.correotutor?.trim())
            errs.correotutor = 'El correo del tutor es obligatorio';
          else if (!validarEmail(form.correotutor))
            errs.correotutor = 'Correo inválido';
        } else {
          if (!form.telefono_propio?.trim())
            errs.telefono_propio = 'Tu teléfono es obligatorio';
          else if (!validarTelefono(form.telefono_propio))
            errs.telefono_propio = 'Debe tener 10 dígitos';
          if (form.correo_propio && !validarEmail(form.correo_propio))
            errs.correo_propio = 'Correo inválido';
        }
        break;

      case 'domicilio':
        if (!form.direcciondomicilio.trim())
          errs.direcciondomicilio = 'La dirección es obligatoria';
        break;

      case 'medicos':
        if (!form.tipo_sangre)
          errs.tipo_sangre = 'Selecciona el tipo de sangre';
        if (!form.contacto_emergencia_nombre?.trim())
          errs.contacto_emergencia_nombre = 'El nombre es obligatorio';
        if (!form.contacto_emergencia_tel?.trim())
          errs.contacto_emergencia_tel = 'El teléfono es obligatorio';
        else if (!validarTelefono(form.contacto_emergencia_tel))
          errs.contacto_emergencia_tel = 'Debe tener 10 dígitos';
        break;
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const siguiente = () => {
    const ok = validarPaso();
    if (!ok) { setErrEnvio(''); return; }
    setFieldErrors({});
    setErrEnvio('');
    setPaso(p => Math.min(p + 1, SECCIONES.length - 1));
    window.scrollTo(0, 0);
  };

  const anterior = () => {
    setErrEnvio('');
    setPaso(p => Math.max(p - 1, 0));
    window.scrollTo(0, 0);
  };

  // Enviar
  const handleEnviar = async () => {
    setEnviando(true);
    setErrEnvio('');
    try {
      const data = await registrarAlumno(slug!, form);
      setExito(data);
    } catch (e: any) {
      setErrEnvio(e.message);
    } finally {
      setEnviando(false);
    }
  };

  // ── Imprimir PDF ──────────────────────────────────────────
  const handleImprimir = () => {
    const edad = calcularEdad(form.fechanacimiento);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Formulario de Inscripción — ${escuela?.nombreescuela}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,600;0,700;0,900;1,700&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Barlow', sans-serif; color:#111; background:#fff; font-size:11px; }
    .page { max-width:800px; margin:0 auto; padding:32px; }
    .header { display:flex; align-items:center; gap:16px; border-bottom:3px solid #dc2626; padding-bottom:16px; margin-bottom:20px; }
    .header img { width:64px; height:64px; object-fit:contain; border-radius:8px; }
    .header-text h1 { font-size:20px; font-weight:900; text-transform:uppercase; letter-spacing:-0.5px; }
    .header-text p { font-size:11px; color:#555; margin-top:2px; }
    .badge { display:inline-block; background:#dc2626; color:#fff; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:1px; padding:3px 10px; border-radius:20px; margin-bottom:12px; }
    .seccion { margin-bottom:16px; break-inside:avoid; }
    .seccion-titulo { font-size:10px; font-weight:900; text-transform:uppercase; letter-spacing:1.5px; color:#dc2626; margin-bottom:8px; border-bottom:1px solid #fee2e2; padding-bottom:4px; }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; }
    .campo { display:flex; flex-direction:column; gap:2px; }
    .campo label { font-size:8px; font-weight:700; text-transform:uppercase; color:#888; letter-spacing:0.8px; }
    .campo .valor { border-bottom:1px solid #ddd; min-height:22px; padding:2px 0; font-size:11px; font-weight:600; }
    .firma-section { margin-top:32px; display:grid; grid-template-columns:1fr 1fr; gap:40px; }
    .firma-box { text-align:center; }
    .firma-linea { border-bottom:2px solid #111; margin-bottom:4px; height:48px; }
    .firma-label { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:#555; }
    .footer { margin-top:24px; text-align:center; font-size:9px; color:#aaa; border-top:1px solid #eee; padding-top:8px; }
    .aviso { background:#fef9c3; border:1px solid #fde047; border-radius:6px; padding:8px 12px; font-size:9px; color:#555; margin-top:12px; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display:none; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    ${escuela?.logo_url ? `<img src="${escuela.logo_url}" alt="Logo"/>` : '<div style="width:64px;height:64px;background:#fee2e2;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px">🥋</div>'}
    <div class="header-text">
      <h1>${escuela?.nombreescuela ?? ''}</h1>
      <p>${escuela?.lema ?? 'Disciplina · Respeto · Honor'}</p>
      <p style="margin-top:4px;font-size:10px;color:#888">${escuela?.direccion ?? ''}</p>
    </div>
  </div>

  <div class="badge">Formulario de Inscripción</div>

  <div style="float:right;background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:8px 12px;font-size:9px;color:#555;text-align:center;margin-left:16px;max-width:110px;">
    📸 La foto del alumno<br/>será tomada en el dojo
  </div>

  <div class="seccion">
    <div class="seccion-titulo">1. Datos Personales</div>
    <div class="grid">
      <div class="campo"><label>Nombre(s)</label><div class="valor">${form.nombres}</div></div>
      <div class="campo"><label>Apellido Paterno</label><div class="valor">${form.apellidopaterno}</div></div>
      <div class="campo"><label>Apellido Materno</label><div class="valor">${form.apellidomaterno || '—'}</div></div>
      <div class="campo"><label>Fecha de Nacimiento</label><div class="valor">${form.fechanacimiento}</div></div>
      <div class="campo"><label>Edad</label><div class="valor">${edad} años</div></div>
    </div>
  </div>

  ${!form.es_mayor_de_edad ? `
  <div class="seccion">
    <div class="seccion-titulo">2. Datos del Tutor Legal</div>
    <div class="grid">
      <div class="campo"><label>Nombre del Tutor</label><div class="valor">${form.nombretutor || '—'}</div></div>
      <div class="campo"><label>Teléfono</label><div class="valor">${form.telefonocontacto || '—'}</div></div>
      <div class="campo"><label>Correo Electrónico</label><div class="valor">${form.correotutor || '—'}</div></div>
    </div>
  </div>` : `
  <div class="seccion">
    <div class="seccion-titulo">2. Datos de Contacto (Mayor de Edad)</div>
    <div class="grid">
      <div class="campo"><label>Teléfono</label><div class="valor">${form.telefono_propio || '—'}</div></div>
      <div class="campo"><label>Correo Electrónico</label><div class="valor">${form.correo_propio || '—'}</div></div>
    </div>
  </div>`}

  <div class="seccion">
    <div class="seccion-titulo">3. Domicilio</div>
    <div class="campo"><label>Dirección</label><div class="valor">${form.direcciondomicilio || '—'}</div></div>
  </div>

  <div class="seccion">
    <div class="seccion-titulo">4. Datos Médicos</div>
    <div class="grid-3">
      <div class="campo"><label>Tipo de Sangre</label><div class="valor">${form.tipo_sangre || '—'}</div></div>
      <div class="campo"><label>Seguro Médico</label><div class="valor">${form.seguro_medico || '—'}</div></div>
      <div class="campo"><label>NSS / Póliza</label><div class="valor">${form.nss_o_poliza || '—'}</div></div>
    </div>
    <div style="margin-top:8px" class="grid">
      <div class="campo"><label>Alergias</label><div class="valor">${form.alergias || 'Ninguna'}</div></div>
      <div class="campo"><label>Padecimientos Crónicos</label><div class="valor">${form.padecimientos_cronicos || 'Ninguno'}</div></div>
    </div>
    <div style="margin-top:8px" class="grid">
      <div class="campo"><label>Contacto de Emergencia</label><div class="valor">${form.contacto_emergencia_nombre || '—'}</div></div>
      <div class="campo"><label>Teléfono de Emergencia</label><div class="valor">${form.contacto_emergencia_tel || '—'}</div></div>
    </div>
  </div>

  <div class="seccion">
    <div class="seccion-titulo">5. Datos Escolares</div>
    <div class="grid">
      <div class="campo"><label>Grado Escolar</label><div class="valor">${form.grado_escolar || '—'}</div></div>
      <div class="campo"><label>Escuela de Procedencia</label><div class="valor">${form.escuela_procedencia || '—'}</div></div>
    </div>
  </div>

  <div class="aviso">
    <strong>Aviso de Privacidad:</strong> Los datos proporcionados en este formulario serán utilizados exclusivamente para la gestión interna de ${escuela?.nombreescuela ?? 'la escuela'} y no serán compartidos con terceros.
  </div>

  <div class="firma-section">
    <div class="firma-box">
      <div class="firma-linea"></div>
      <div class="firma-label">${form.es_mayor_de_edad ? 'Firma del Alumno' : 'Firma del Tutor Legal'}</div>
      <div style="font-size:9px;color:#aaa;margin-top:2px">${form.es_mayor_de_edad ? form.nombres + ' ' + form.apellidopaterno : (form.nombretutor || '')}</div>
    </div>
    <div class="firma-box">
      <div class="firma-linea"></div>
      <div class="firma-label">Sello y Firma del Instructor</div>
      <div style="font-size:9px;color:#aaa;margin-top:2px">${escuela?.nombreescuela ?? ''}</div>
    </div>
  </div>

  <div class="footer">
    Formulario generado digitalmente · ${new Date().toLocaleDateString('es-MX', {day:'2-digit',month:'long',year:'numeric'})} · ${escuela?.nombreescuela ?? ''}
    <br/>Este documento requiere firma física para ser válido. No almacenar digitalmente.
  </div>
</div>
<script>window.onload = () => window.print();</script>
</body>
</html>`);
    win.document.close();
  };

  // ── Renders de cada paso ──────────────────────────────────
  const renderPaso = () => {
    const s = SECCIONES[paso];
    switch (s.id) {

      case 'basicos':
        return (
          <div className="flex flex-col gap-4">
            <Field label="Nombre(s)" name="nombres" value={form.nombres} onChange={handleChange} required placeholder="Juan Carlos" error={fieldErrors.nombres} />
            <Field label="Apellido Paterno" name="apellidopaterno" value={form.apellidopaterno} onChange={handleChange} required error={fieldErrors.apellidopaterno} />
            <Field label="Apellido Materno" name="apellidomaterno" value={form.apellidomaterno} onChange={handleChange} opcional />
            <Field label="Fecha de Nacimiento" name="fechanacimiento" value={form.fechanacimiento} onChange={handleChange} type="date" required error={fieldErrors.fechanacimiento} />
            {form.fechanacimiento && (
              <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold ${form.es_mayor_de_edad ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>
                {form.es_mayor_de_edad ? <User size={15}/> : <Users size={15}/>}
                {form.es_mayor_de_edad
                  ? `Mayor de edad (${calcularEdad(form.fechanacimiento)} años) — no se requieren datos de tutor`
                  : `Menor de edad (${calcularEdad(form.fechanacimiento)} años) — se requieren datos del tutor`}
              </motion.div>
            )}
          </div>
        );

      case 'contacto':
        return form.es_mayor_de_edad ? (
          <div className="flex flex-col gap-4">
            <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 font-medium">
              Como mayor de edad, tus propios datos de contacto serán registrados.
            </div>
            <Field label="Tu Teléfono" name="telefono_propio" value={form.telefono_propio} onChange={handleChange} type="tel" required maxLength={10} placeholder="10 dígitos" />
            <Field label="Tu Correo Electrónico" name="correo_propio" value={form.correo_propio} onChange={handleChange} type="email" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="px-4 py-3 bg-purple-50 border border-purple-200 rounded-xl text-sm text-purple-700 font-medium">
              Por ser menor de edad, necesitamos los datos del padre, madre o tutor legal.
            </div>
            <Field label="Nombre completo del Tutor" name="nombretutor" value={form.nombretutor} onChange={handleChange} required placeholder="Nombre y apellidos del responsable" />
            <Field label="Teléfono del Tutor" name="telefonocontacto" value={form.telefonocontacto} onChange={handleChange} type="tel" required maxLength={10} placeholder="10 dígitos" />
            <Field label="Correo del Tutor" name="correotutor" value={form.correotutor} onChange={handleChange} type="email" required error={fieldErrors.correotutor} />
          </div>
        );

      case 'domicilio':
        return (
          <div className="flex flex-col gap-4">
            <Field label="Dirección completa" name="direcciondomicilio" value={form.direcciondomicilio} onChange={handleChange} placeholder="Calle, número, colonia, ciudad" required error={fieldErrors.direcciondomicilio} />
          </div>
        );

      case 'medicos':
        return (
          <div className="flex flex-col gap-4">
            <SelectField label="Tipo de Sangre" name="tipo_sangre" value={form.tipo_sangre} onChange={handleChange} required error={fieldErrors.tipo_sangre}
              options={[
                {value:'',label:'Seleccionar...'},
                {value:'O+',label:'O+'},{value:'O-',label:'O-'},
                {value:'A+',label:'A+'},{value:'A-',label:'A-'},
                {value:'B+',label:'B+'},{value:'B-',label:'B-'},
                {value:'AB+',label:'AB+'},{value:'AB-',label:'AB-'},
                {value:'Desconocido',label:'Desconocido'},
              ]}
            />
            <SelectField label="Seguro Médico" name="seguro_medico" value={form.seguro_medico} onChange={handleChange}
              options={[
                {value:'No cuenta',label:'No cuenta'},
                {value:'IMSS',label:'IMSS'},
                {value:'ISSSTE',label:'ISSSTE'},
                {value:'Privado',label:'Seguro Privado'},
                {value:'Otro',label:'Otro'},
              ]}
            />
            {form.seguro_medico !== 'No cuenta' && (
              <Field label="NSS / Número de Póliza" name="nss_o_poliza" value={form.nss_o_poliza} onChange={handleChange} maxLength={11} />
            )}
            <Field label="Alergias" name="alergias" value={form.alergias} onChange={handleChange} placeholder="Ninguna" />
            <Field label="Padecimientos Crónicos" name="padecimientos_cronicos" value={form.padecimientos_cronicos} onChange={handleChange} placeholder="Ninguno" />
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Contacto de Emergencia</p>
              <div className="flex flex-col gap-3">
                <Field label="Nombre" name="contacto_emergencia_nombre" value={form.contacto_emergencia_nombre} onChange={handleChange} required placeholder="Nombre completo" error={fieldErrors.contacto_emergencia_nombre} />
                <Field label="Teléfono" name="contacto_emergencia_tel" value={form.contacto_emergencia_tel} onChange={handleChange} type="tel" required maxLength={10} error={fieldErrors.contacto_emergencia_tel} hint="10 dígitos" />
              </div>
            </div>
          </div>
        );

      case 'escolar':
        return (
          <div className="flex flex-col gap-4">
            <Field label="Grado Escolar" name="grado_escolar" value={form.grado_escolar} onChange={handleChange} placeholder="ej: 3° Primaria, Preparatoria, Universitario" opcional />
            <Field label="Escuela de Procedencia" name="escuela_procedencia" value={form.escuela_procedencia} onChange={handleChange} placeholder="Nombre de la institución educativa" opcional />
            <div className="flex items-start gap-3 mt-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              <span className="text-xl leading-none">📸</span>
              <p><strong>Foto del alumno:</strong> No es necesario subir una foto ahora. En el dojo se tomará la fotografía oficial del alumno al momento de su primera clase.</p>
            </div>
          </div>
        );



      case 'resumen':
        return (
          <div className="flex flex-col gap-4">
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Resumen de datos</p>
              {[
                ['Nombre completo', `${form.nombres} ${form.apellidopaterno} ${form.apellidomaterno}`.trim()],
                ['Fecha de nacimiento', form.fechanacimiento],
                ['Edad', `${calcularEdad(form.fechanacimiento)} años`],
                form.es_mayor_de_edad
                  ? ['Teléfono', form.telefono_propio]
                  : ['Tutor', form.nombretutor],
                ['Tipo de sangre', form.tipo_sangre],
                ['Emergencia', `${form.contacto_emergencia_nombre} — ${form.contacto_emergencia_tel}`],
              ].map(([k,v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-xs text-gray-500">{k}</span>
                  <span className="text-xs font-semibold text-gray-800 text-right max-w-[55%]">{v || '—'}</span>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
              Al presionar <strong>Registrar</strong>, tus datos se guardarán en el sistema de {escuela?.nombreescuela}. Podrás imprimir el formulario firmable al finalizar.
            </div>
          </div>
        );

      default: return null;
    }
  };

  // ── Estado: cargando ─────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 size={36} className="animate-spin text-blue-500"/>
    </div>
  );

  // ── Estado: 404 ──────────────────────────────────────────
  if (error404) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-5xl">🥋</div>
      <h1 className="text-xl font-black text-gray-800">Escuela no encontrada</h1>
      <p className="text-sm text-gray-500">El link de inscripción no es válido o la escuela no existe.</p>
    </div>
  );

  // ── Estado: éxito ────────────────────────────────────────
  if (exito) return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center gap-6 p-6 text-center">
      <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',bounce:0.4}}>
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200">
          <CheckCircle2 size={40} className="text-white"/>
        </div>
      </motion.div>
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.3}} className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-gray-900">¡Registro exitoso!</h1>
        <p className="text-gray-600 text-sm">
          <strong>{exito.nombres} {exito.apellidos}</strong> ha sido registrado en <strong>{escuela?.nombreescuela}</strong>.
        </p>
      </motion.div>
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.5}}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 w-full max-w-sm text-left">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Siguiente paso</p>
        <p className="text-sm text-gray-600 mb-4">
          Imprime el formulario, fírmalo junto con {form.es_mayor_de_edad ? 'el instructor' : 'el tutor y el instructor'}, y entrégalo en el dojo. <strong>No es necesario guardarlo digitalmente.</strong>
        </p>
        <button
          onClick={handleImprimir}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors"
        >
          <Printer size={18}/> Imprimir Formulario Firmable
        </button>
      </motion.div>
    </div>
  );

  const seccionActual = SECCIONES[paso];
  const esUltimo = paso === SECCIONES.length - 1;

  // ── Formulario ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50" style={{fontFamily:'system-ui,sans-serif'}}>

      {/* Header escuela */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          {escuela?.logo_url
            ? <img src={escuela.logo_url} className="w-10 h-10 rounded-xl object-contain" alt="Logo"/>
            : <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-lg">🥋</div>
          }
          <div>
            <p className="font-black text-sm text-gray-900 leading-none">{escuela?.nombreescuela}</p>
            {escuela?.lema && <p className="text-[10px] text-gray-400 mt-0.5">{escuela.lema}</p>}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Paso {paso + 1} de {SECCIONES.length}
            </span>
            <span className="text-xs text-gray-400">{Math.round(((paso + 1) / SECCIONES.length) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
              animate={{ width: `${((paso + 1) / SECCIONES.length) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            />
          </div>
          {/* Iconos de pasos */}
          <div className="flex justify-between mt-3">
            {SECCIONES.map((s, i) => (
              <div key={s.id} className={`flex flex-col items-center gap-0.5 ${i <= paso ? 'opacity-100' : 'opacity-30'}`}>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${i === paso ? 'shadow-md' : ''}`}
                  style={{ background: i <= paso ? s.color : '#e5e7eb' }}
                >
                  <s.icono size={13} color="white"/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-lg mx-auto px-4 pt-6 pb-32">

        {/* Título sección */}
        <AnimatePresence mode="wait">
          <motion.div key={paso}
            initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}
            transition={{duration:0.2}}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                   style={{background: seccionActual.color}}>
                <seccionActual.icono size={20} color="white"/>
              </div>
              <div>
                <h2 className="font-black text-gray-900 text-lg leading-none">{seccionActual.titulo}</h2>
                <p className="text-xs text-gray-400 mt-0.5">Paso {paso + 1} de {SECCIONES.length}</p>
              </div>
            </div>

            {/* Campos del paso */}
            {renderPaso()}
          </motion.div>
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {errEnvio && (
            <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              className="flex items-center gap-2 mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
              <AlertTriangle size={15}/> {errEnvio}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Botones navegación — fixed bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-4 flex gap-3">
          {paso > 0 && (
            <button onClick={anterior}
              className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">
              <ChevronLeft size={16}/> Atrás
            </button>
          )}
          {!esUltimo ? (
            <button onClick={siguiente}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm shadow-md transition-all active:scale-95"
              style={{background: seccionActual.color}}>
              Continuar <ChevronRight size={16}/>
            </button>
          ) : (
            <button onClick={handleEnviar} disabled={enviando}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-green-600 hover:bg-green-700 rounded-xl text-white font-bold text-sm shadow-md disabled:opacity-50 transition-all active:scale-95">
              {enviando ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle2 size={18}/>}
              {enviando ? 'Registrando...' : 'Registrar Alumno'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormularioInscripcion;