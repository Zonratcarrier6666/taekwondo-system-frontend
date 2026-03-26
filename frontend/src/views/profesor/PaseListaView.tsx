// ============================================================
//  src/views/profesor/PaseListaView.tsx
//  Pase de lista + CRUD de alumnos del profesor
//  Tabs: Asistencia | Alumnos | Resumen
// ============================================================

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, XCircle, Clock, Users, CalendarDays,
  RefreshCw, Save, ChevronLeft, ChevronRight, BarChart2,
  Loader2, CheckCheck, X, TrendingUp, AlertCircle, UserCheck,
  Lock, Search, Eye, Edit3, CameraIcon, Phone, Briefcase,
  UserPlus, User as UserIcon, ImagePlus, RotateCcw, GraduationCap,
  Mail, MapPin, Heart, BookOpen, PhoneForwarded, CalendarDays as CalendarIcon,
} from 'lucide-react';

import { alumnoService }     from '../../services/alumno.service';
import { cintasService }     from '../../services/cintas.service';
import {
  asistenciaService,
  type AlumnoDia,
  type ResumenAlumno,
  type ListaDiaResponse,
} from '../../services/asistencia.service';
import api from '../../api/axios';

// ─────────────────────────────────────────────────────────────
//  BELT COLORS — idéntico a GestionAlumnos
// ─────────────────────────────────────────────────────────────

const BELT_COLORS: Record<string, string> = {
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

function getBeltHex(colorName?: string | null): string {
  if (!colorName) return "#9ca3af";
  if (colorName.startsWith('#')) return colorName;
  const direct = BELT_COLORS[colorName];
  if (direct) return direct;
  const key = Object.keys(BELT_COLORS).find(k => k.toLowerCase() === colorName.toLowerCase());
  return key ? BELT_COLORS[key] : "#888888";
}

function MiniCintaBelt({ colorName, stripeName }: { colorName?: string | null; stripeName?: string | null }) {
  const bg     = getBeltHex(colorName);
  const stripe = stripeName ? getBeltHex(stripeName) : null;
  return (
    <div className="relative w-10 h-3 rounded-sm overflow-hidden border border-white/10 shadow-inner shrink-0"
         style={{ background: bg }}>
      {stripe && <div className="absolute right-1 top-0 bottom-0 w-[20%]" style={{ background: stripe }} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

function hoy(): string { return new Date().toISOString().split('T')[0]; }

function offsetFecha(base: string, dias: number): string {
  const d = new Date(base + 'T12:00:00');
  d.setDate(d.getDate() + dias);
  return d.toISOString().split('T')[0];
}

function formatFecha(iso: string): string {
  const [y, m, d] = iso.split('-');
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${d} ${meses[parseInt(m)-1]} ${y}`;
}

// ─────────────────────────────────────────────────────────────
//  INPUT FIELD (igual que GestionAlumnos)
// ─────────────────────────────────────────────────────────────

interface InputProps {
  label: string; name: string; value: string;
  onChange: (n: string, v: string) => void;
  error?: string; type?: string; required?: boolean;
  placeholder?: string; maxLength?: number;
}
const InputField: React.FC<InputProps> = ({ label, name, value, onChange, error, type='text', required, placeholder, maxLength }) => (
  <div className="space-y-1">
    <label className="text-[7px] font-black uppercase ml-2 text-[var(--color-text-muted)] tracking-widest flex items-center gap-1">
      {label} {required && <span className="text-red-500 font-bold text-xs">*</span>}
    </label>
    <input type={type} placeholder={placeholder} maxLength={maxLength}
      className={`w-full h-11 px-4 bg-[var(--color-background)] rounded-xl border ${error ? 'border-red-500' : 'border-[var(--color-border)]'} focus:border-[var(--color-primary)] outline-none font-bold text-[11px] text-[var(--color-text)] shadow-inner transition-all placeholder:opacity-20`}
      value={value} onChange={e => onChange(name, e.target.value)} />
    <AnimatePresence>
      {error && (
        <motion.p initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:'auto' }} exit={{ opacity:0,height:0 }}
          className="text-[7px] text-red-500 ml-2 font-black uppercase italic tracking-tighter overflow-hidden">{error}</motion.p>
      )}
    </AnimatePresence>
  </div>
);

// ─────────────────────────────────────────────────────────────
//  COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────

const PaseListaView: React.FC = () => {

  // ── Tabs ──────────────────────────────────────────────────
  const [tab, setTab] = useState<'asistencia' | 'alumnos' | 'resumen'>('asistencia');

  // ── Toast ─────────────────────────────────────────────────
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg,   setErrorMsg]   = useState<string | null>(null);
  useEffect(() => { if (successMsg) { const t = setTimeout(() => setSuccessMsg(null), 3000); return () => clearTimeout(t); } }, [successMsg]);

  // ══════════════════════════════════════════════════════════
  //  ESTADO: ASISTENCIA
  // ══════════════════════════════════════════════════════════
  const [fecha, setFecha]           = useState(hoy());
  const [listaData, setListaData]   = useState<ListaDiaResponse | null>(null);
  const [listaLoading, setListaLoading] = useState(true);
  const [local, setLocal]           = useState<Record<number, boolean>>({});
  const [dirty, setDirty]           = useState(false);
  const [saving, setSaving]         = useState(false);
  const esHoy = fecha === hoy();

  const loadLista = useCallback(async (f: string) => {
    setListaLoading(true); setDirty(false);
    try {
      const res = f === hoy()
        ? await asistenciaService.listarHoy()
        : await asistenciaService.listarPorFecha(f);
      setListaData(res);
      const init: Record<number, boolean> = {};
      res.alumnos.forEach(a => { init[a.idalumno] = a.presente !== null ? a.presente : true; });
      setLocal(init);
    } catch { setErrorMsg('Error al cargar la lista.'); }
    finally { setListaLoading(false); }
  }, []);

  useEffect(() => { loadLista(fecha); }, [fecha, loadLista]);

  const toggle = (id: number) => { setLocal(p => ({ ...p, [id]: !p[id] })); setDirty(true); };
  const marcarTodos = (p: boolean) => {
    const next: Record<number, boolean> = {};
    (listaData?.alumnos || []).forEach(a => { next[a.idalumno] = p; });
    setLocal(next); setDirty(true);
  };
  const handleGuardar = async () => {
    setSaving(true);
    try {
      const registros = (listaData?.alumnos || []).map(a => ({ idalumno: a.idalumno, presente: local[a.idalumno] ?? true }));
      const res = await asistenciaService.pasarLista({ fecha, registros });
      setSuccessMsg(res.mensaje || 'Lista guardada');
      setDirty(false);
      loadLista(fecha);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setErrorMsg(err?.response?.data?.detail ?? 'Error al guardar.');
    } finally { setSaving(false); }
  };

  const statsAsist = useMemo(() => {
    const alumnos = listaData?.alumnos || [];
    const presentes = alumnos.filter(a => (local[a.idalumno] ?? true)).length;
    return { total: alumnos.length, presentes, ausentes: alumnos.length - presentes };
  }, [listaData, local]);

  // ══════════════════════════════════════════════════════════
  //  ESTADO: ALUMNOS (CRUD)
  // ══════════════════════════════════════════════════════════
  const [alumnos, setAlumnos]   = useState<any[]>([]);
  const [cintas,  setCintas]    = useState<any[]>([]);
  const [aluLoading, setAluLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [step, setStep]                   = useState<'form'|'detail'|'photo_choice'|'camera'|'preview'>('form');
  const [isEditing, setIsEditing]         = useState(false);
  const [selectedAlumno, setSelectedAlumno] = useState<any>(null);
  const [savingAlu, setSavingAlu]         = useState(false);
  const [errors, setErrors]               = useState<Record<string, string>>({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef   = useRef<HTMLInputElement>(null);
  const [tempFile, setTempFile] = useState<File | null>(null);

  const initialForm = {
    nombres:'', apellidopaterno:'', apellidomaterno:'N/A', fechanacimiento:'',
    contacto_emergencia_nombre:'', contacto_emergencia_tel:'',
    nombretutor:'', telefonocontacto:'', correotutor:'',
    direcciondomicilio:'', grado_escolar:'Desconocido', escuela_procedencia:'Ninguna',
    fotoalumno:'', tipo_sangre:'O+', alergias:'Ninguna', padecimientos_cronicos:'Ninguno',
    seguro_medico:'No cuenta', nss_o_poliza:'', idgradoactual:1, idescuela:0, idprofesor:null, estatus:1
  };
  const [formData, setFormData] = useState<any>(initialForm);

  const loadAlumnos = useCallback(async () => {
    setAluLoading(true);
    try {
      const [aluRes, cintaRes] = await Promise.all([
        alumnoService.getAlumnos(),
        cintasService.listarGrados(),
      ]);
      setAlumnos(aluRes || []);
      const sorted = (cintaRes || []).slice().sort((a: any, b: any) => (a.orden ?? 99) - (b.orden ?? 99));
      setCintas(sorted);
    } catch { setErrorMsg('Error al cargar alumnos.'); }
    finally { setAluLoading(false); }
  }, []);

  useEffect(() => { if (tab === 'alumnos') loadAlumnos(); }, [tab, loadAlumnos]);

  const getCintaInfo = (id: number) => cintas.find((c: any) => c.idgrado === id);

  const filtered = useMemo(() =>
    (alumnos || []).filter(a =>
      `${a.nombres} ${a.apellidopaterno}`.toLowerCase().includes(searchTerm.toLowerCase())
    ), [alumnos, searchTerm]);

  const handleInputChange = (name: string, value: string) => {
    if (['telefonocontacto','contacto_emergencia_tel','nss_o_poliza'].includes(name)) {
      const limit = name === 'nss_o_poliza' ? 11 : 10;
      setFormData((p: any) => ({ ...p, [name]: value.replace(/\D/g,'').slice(0, limit) }));
    } else {
      setFormData((p: any) => ({ ...p, [name]: value }));
    }
  };

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (formData.nombres.trim().length < 2)        e.nombres = 'Obligatorio';
    if (formData.apellidopaterno.trim().length < 2) e.apellidopaterno = 'Obligatorio';
    if (!isEditing) {
      if (!formData.fechanacimiento)                e.fechanacimiento = 'Necesaria';
      if (!formData.idprofesor)                     e.idprofesor = 'Selecciona instructor';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.correotutor || !emailRegex.test(formData.correotutor)) e.correotutor = 'Email inválido';
      if (formData.nombretutor.trim().length < 5)   e.nombretutor = 'Nombre obligatorio';
      if (formData.telefonocontacto.replace(/\D/g,'').length !== 10) e.telefonocontacto = '10 dígitos';
      if (formData.direcciondomicilio.trim().length < 10) e.direcciondomicilio = 'Insuficiente';
      if (formData.contacto_emergencia_nombre.trim().length < 5) e.contacto_emergencia_nombre = 'Obligatorio';
      if (formData.contacto_emergencia_tel.replace(/\D/g,'').length !== 10) e.contacto_emergencia_tel = '10 dígitos';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleOpenAdd = () => {
    setIsEditing(false); setFormData(initialForm); setErrors({}); setStep('form'); setIsModalOpen(true);
  };
  const handleOpenEdit = (a: any) => {
    setIsEditing(true); setSelectedAlumno(a); setFormData({ ...a }); setErrors({}); setStep('form'); setIsModalOpen(true);
  };
  const handleOpenDetail = async (id: number) => {
    setStep('detail'); setIsModalOpen(true);
    try { const d = await alumnoService.getDetalle(id); setSelectedAlumno(d); } catch { /**/ }
  };
  const handleOpenPhoto = (a: any) => { setSelectedAlumno(a); setStep('photo_choice'); setIsModalOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSavingAlu(true);
    try {
      if (isEditing && selectedAlumno) {
        const res = await alumnoService.actualizar(selectedAlumno.idalumno, {
          nombres: formData.nombres, apellidopaterno: formData.apellidopaterno,
          apellidomaterno: formData.apellidomaterno, idgradoactual: formData.idgradoactual,
          estatus: formData.estatus, fotoalumno: formData.fotoalumno,
        });
        setAlumnos(p => p.map(a => a.idalumno === res.idalumno ? res : a));
        setIsModalOpen(false);
        setSuccessMsg('Alumno actualizado');
      } else {
        const res = await alumnoService.registrar(formData);
        setSelectedAlumno(res); setAlumnos(p => [...p, res]); setStep('photo_choice');
        setSuccessMsg('Alumno registrado');
      }
    } catch { setErrorMsg('Error al guardar.'); }
    finally { setSavingAlu(false); }
  };

  const stopCamera = () => { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; };
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 640 } });
      streamRef.current = stream; setStep('camera');
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch { setErrorMsg('No se pudo acceder a la cámara.'); }
  };
  const capture = () => {
    const canvas = document.createElement('canvas'); canvas.width = 600; canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (ctx && videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0, 600, 600);
      canvas.toBlob(blob => {
        if (blob && selectedAlumno) { setTempFile(new File([blob], 'profile.jpg', { type: 'image/jpeg' })); setStep('preview'); }
      }, 'image/jpeg');
    }
  };
  const confirmUpload = async () => {
    if (!tempFile || !selectedAlumno) return;
    setSavingAlu(true);
    try {
      const res = await alumnoService.subirFoto(selectedAlumno.idalumno, tempFile);
      setAlumnos(p => p.map(a => a.idalumno === res.idalumno ? res : a));
      setIsModalOpen(false); setSuccessMsg('Foto actualizada');
    } catch { setErrorMsg('Error al subir foto.'); }
    finally { setSavingAlu(false); }
  };

  // ══════════════════════════════════════════════════════════
  //  ESTADO: RESUMEN
  // ══════════════════════════════════════════════════════════
  const [resumen, setResumen]       = useState<ResumenAlumno[]>([]);
  const [resLoading, setResLoading] = useState(false);
  const [resDias, setResDias]       = useState(30);

  const loadResumen = useCallback(async () => {
    setResLoading(true);
    try {
      const hasta = hoy(); const desde = offsetFecha(hasta, -(resDias-1));
      const res = await asistenciaService.resumenGrupo({ desde, hasta });
      setResumen(res.alumnos || []);
    } catch { setResumen([]); }
    finally { setResLoading(false); }
  }, [resDias]);

  useEffect(() => { if (tab === 'resumen') loadResumen(); }, [tab, loadResumen]);

  // ──────────────────────────────────────────────────────────
  //  RENDER
  // ──────────────────────────────────────────────────────────
  return (
    <>
    <div className="space-y-4 text-[var(--color-text)] animate-in fade-in duration-500 pb-24">

      {/* Toasts */}
      <AnimatePresence>
        {successMsg && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
            className="fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border border-green-500"
            style={{ backgroundColor:'#16a34a', color:'white' }}>
            <CheckCircle2 size={18} /><span className="text-sm font-black tracking-tight">{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {errorMsg && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
            className="fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border border-red-500 max-w-sm"
            style={{ backgroundColor:'#dc2626', color:'white' }}>
            <AlertCircle size={18} className="flex-shrink-0" />
            <span className="text-sm font-black tracking-tight flex-1">{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)}><X size={14}/></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <div className="bg-[var(--color-card)] backdrop-blur-2xl p-5 rounded-[2.5rem] border border-[var(--color-border)] shadow-2xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background:'var(--color-primary)20', border:'1.5px solid var(--color-primary)40' }}>
              <UserCheck size={22} style={{ color:'var(--color-primary)' }} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase italic tracking-tighter leading-none text-[var(--color-text)]">
                {tab === 'asistencia' ? 'Pase de Lista' : tab === 'alumnos' ? 'Mis Alumnos' : 'Resumen'}
              </h2>
              <p className="text-[7px] font-black uppercase tracking-[0.4em] mt-1 opacity-40 leading-none text-[var(--color-text-muted)]">
                {tab === 'asistencia' ? 'Control de Asistencia' : tab === 'alumnos' ? 'CRUD — Grupo a Cargo' : 'Estadísticas de Asistencia'}
              </p>
            </div>
          </div>

          {/* Acción contextual */}
          {tab === 'asistencia' && (
            <motion.button whileTap={{ scale:0.88, rotate:-180 }} transition={{ duration:0.35 }}
              onClick={() => loadLista(fecha)} disabled={listaLoading}
              className="h-9 w-9 flex items-center justify-center rounded-xl border transition-all"
              style={{ background:'var(--color-background)', borderColor:'var(--color-border)', color:'var(--color-text-muted)' }}>
              {listaLoading ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14}/>}
            </motion.button>
          )}
          {tab === 'alumnos' && (
            <div className="flex gap-2">
              <motion.button whileTap={{ scale:0.88, rotate:-180 }} transition={{ duration:0.35 }}
                onClick={loadAlumnos} disabled={aluLoading}
                className="h-9 w-9 flex items-center justify-center rounded-xl border transition-all"
                style={{ background:'var(--color-background)', borderColor:'var(--color-border)', color:'var(--color-text-muted)' }}>
                {aluLoading ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14}/>}
              </motion.button>
              <motion.button whileTap={{ scale:0.95 }} onClick={handleOpenAdd}
                className="h-9 px-4 rounded-xl flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white"
                style={{ background:'var(--color-primary)' }}>
                <UserPlus size={13}/> Nuevo
              </motion.button>
            </div>
          )}
          {tab === 'resumen' && (
            <motion.button whileTap={{ scale:0.88, rotate:-180 }} transition={{ duration:0.35 }}
              onClick={loadResumen} disabled={resLoading}
              className="h-9 w-9 flex items-center justify-center rounded-xl border transition-all"
              style={{ background:'var(--color-background)', borderColor:'var(--color-border)', color:'var(--color-text-muted)' }}>
              {resLoading ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14}/>}
            </motion.button>
          )}
        </div>

        {/* Navegador de fecha — solo en asistencia */}
        {tab === 'asistencia' && (
          <>
            <div className="flex items-center gap-2">
              <button onClick={() => setFecha(f => offsetFecha(f, -1))}
                className="h-9 w-9 rounded-xl flex items-center justify-center border transition-all"
                style={{ background:'var(--color-background)', borderColor:'var(--color-border)', color:'var(--color-text-muted)' }}>
                <ChevronLeft size={16}/>
              </button>
              <div className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl border font-black text-sm"
                style={{ background:'var(--color-background)', borderColor: esHoy ? 'var(--color-primary)50' : 'var(--color-border)', color: esHoy ? 'var(--color-primary)' : 'var(--color-text)' }}>
                <CalendarDays size={14}/>
                <span>{esHoy ? `Hoy — ${formatFecha(fecha)}` : formatFecha(fecha)}</span>
              </div>
              <button onClick={() => setFecha(f => offsetFecha(f, 1))} disabled={fecha >= hoy()}
                className="h-9 w-9 rounded-xl flex items-center justify-center border transition-all disabled:opacity-30"
                style={{ background:'var(--color-background)', borderColor:'var(--color-border)', color:'var(--color-text-muted)' }}>
                <ChevronRight size={16}/>
              </button>
              {!esHoy && (
                <button onClick={() => setFecha(hoy())}
                  className="h-9 px-3 rounded-xl text-[9px] font-black uppercase border transition-all"
                  style={{ background:'var(--color-primary)15', borderColor:'var(--color-primary)40', color:'var(--color-primary)' }}>
                  Hoy
                </button>
              )}
            </div>

            {/* KPIs asistencia */}
            {!listaLoading && (listaData?.alumnos?.length ?? 0) > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label:'Total',     val: statsAsist.total,     color:'var(--color-text)', Icon: Users },
                  { label:'Presentes', val: statsAsist.presentes, color:'#22c55e',           Icon: CheckCircle2 },
                  { label:'Ausentes',  val: statsAsist.ausentes,  color:'#ef4444',           Icon: XCircle },
                ].map(({ label, val, color, Icon }) => (
                  <div key={label} className="bg-[var(--color-background)] rounded-2xl p-3 text-center border border-[var(--color-border)]">
                    <Icon size={14} className="mx-auto mb-1" style={{ color }}/>
                    <p className="text-xl font-black leading-none" style={{ color }}>{val}</p>
                    <p className="text-[7px] font-black uppercase tracking-widest mt-0.5 opacity-50 text-[var(--color-text)]">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Buscador — solo en alumnos */}
        {tab === 'alumnos' && (
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={12}/>
            <input type="text" placeholder="Buscar alumno..."
              className="w-full h-9 pl-10 pr-3 bg-[var(--color-background)]/50 rounded-xl border border-[var(--color-border)] focus:border-[var(--color-primary)]/50 outline-none font-bold text-[11px] text-[var(--color-text)] shadow-inner transition-all placeholder:opacity-40"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
          </div>
        )}
      </div>

      {/* ── TABS ── */}
      <div className="flex p-1.5 bg-[var(--color-card)] rounded-[1.8rem] border border-[var(--color-border)] shadow-xl">
        {([
          { key:'asistencia', label:'Lista',   Icon: CheckCheck },
          { key:'alumnos',    label:'Alumnos', Icon: Users },
          { key:'resumen',    label:'Resumen', Icon: BarChart2 },
        ] as const).map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex-1 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
            style={tab === key
              ? { backgroundColor:'var(--color-primary)', color:'white', boxShadow:'0 4px 16px -4px var(--color-primary)50' }
              : { opacity:0.4, color:'var(--color-text)' }}>
            <Icon size={12} strokeWidth={2.5}/>{label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════
          TAB — ASISTENCIA
      ══════════════════════════════════════════════════ */}
      {tab === 'asistencia' && (
        <div className="space-y-3">

          {/* Banner ya registrada */}
          {!listaLoading && listaData?.ya_registrada && (
            <motion.div initial={{ opacity:0,y:-8 }} animate={{ opacity:1,y:0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
              style={{ background:'#22c55e10', borderColor:'#22c55e35' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'#22c55e20' }}>
                <Lock size={14} style={{ color:'#22c55e' }}/>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color:'#22c55e' }}>Lista registrada</p>
                <p className="text-[8px] font-bold opacity-60 text-[var(--color-text)]">Ya se pasó lista este día. Solo lectura.</p>
              </div>
            </motion.div>
          )}

          {/* Botones rápidos */}
          {!listaLoading && (listaData?.alumnos?.length ?? 0) > 0 && !listaData?.ya_registrada && (
            <div className="flex gap-2">
              <button onClick={() => marcarTodos(true)}
                className="flex-1 h-9 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-1.5"
                style={{ background:'#22c55e15', borderColor:'#22c55e35', color:'#22c55e' }}>
                <CheckCircle2 size={12}/> Todos presentes
              </button>
              <button onClick={() => marcarTodos(false)}
                className="flex-1 h-9 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-1.5"
                style={{ background:'#ef444415', borderColor:'#ef444435', color:'#ef4444' }}>
                <XCircle size={12}/> Todos ausentes
              </button>
            </div>
          )}

          {/* Lista */}
          {listaLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-[var(--color-primary)]" size={32}/></div>
          ) : (listaData?.alumnos?.length ?? 0) === 0 ? (
            <div className="py-20 text-center opacity-30">
              <Users size={40} className="mx-auto mb-3"/>
              <p className="text-xs font-black uppercase tracking-widest text-[var(--color-text)]">Sin alumnos asignados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(listaData?.alumnos || []).map((alumno, i) => {
                const presente   = local[alumno.idalumno] ?? true;
                const noReg      = alumno.presente === null && !dirty;
                const hex        = getBeltHex(alumno.cinta_color);
                const yaRegistrada = listaData?.ya_registrada ?? false;
                return (
                  <motion.div key={alumno.idalumno}
                    initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.02 }}
                    onClick={() => !yaRegistrada && toggle(alumno.idalumno)}
                    className="relative flex items-center gap-3 p-3 rounded-[1.5rem] border transition-all select-none"
                    style={{
                      background: presente ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
                      borderColor: presente ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)',
                      cursor: yaRegistrada ? 'default' : 'pointer',
                      opacity: yaRegistrada ? 0.85 : 1,
                    }}>
                    <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full opacity-40" style={{ backgroundColor: hex }}/>

                    {/* Foto */}
                    <div className="relative flex-shrink-0 ml-1">
                      <div className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center border-2"
                        style={{ borderColor: presente ? '#22c55e50' : '#ef444450', background:'var(--color-background)' }}>
                        {alumno.foto
                          ? <img src={alumno.foto} className="w-full h-full object-cover" alt=""/>
                          : <span className="text-base font-black" style={{ color:'var(--color-text-muted)' }}>{alumno.nombres.charAt(0)}</span>
                        }
                      </div>
                      {/* Pastilla cinta sobre la foto */}
                      <div className="absolute -bottom-1 -right-1 border-2 rounded shadow-lg z-10 overflow-hidden" style={{ borderColor:'var(--color-background)' }}>
                        <MiniCintaBelt
                          colorName={(alumno as AlumnoDia & { cinta_stripe?: string }).cinta_stripe ? alumno.cinta_color : alumno.cinta_color}
                          stripeName={(alumno as AlumnoDia & { cinta_stripe?: string }).cinta_stripe}
                        />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-black uppercase italic tracking-tighter truncate leading-none text-[var(--color-text)] mb-1">
                        {alumno.nombres} {alumno.apellidopaterno}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black uppercase tracking-wide"
                          style={{ color: hex === '#f8f8f8' ? 'var(--color-text-muted)' : hex }}>
                          {alumno.cinta_nivel || '—'}
                        </span>
                        {noReg && (
                          <span className="flex items-center gap-0.5 text-[7px] font-black uppercase text-[var(--color-text-muted)] opacity-50">
                            <Clock size={8}/> sin registrar
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Toggle */}
                    <motion.div animate={{ scale: presente ? 1 : 0.9 }}
                      className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: presente ? '#22c55e20' : '#ef444420', border:`1.5px solid ${presente ? '#22c55e50' : '#ef444450'}` }}>
                      {presente
                        ? <CheckCircle2 size={20} style={{ color:'#22c55e' }} strokeWidth={2.5}/>
                        : <XCircle     size={20} style={{ color:'#ef4444' }} strokeWidth={2.5}/>
                      }
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Botón guardar sticky */}
          {!listaLoading && (listaData?.alumnos?.length ?? 0) > 0 && !listaData?.ya_registrada && (
            <div className="sticky bottom-4 pt-2">
              <motion.button whileTap={{ scale:0.97 }} onClick={handleGuardar} disabled={saving}
                className="w-full h-14 rounded-[2rem] flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest text-white shadow-2xl disabled:opacity-60"
                style={{ background:'var(--color-primary)', boxShadow:'0 8px 32px -8px var(--color-primary)80' }}>
                {saving ? <><Loader2 size={20} className="animate-spin"/> Guardando...</> : <><Save size={20}/> Guardar Lista</>}
              </motion.button>
              {dirty && <p className="text-center text-[8px] font-black uppercase tracking-widest opacity-40 mt-2 text-[var(--color-text)]">Cambios sin guardar</p>}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB — ALUMNOS (CRUD)
      ══════════════════════════════════════════════════ */}
      {tab === 'alumnos' && (
        <div className="space-y-2.5">
          {aluLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-[var(--color-primary)]" size={32}/></div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center opacity-30">
              <Users size={40} className="mx-auto mb-3"/>
              <p className="text-xs font-black uppercase tracking-widest text-[var(--color-text)]">{searchTerm ? 'Sin coincidencias' : 'Sin alumnos'}</p>
            </div>
          ) : filtered.map((alumno: any, i: number) => {
            const beltInfo     = getCintaInfo(alumno.idgradoactual);
            const beltColorName = beltInfo?.color || 'Blanca';
            const hex          = getBeltHex(beltColorName);
            const tieneDeuda   = (alumno.total_deuda || 0) > 0;
            return (
              <motion.div key={alumno.idalumno} layout
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.02 }}
                className={`relative bg-[var(--color-card)]/40 backdrop-blur-xl p-3 rounded-[1.8rem] border border-[var(--color-border)] shadow-xl overflow-hidden transition-all ${tieneDeuda ? 'border-red-500/20' : ''}`}>

                <div className="absolute left-0 top-0 bottom-0 w-[4px] opacity-30" style={{ backgroundColor: hex }}/>

                <div className="flex items-center gap-3 ml-1">
                  {/* Foto */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-black/20 border-[3px] overflow-hidden flex items-center justify-center"
                      style={{ borderColor: hex, boxShadow:`0 0 10px -2px ${hex}44` }}>
                      {alumno.fotoalumno
                        ? <img src={alumno.fotoalumno} className="w-full h-full object-cover" alt=""/>
                        : <UserIcon size={20} className="text-[var(--color-text-muted)] opacity-30"/>}
                    </div>
                    <div className="absolute -bottom-1 -right-1 border-2 rounded-md shadow-lg z-20 overflow-hidden" style={{ borderColor:'var(--color-background)' }}>
                      <MiniCintaBelt colorName={beltColorName} stripeName={beltInfo?.color_stripe}/>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-[13px] font-black uppercase italic tracking-tighter text-[var(--color-text)] truncate leading-none">
                        {alumno.nombres} {alumno.apellidopaterno}
                      </h3>
                      {tieneDeuda && (
                        <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded-md text-[6px] font-black border border-red-500/20 animate-pulse flex-shrink-0">
                          ${alumno.total_deuda}
                        </span>
                      )}
                    </div>

                    {beltInfo && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <MiniCintaBelt colorName={beltColorName} stripeName={beltInfo?.color_stripe}/>
                        <span className="text-[8px] font-black uppercase tracking-wide"
                          style={{ color: hex === '#f8f8f8' ? 'var(--color-text-muted)' : hex }}>
                          {beltInfo.nivelkupdan}
                          {beltInfo.color_stripe && <span className="opacity-60"> / {beltInfo.color_stripe}</span>}
                        </span>
                      </div>
                    )}

                    <span className="text-[8px] font-bold flex items-center gap-1 text-[var(--color-text-muted)]">
                      <Phone size={8} className="text-emerald-500 flex-shrink-0"/>
                      {alumno.telefonocontacto || 'S/T'}
                    </span>
                  </div>

                  {/* Botones */}
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => handleOpenDetail(alumno.idalumno)} title="Ver"
                      className="p-2 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] text-[var(--color-primary)] active:scale-90 transition-all hover:bg-[var(--color-primary)] hover:text-white">
                      <Eye size={13}/>
                    </button>
                    <button onClick={() => handleOpenEdit(alumno)} title="Editar"
                      className="p-2 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] text-emerald-500 active:scale-90 transition-all hover:bg-emerald-500 hover:text-white">
                      <Edit3 size={13}/>
                    </button>
                    <button onClick={() => handleOpenPhoto(alumno)} title="Foto"
                      className="p-2 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] text-orange-400 active:scale-90 transition-all hover:bg-orange-500 hover:text-white">
                      <CameraIcon size={13}/>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB — RESUMEN
      ══════════════════════════════════════════════════ */}
      {tab === 'resumen' && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {[7,14,30,60].map(d => (
              <button key={d} onClick={() => setResDias(d)}
                className="h-8 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all"
                style={resDias === d
                  ? { background:'var(--color-primary)', color:'white', borderColor:'var(--color-primary)' }
                  : { background:'var(--color-card)', color:'var(--color-text-muted)', borderColor:'var(--color-border)' }}>
                {d} días
              </button>
            ))}
          </div>

          {resLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-[var(--color-primary)]" size={32}/></div>
          ) : resumen.length === 0 ? (
            <div className="py-20 text-center opacity-30">
              <TrendingUp size={40} className="mx-auto mb-3"/>
              <p className="text-xs font-black uppercase tracking-widest text-[var(--color-text)]">Sin datos</p>
            </div>
          ) : resumen.map((alumno, i) => {
            const hex      = getBeltHex(alumno.cinta_color);
            const pct      = alumno.porcentaje;
            const barColor = pct === null ? '#6b7280' : pct >= 80 ? '#22c55e' : pct >= 60 ? '#f97316' : '#ef4444';
            return (
              <motion.div key={alumno.idalumno}
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.02 }}
                className="bg-[var(--color-card)] rounded-[1.5rem] border border-[var(--color-border)] p-3 space-y-2">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border-2 overflow-hidden relative"
                    style={{ borderColor: hex+'60', background:'var(--color-background)' }}>
                    {alumno.foto
                      ? <img src={alumno.foto} className="w-full h-full object-cover" alt=""/>
                      : <span className="text-sm font-black" style={{ color:'var(--color-text-muted)' }}>{alumno.nombre_completo.charAt(0)}</span>
                    }
                    {/* Pastilla cinta */}
                    <div className="absolute -bottom-0.5 -right-0.5 border rounded overflow-hidden z-10" style={{ borderColor:'var(--color-background)' }}>
                      <MiniCintaBelt
                        colorName={alumno.cinta_color}
                        stripeName={(alumno as ResumenAlumno & { cinta_stripe?: string }).cinta_stripe}
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-black uppercase italic tracking-tighter truncate text-[var(--color-text)]">
                      {alumno.nombre_completo}
                    </p>
                    <span className="text-[8px] font-black uppercase tracking-wide"
                      style={{ color: hex === '#f8f8f8' ? 'var(--color-text-muted)' : hex }}>
                      {alumno.cinta_nivel || '—'}
                    </span>
                  </div>

                  {/* Badge % */}
                  {pct !== null ? (
                    <div className="px-2 py-0.5 rounded-full flex-shrink-0" style={{ background:`${barColor}18`, border:`1px solid ${barColor}35` }}>
                      <span className="text-[9px] font-black" style={{ color:barColor }}>{pct}%</span>
                    </div>
                  ) : (
                    <span className="text-[8px] opacity-30 font-bold text-[var(--color-text)]">—</span>
                  )}
                </div>

                {pct !== null && (
                  <div className="space-y-1">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'var(--color-background)' }}>
                      <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:0.6, delay:i*0.02 }}
                        className="h-full rounded-full" style={{ backgroundColor: barColor }}/>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[7px] font-bold opacity-40 text-[var(--color-text)]">{alumno.presentes}✓ · {alumno.ausentes}✗</span>
                      <span className="text-[7px] font-bold opacity-40 text-[var(--color-text)]">{alumno.total_dias} días</span>
                    </div>
                  </div>
                )}
      </motion.div>
            );
          })}
        </div>
      )}

    </div>

    {/* ══════════════════════════════════════════════════
        MODAL ALUMNOS (CRUD)
    ══════════════════════════════════════════════════ */}
    <AnimatePresence>
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => { stopCamera(); setIsModalOpen(false); }}/>
          <motion.div
            initial={{ scale:0.9, opacity:0, y:30 }} animate={{ scale:1, opacity:1, y:0 }} exit={{ scale:0.9, opacity:0, y:30 }}
            className="relative w-full max-w-xl bg-[var(--color-card)] rounded-[2.5rem] border border-[var(--color-border)] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

            {/* Header modal */}
            <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] p-4 text-white flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3.5 text-left">
                <div className="p-2.5 bg-white/15 rounded-xl border border-white/10">
                  {isEditing ? <Edit3 size={18}/> : step === 'detail' ? <GraduationCap size={18}/> : <UserPlus size={18}/>}
                </div>
                <div>
                  <h3 className="text-base font-black italic uppercase tracking-tighter leading-none">
                    {isEditing ? 'Actualizar Perfil' : step === 'detail' ? 'Expediente' : 'Nueva Inscripción'}
                  </h3>
                  <p className="text-[6px] font-black uppercase tracking-[0.3em] opacity-70 mt-1">TKW SYSTEM</p>
                </div>
              </div>
              <button onClick={() => { stopCamera(); setIsModalOpen(false); }} className="p-1.5 bg-black/20 rounded-full">
                <X size={16}/>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 text-left">

              {/* PASO: FORM */}
              {step === 'form' && (
                <form onSubmit={handleSave} className="space-y-8 pb-10">

                  {/* Sección identidad */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[var(--color-primary)] opacity-80 font-black italic">
                      <UserIcon size={14}/><span className="text-[9px] uppercase tracking-[0.2em]">Identidad Marcial</span>
                    </div>
                    <InputField label="Nombres" name="nombres" value={formData.nombres} onChange={handleInputChange} error={errors.nombres} required placeholder="Juan Román"/>
                    <div className="grid grid-cols-2 gap-4">
                      <InputField label="Apellido Paterno" name="apellidopaterno" value={formData.apellidopaterno} onChange={handleInputChange} error={errors.apellidopaterno} required/>
                      <InputField label="Apellido Materno" name="apellidomaterno" value={formData.apellidomaterno} onChange={handleInputChange} placeholder="Opcional"/>
                    </div>

                    {/* Selector de cinta con preview */}
                    <div className="space-y-1">
                      <label className="text-[7px] font-black uppercase ml-2 text-[var(--color-text-muted)] tracking-widest">Grado Dojo Actual</label>
                      {formData.idgradoactual && (() => {
                        const sel = cintas.find((c: any) => c.idgrado === Number(formData.idgradoactual));
                        return sel ? (
                          <div className="flex items-center gap-2 px-3 py-1.5 mb-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)]/50">
                            <MiniCintaBelt colorName={sel.color} stripeName={sel.color_stripe}/>
                            <span className="text-[9px] font-black uppercase tracking-wider"
                              style={{ color: getBeltHex(sel.color) === '#f8f8f8' ? 'var(--color-text-muted)' : getBeltHex(sel.color) }}>
                              {sel.nivelkupdan}
                            </span>
                            {sel.color_stripe && <span className="text-[8px] font-bold text-[var(--color-text-muted)]">· franja {sel.color_stripe}</span>}
                          </div>
                        ) : null;
                      })()}
                      <select required
                        className="w-full h-11 px-4 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none font-black text-[9px] uppercase text-[var(--color-text)] appearance-none cursor-pointer shadow-inner"
                        value={formData.idgradoactual} onChange={e => handleInputChange('idgradoactual', e.target.value)}>
                        {cintas.map((c: any) => (
                          <option key={c.idgrado} value={c.idgrado}>
                            {c.nivelkupdan} — {c.color}{c.color_stripe ? ` / ${c.color_stripe}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {isEditing && (
                      <div className="space-y-1">
                        <label className="text-[7px] font-black uppercase ml-2 text-[var(--color-text-muted)] tracking-widest">Estatus</label>
                        <select className="w-full h-11 px-4 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none font-black text-[9px] uppercase text-[var(--color-text)] appearance-none cursor-pointer shadow-inner"
                          value={formData.estatus} onChange={e => handleInputChange('estatus', e.target.value)}>
                          <option value={1}>ACTIVO</option>
                          <option value={0}>INACTIVO</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Sección familia — solo en alta */}
                  {!isEditing && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-2 text-[var(--color-primary)] opacity-80 font-black italic">
                        <Mail size={14}/><span className="text-[9px] uppercase tracking-[0.2em]">Familia y Avisos</span>
                      </div>
                      <InputField label="F. Nacimiento" name="fechanacimiento" type="date" value={formData.fechanacimiento} onChange={handleInputChange} error={errors.fechanacimiento} required/>
                      <InputField label="Email del Tutor" name="correotutor" type="email" value={formData.correotutor} onChange={handleInputChange} error={errors.correotutor} required placeholder="tutor@dominio.com"/>
                      <div className="grid grid-cols-2 gap-4">
                        <InputField label="Nombre Tutor" name="nombretutor" value={formData.nombretutor} onChange={handleInputChange} error={errors.nombretutor} required/>
                        <InputField label="WhatsApp" name="telefonocontacto" maxLength={10} value={formData.telefonocontacto} onChange={handleInputChange} error={errors.telefonocontacto} required placeholder="10 dígitos"/>
                      </div>
                      <InputField label="Domicilio" name="direcciondomicilio" value={formData.direcciondomicilio} onChange={handleInputChange} error={errors.direcciondomicilio} required placeholder="Calle, número, colonia"/>
                      <div className="grid grid-cols-2 gap-4">
                        <InputField label="Contacto Emergencia" name="contacto_emergencia_nombre" value={formData.contacto_emergencia_nombre} onChange={handleInputChange} error={errors.contacto_emergencia_nombre} required/>
                        <InputField label="Tel. Emergencia" name="contacto_emergencia_tel" maxLength={10} value={formData.contacto_emergencia_tel} onChange={handleInputChange} error={errors.contacto_emergencia_tel} required/>
                      </div>
                    </div>
                  )}

                  <motion.button whileTap={{ scale:0.97 }} type="submit" disabled={savingAlu}
                    className="w-full h-14 text-white font-black rounded-[2rem] flex items-center justify-center gap-3 text-sm uppercase tracking-widest disabled:opacity-50"
                    style={{ background:'var(--color-primary)', boxShadow:'0 8px 24px -8px var(--color-primary)60' }}>
                    {savingAlu ? <><Loader2 className="animate-spin" size={20}/> Guardando...</> : <><Save size={20}/> {isEditing ? 'Actualizar' : 'Registrar'}</>}
                  </motion.button>
                </form>
              )}

              {/* PASO: DETAIL */}
              {step === 'detail' && selectedAlumno && (
                <div className="space-y-5 pb-6">
                  {/* Cabecera alumno */}
                  <div className="flex items-center gap-4 p-4 rounded-3xl border border-[var(--color-border)]" style={{ background:'var(--color-background)' }}>
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-4 flex-shrink-0"
                      style={{ borderColor: getBeltHex(getCintaInfo(selectedAlumno.idgradoactual)?.color) }}>
                      {selectedAlumno.fotoalumno
                        ? <img src={selectedAlumno.fotoalumno} className="w-full h-full object-cover" alt=""/>
                        : <div className="w-full h-full flex items-center justify-center" style={{ background:'var(--color-card)' }}>
                            <UserIcon size={28} className="opacity-30"/>
                          </div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-black uppercase italic tracking-tighter text-[var(--color-text)] leading-none">
                        {selectedAlumno.nombres} {selectedAlumno.apellidopaterno}
                      </h3>
                      {(() => {
                        const ci = getCintaInfo(selectedAlumno.idgradoactual);
                        return ci ? (
                          <div className="flex items-center gap-2 mt-2">
                            <MiniCintaBelt colorName={ci.color} stripeName={ci.color_stripe}/>
                            <span className="text-[9px] font-black uppercase"
                              style={{ color: getBeltHex(ci.color) === '#f8f8f8' ? 'var(--color-text-muted)' : getBeltHex(ci.color) }}>
                              {ci.nivelkupdan}{ci.color_stripe ? ` / ${ci.color_stripe}` : ''}
                            </span>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>

                  {/* Datos de contacto */}
                  <div className="bg-[var(--color-card)] p-5 rounded-[2rem] border border-[var(--color-border)] space-y-4">
                    <div className="flex items-center gap-2 text-[var(--color-primary)] font-black uppercase text-[9px] tracking-widest">
                      <UserIcon size={13}/> Identidad y Contacto
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><p className="text-[7px] font-black uppercase text-[var(--color-text-muted)] opacity-50">Nacimiento</p><p className="text-xs font-bold text-[var(--color-text)]">{selectedAlumno.fechanacimiento || '---'}</p></div>
                      <div><p className="text-[7px] font-black uppercase text-[var(--color-text-muted)] opacity-50">WhatsApp</p><p className="text-xs font-bold text-[var(--color-text)]">{selectedAlumno.telefonocontacto || 'S/T'}</p></div>
                      <div><p className="text-[7px] font-black uppercase text-[var(--color-text-muted)] opacity-50">Tutor</p><p className="text-xs font-bold text-[var(--color-text)] italic">{selectedAlumno.nombretutor || 'No registrado'}</p></div>
                      <div><p className="text-[7px] font-black uppercase text-[var(--color-text-muted)] opacity-50">Email tutor</p><p className="text-[10px] font-bold text-[var(--color-text)] truncate">{selectedAlumno.correotutor || '---'}</p></div>
                      <div className="col-span-2 border-t border-white/5 pt-3">
                        <p className="text-[7px] font-black uppercase text-[var(--color-text-muted)] opacity-50">Domicilio</p>
                        <p className="text-[10px] font-bold text-[var(--color-text)] opacity-80 leading-relaxed">
                          <MapPin size={10} className="inline mr-1 text-red-500"/>{selectedAlumno.direcciondomicilio || 'No especificado'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Emergencia */}
                  <div className="bg-[var(--color-card)] p-5 rounded-[2rem] border border-[var(--color-border)] space-y-4">
                    <div className="flex items-center gap-2 text-red-500 font-black uppercase text-[9px] tracking-widest"><Heart size={13}/> Emergencia y Salud</div>
                    <div className="bg-red-500/5 p-4 rounded-2xl border border-red-500/10">
                      <p className="text-[7px] font-black uppercase text-red-500 opacity-60 mb-1">En caso de Emergencia</p>
                      <p className="text-sm font-black text-red-500 uppercase">{selectedAlumno.contacto_emergencia_nombre || 'S/D'}</p>
                      <p className="text-lg font-black text-red-500 mt-1 flex items-center gap-2"><PhoneForwarded size={16}/> {selectedAlumno.contacto_emergencia_tel || '---'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><p className="text-[7px] font-black uppercase text-[var(--color-text-muted)] opacity-50">Tipo Sangre</p><p className="text-sm font-black text-red-500">{selectedAlumno.tipo_sangre || 'S/D'}</p></div>
                      <div><p className="text-[7px] font-black uppercase text-[var(--color-text-muted)] opacity-50">Seguro</p><p className="text-[10px] font-bold uppercase">{selectedAlumno.seguro_medico}: {selectedAlumno.nss_o_poliza || 'S/N'}</p></div>
                      <div className="col-span-2 border-t border-white/5 pt-3">
                        <p className="text-[7px] font-black uppercase text-[var(--color-text-muted)] opacity-50">Alergias / Padecimientos</p>
                        <p className="text-xs font-bold italic text-[var(--color-text)]">{selectedAlumno.alergias} / {selectedAlumno.padecimientos_cronicos}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO: PHOTO CHOICE */}
              {step === 'photo_choice' && (
                <div className="py-10 text-center space-y-10">
                  <div className="grid grid-cols-2 gap-6">
                    <button onClick={() => fileRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-4 p-10 bg-[var(--color-background)] rounded-[3rem] border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all active:scale-95">
                      <ImagePlus className="text-[var(--color-primary)]" size={32}/>
                      <span className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-widest">Galería</span>
                    </button>
                    <button onClick={startCamera}
                      className="flex flex-col items-center justify-center gap-4 p-10 bg-[var(--color-background)] rounded-[3rem] border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all active:scale-95">
                      <CameraIcon className="text-[var(--color-primary)]" size={32}/>
                      <span className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-widest">Cámara</span>
                    </button>
                  </div>
                  <input type="file" ref={fileRef} className="hidden" accept="image/*"
                    onChange={e => { const f = e.target.files?.[0]; if (f) { setTempFile(f); setStep('preview'); } }}/>
                  <button onClick={() => setIsModalOpen(false)}
                    className="text-[10px] font-black uppercase text-[var(--color-text-muted)] opacity-50 tracking-widest">
                    Omitir por ahora
                  </button>
                </div>
              )}

              {/* PASO: CAMERA */}
              {step === 'camera' && (
                <div className="space-y-10 text-center py-4 flex flex-col items-center">
                  <div className="w-64 h-64 bg-black rounded-[4.5rem] border-4 border-[var(--color-primary)] overflow-hidden relative shadow-2xl scale-x-[-1]">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"/>
                  </div>
                  <button onClick={capture}
                    className="w-16 h-16 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 border-8 border-[var(--color-card)]">
                    <CameraIcon size={24}/>
                  </button>
                </div>
              )}

              {/* PASO: PREVIEW */}
              {step === 'preview' && (
                <div className="text-center space-y-10 py-6 flex flex-col items-center">
                  <div className="w-56 h-56 rounded-[4rem] border-4 border-[var(--color-primary)] overflow-hidden shadow-2xl relative">
                    {tempFile && <img src={URL.createObjectURL(tempFile)} className="w-full h-full object-cover" alt="Preview"/>}
                    {savingAlu && <div className="absolute inset-0 bg-black/70 flex items-center justify-center"><Loader2 className="animate-spin text-white" size={32}/></div>}
                  </div>
                  <div className="flex flex-col gap-4 w-full px-10">
                    <motion.button whileTap={{ scale:0.95 }} onClick={confirmUpload} disabled={savingAlu}
                      className="w-full h-16 bg-[var(--color-text)] text-[var(--color-card)] font-black rounded-[2.5rem] flex items-center justify-center gap-3 shadow-2xl">
                      <CheckCircle2 size={24} className="text-[var(--color-primary)]"/>
                      <span className="text-sm uppercase italic tracking-tighter font-black">Actualizar Foto</span>
                    </motion.button>
                    <button onClick={() => setStep('photo_choice')} disabled={savingAlu}
                      className="text-[10px] font-black uppercase text-[var(--color-text-muted)] opacity-60 flex items-center justify-center gap-2">
                      <RotateCcw size={14}/> Reintentar
                    </button>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
};

export default PaseListaView;