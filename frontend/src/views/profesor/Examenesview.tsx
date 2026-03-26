// ============================================================
//  src/views/profesor/ExamenesView.tsx
//  Gestión de Exámenes de Grado
//  Tabs: Lista | Detalle+Calificación
// ============================================================

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, Plus, X, Loader2, CheckCircle2, AlertCircle,
  Calendar, MapPin, DollarSign, User as UserIcon, FileText,
  Upload, Download, Eye, Trash2, UserPlus, CheckCheck,
  XCircle, Clock, Edit3, RefreshCw, Save, Users,
  ChevronLeft, Lock, Unlock, Star,
} from 'lucide-react';

import {
  examenesService,
  type Examen, type ExamenDetalle, type AlumnoExamen,
} from '../../services/examenes.service';
import { alumnoService }  from '../../services/alumno.service';
import { cintasService }  from '../../services/cintas.service';

// ─────────────────────────────────────────────────────────────
//  BELT COLORS
// ─────────────────────────────────────────────────────────────

const BELT_COLORS: Record<string, string> = {
  "Blanca": "#f8f8f8",  "Crema": "#fffde7",    "Marfil": "#fffff0",
  "Amarilla": "#facc15","Dorada": "#d97706",    "Naranja": "#f97316",
  "Verde": "#16a34a",   "Verde Claro": "#4ade80","Verde Oscuro": "#14532d",
  "Celeste": "#38bdf8", "Azul": "#2563eb",      "Azul Marino": "#1e40af", "Cian": "#06b6d4",
  "Coral": "#ff6b6b",   "Roja": "#dc2626",      "Guinda": "#881337",  "Granate": "#991b1b",
  "Lila": "#c084fc",    "Morada": "#7c3aed",    "Purpura": "#9333ea",
  "Rosa": "#ec4899",    "Fucsia": "#db2777",
  "Cafe Claro": "#a16207","Cafe": "#7c2d12",    "Vino": "#7f1d1d",
  "Gris": "#6b7280",    "Plateada": "#d1d5db",  "Negra": "#111111",
  "Marrón": "#7c2d12",  "Café": "#7c2d12",      "Negro": "#111111",
};
function getBeltHex(c?: string | null) {
  if (!c) return '#9ca3af';
  if (c.startsWith('#')) return c;
  const d = BELT_COLORS[c]; if (d) return d;
  const k = Object.keys(BELT_COLORS).find(k => k.toLowerCase() === c.toLowerCase());
  return k ? BELT_COLORS[k] : '#888888';
}
function MiniCintaBelt({ colorName, stripeName }: { colorName?: string | null; stripeName?: string | null }) {
  const bg = getBeltHex(colorName); const stripe = stripeName ? getBeltHex(stripeName) : null;
  return (
    <div className="relative w-10 h-3 rounded-sm overflow-hidden border border-white/10 shadow-inner shrink-0" style={{ background: bg }}>
      {stripe && <div className="absolute right-1 top-0 bottom-0 w-[20%]" style={{ background: stripe }}/>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

function formatFecha(iso?: string) {
  if (!iso) return '—';
  const [y,m,d] = iso.split('-');
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${d} ${meses[parseInt(m)-1]} ${y}`;
}
function esPasado(iso?: string) {
  if (!iso) return false;
  return new Date(iso + 'T23:59:59') < new Date();
}

// ─────────────────────────────────────────────────────────────
//  INPUT FIELD
// ─────────────────────────────────────────────────────────────

const InputField: React.FC<{
  label: string; name: string; value: string;
  onChange: (n: string, v: string) => void;
  type?: string; required?: boolean; placeholder?: string;
}> = ({ label, name, value, onChange, type='text', required, placeholder }) => (
  <div className="space-y-1">
    <label className="text-[7px] font-black uppercase ml-2 text-[var(--color-text-muted)] tracking-widest flex items-center gap-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input type={type} placeholder={placeholder}
      className="w-full h-11 px-4 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none font-bold text-[11px] text-[var(--color-text)] shadow-inner transition-all placeholder:opacity-20"
      value={value} onChange={e => onChange(name, e.target.value)}/>
  </div>
);

// ─────────────────────────────────────────────────────────────
//  CARD EXAMEN
// ─────────────────────────────────────────────────────────────

const CardExamen: React.FC<{ examen: Examen; onClick: () => void; onEdit: () => void; onDelete: () => void }> = ({ examen, onClick, onEdit, onDelete }) => {
  const pasado    = esPasado(examen.fecha_programada);
  const tienePDF  = !!examen.archivo_pdf;
  const progreso  = examen._inscritos ? Math.round(((examen._calificados || 0) / examen._inscritos) * 100) : 0;

  return (
    <motion.div layout initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }}
      className="bg-[var(--color-card)]/60 backdrop-blur-xl rounded-[2rem] border border-[var(--color-border)] p-4 space-y-3 shadow-xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full ${pasado ? 'bg-slate-500/20 text-slate-400' : 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'}`}>
              {pasado ? 'Realizado' : 'Próximo'}
            </span>
            {tienePDF && (
              <span className="text-[7px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center gap-1">
                <FileText size={8}/> PDF
              </span>
            )}
          </div>
          <h3 className="text-[14px] font-black uppercase italic tracking-tighter text-[var(--color-text)] leading-tight">
            {examen.nombre_examen}
          </h3>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={e => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 rounded-xl border border-[var(--color-border)] text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all">
            <Edit3 size={12}/>
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded-xl border border-[var(--color-border)] text-red-400 hover:bg-red-500 hover:text-white transition-all">
            <Trash2 size={12}/>
          </button>
        </div>
      </div>

      {/* Datos */}
      <div className="grid grid-cols-2 gap-2 text-[var(--color-text-muted)]">
        <div className="flex items-center gap-1.5">
          <Calendar size={10} className="text-[var(--color-primary)] flex-shrink-0"/>
          <span className="text-[9px] font-bold truncate">{formatFecha(examen.fecha_programada)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <DollarSign size={10} className="text-emerald-500 flex-shrink-0"/>
          <span className="text-[9px] font-bold">${Number(examen.costo_examen || 0).toLocaleString('es-MX')}</span>
        </div>
        {examen.lugar && (
          <div className="flex items-center gap-1.5 col-span-2">
            <MapPin size={10} className="text-red-400 flex-shrink-0"/>
            <span className="text-[9px] font-bold truncate">{examen.lugar}</span>
          </div>
        )}
        {examen.sinodal && (
          <div className="flex items-center gap-1.5 col-span-2">
            <UserIcon size={10} className="text-purple-400 flex-shrink-0"/>
            <span className="text-[9px] font-bold truncate">{examen.sinodal}</span>
          </div>
        )}
      </div>

      {/* KPIs */}
      {(examen._inscritos || 0) > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[7px] font-black uppercase tracking-widest opacity-50 text-[var(--color-text)]">
            <span>{examen._inscritos} inscritos</span>
            <span>{progreso}% calificados</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'var(--color-background)' }}>
            <motion.div initial={{ width:0 }} animate={{ width:`${progreso}%` }} transition={{ duration:0.6 }}
              className="h-full rounded-full bg-[var(--color-primary)]"/>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {[
              { label:'Inscritos', val: examen._inscritos||0,   color:'var(--color-text)' },
              { label:'Pagados',   val: examen._pagados||0,     color:'#22c55e' },
              { label:'Pendiente', val: examen._pendientes||0,  color:'#f97316' },
            ].map(({ label, val, color }) => (
              <div key={label} className="text-center py-1.5 rounded-xl" style={{ background:'var(--color-background)' }}>
                <p className="text-sm font-black leading-none" style={{ color }}>{val}</p>
                <p className="text-[6px] font-black uppercase tracking-widest opacity-40 text-[var(--color-text)] mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botón ver */}
      <button onClick={onClick}
        className="w-full h-9 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2"
        style={{ background:'var(--color-primary)15', borderColor:'var(--color-primary)40', color:'var(--color-primary)' }}>
        <Eye size={12}/> Ver Detalle
      </button>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
//  COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────

const ExamenesView: React.FC = () => {

  // ── Estado global ─────────────────────────────────────────
  const [examenes, setExamenes]     = useState<Examen[]>([]);
  const [loading, setLoading]       = useState(true);
  const [successMsg, setSuccessMsg] = useState<string|null>(null);
  const [errorMsg, setErrorMsg]     = useState<string|null>(null);
  const [view, setView]             = useState<'lista'|'detalle'>('lista');
  const [examenActivo, setExamenActivo] = useState<ExamenDetalle|null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // ── Estado: listas externas ───────────────────────────────
  const [todosAlumnos, setTodosAlumnos] = useState<any[]>([]);
  const [cintas, setCintas]             = useState<any[]>([]);

  // ── Modal crear/editar examen ─────────────────────────────
  const [modalForm, setModalForm]   = useState(false);
  const [editando, setEditando]     = useState<Examen|null>(null);
  const [savingForm, setSavingForm] = useState(false);
  const [form, setForm] = useState({
    nombre_examen: '', fecha_programada: '', lugar: 'Dojo Central',
    costo_examen: '0', sinodal: '',
  });

  // ── Modal inscribir ───────────────────────────────────────
  const [modalInscribir, setModalInscribir] = useState(false);
  const [selAlumnos, setSelAlumnos]         = useState<number[]>([]);
  const [inscribiendo, setInscribiendo]     = useState(false);
  const [buscarAlu, setBuscarAlu]           = useState('');

  // ── Modal calificar ───────────────────────────────────────
  const [modalCalificar, setModalCalificar]   = useState<AlumnoExamen|null>(null);
  const [calificacion, setCalificacion]       = useState('');
  const [gradoNuevo, setGradoNuevo]           = useState<number|''>('');
  const [notasCal, setNotasCal]               = useState('');
  const [savingCal, setSavingCal]             = useState(false);

  // ── Modal PDF ─────────────────────────────────────────────
  const [modalPdf, setModalPdf]   = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (successMsg) { const t = setTimeout(() => setSuccessMsg(null), 3000); return () => clearTimeout(t); } }, [successMsg]);

  // ── Carga ─────────────────────────────────────────────────
  const loadExamenes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await examenesService.listar();
      setExamenes(data);
    } catch { setErrorMsg('Error al cargar exámenes.'); }
    finally { setLoading(false); }
  }, []);

  const loadExtras = useCallback(async () => {
    try {
      const [aluRes, cintaRes] = await Promise.all([
        alumnoService.getAlumnos(),
        cintasService.listarGrados(),
      ]);
      setTodosAlumnos(aluRes || []);
      setCintas((cintaRes || []).sort((a: any, b: any) => (a.orden||99) - (b.orden||99)));
    } catch { /**/ }
  }, []);

  useEffect(() => { loadExamenes(); loadExtras(); }, [loadExamenes, loadExtras]);

  const abrirDetalle = async (idexamen: number) => {
    setView('detalle'); setLoadingDetalle(true);
    try {
      const d = await examenesService.detalle(idexamen);
      setExamenActivo(d);
    } catch { setErrorMsg('Error al cargar detalle.'); }
    finally { setLoadingDetalle(false); }
  };

  const recargarDetalle = async () => {
    if (!examenActivo) return;
    setLoadingDetalle(true);
    try {
      const d = await examenesService.detalle(examenActivo.idexamen);
      setExamenActivo(d);
    } finally { setLoadingDetalle(false); }
  };

  // ── CRUD Examen ───────────────────────────────────────────
  const abrirCrear = () => {
    setEditando(null);
    setForm({ nombre_examen:'', fecha_programada:'', lugar:'Dojo Central', costo_examen:'0', sinodal:'' });
    setModalForm(true);
  };
  const abrirEditar = (e: Examen) => {
    setEditando(e);
    setForm({
      nombre_examen: e.nombre_examen,
      fecha_programada: e.fecha_programada,
      lugar: e.lugar || 'Dojo Central',
      costo_examen: String(e.costo_examen || 0),
      sinodal: e.sinodal || '',
    });
    setModalForm(true);
  };
  const handleGuardarForm = async () => {
    if (!form.nombre_examen.trim() || !form.fecha_programada) {
      setErrorMsg('Nombre y fecha son obligatorios.'); return;
    }
    setSavingForm(true);
    try {
      const payload = {
        nombre_examen:    form.nombre_examen.trim(),
        fecha_programada: form.fecha_programada,
        lugar:            form.lugar || 'Dojo Central',
        costo_examen:     parseFloat(form.costo_examen) || 0,
        sinodal:          form.sinodal || undefined,
      };
      if (editando) {
        await examenesService.editar(editando.idexamen, payload);
        setSuccessMsg('Examen actualizado');
      } else {
        await examenesService.crear(payload);
        setSuccessMsg('Examen creado');
      }
      setModalForm(false);
      loadExamenes();
      if (examenActivo && editando?.idexamen === examenActivo.idexamen) recargarDetalle();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setErrorMsg(err?.response?.data?.detail ?? 'Error al guardar.');
    } finally { setSavingForm(false); }
  };

  const handleEliminar = async (e: Examen) => {
    if (!confirm(`¿Eliminar el examen "${e.nombre_examen}"?`)) return;
    try {
      await examenesService.eliminar(e.idexamen);
      setSuccessMsg('Examen eliminado');
      loadExamenes();
      if (view === 'detalle') setView('lista');
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { detail?: string } } };
      setErrorMsg(e2?.response?.data?.detail ?? 'Error al eliminar.');
    }
  };

  // ── Inscribir ─────────────────────────────────────────────
  const alumnosFiltrados = useMemo(() => {
    const yaInscritos = new Set((examenActivo?.alumnos || []).map(a => a.idalumno));
    return todosAlumnos.filter(a =>
      !yaInscritos.has(a.idalumno) &&
      `${a.nombres} ${a.apellidopaterno}`.toLowerCase().includes(buscarAlu.toLowerCase())
    );
  }, [todosAlumnos, examenActivo, buscarAlu]);

  const handleInscribir = async () => {
    if (!examenActivo || !selAlumnos.length) return;
    setInscribiendo(true);
    try {
      const res = await examenesService.inscribir(examenActivo.idexamen, selAlumnos);
      setSuccessMsg(res.mensaje);
      setModalInscribir(false); setSelAlumnos([]); setBuscarAlu('');
      recargarDetalle();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setErrorMsg(err?.response?.data?.detail ?? 'Error al inscribir.');
    } finally { setInscribiendo(false); }
  };

  const handleQuitarAlumno = async (idalumno: number) => {
    if (!examenActivo) return;
    if (!confirm('¿Quitar al alumno del examen?')) return;
    try {
      await examenesService.quitarAlumno(examenActivo.idexamen, idalumno);
      setSuccessMsg('Alumno quitado');
      recargarDetalle();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setErrorMsg(err?.response?.data?.detail ?? 'Error.');
    }
  };

  // ── Calificar ─────────────────────────────────────────────
  const abrirCalificar = (a: AlumnoExamen) => {
    setModalCalificar(a);
    setCalificacion(a.calificacion !== undefined ? String(a.calificacion) : '');
    setGradoNuevo(a.idgrado_nuevo || '');
    setNotasCal(a.notas || '');
  };

  const handleCalificar = async () => {
    if (!modalCalificar || !examenActivo) return;
    const cal = parseFloat(calificacion);
    if (isNaN(cal) || cal < 0 || cal > 10) { setErrorMsg('Calificación entre 0 y 10.'); return; }
    const aprueba = cal >= 6;
    if (aprueba && !gradoNuevo) { setErrorMsg('Selecciona el grado que obtiene.'); return; }
    setSavingCal(true);
    try {
      const res = await examenesService.calificar(examenActivo.idexamen, {
        idalumno: modalCalificar.idalumno,
        calificacion: cal,
        idgrado_nuevo: aprueba ? Number(gradoNuevo) : modalCalificar.idgrado_anterior,
        notas: notasCal || undefined,
        aprobado: aprueba,
      });
      setSuccessMsg(res.mensaje);
      setModalCalificar(null);
      recargarDetalle();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setErrorMsg(err?.response?.data?.detail ?? 'Error al calificar.');
    } finally { setSavingCal(false); }
  };

  // ── Upload PDF ────────────────────────────────────────────
  const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !examenActivo) return;
    setUploadingPdf(true);
    try {
      const res = await examenesService.subirPdf(examenActivo.idexamen, file);
      setSuccessMsg('PDF subido correctamente');
      setModalPdf(false);
      recargarDetalle();
      loadExamenes();
    } catch { setErrorMsg('Error al subir el PDF.'); }
    finally { setUploadingPdf(false); if (pdfInputRef.current) pdfInputRef.current.value = ''; }
  };

  // ──────────────────────────────────────────────────────────
  //  RENDER
  // ──────────────────────────────────────────────────────────
  return (
    <>
    <div className="space-y-4 text-[var(--color-text)] animate-in fade-in duration-500 pb-24">

      {/* Toasts */}
      <AnimatePresence>
        {successMsg && (
          <motion.div initial={{ opacity:0,y:-20 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-20 }}
            className="fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border border-green-500"
            style={{ backgroundColor:'#16a34a', color:'white' }}>
            <CheckCircle2 size={18}/><span className="text-sm font-black tracking-tight">{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {errorMsg && (
          <motion.div initial={{ opacity:0,y:-20 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-20 }}
            className="fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border border-red-500 max-w-sm"
            style={{ backgroundColor:'#dc2626', color:'white' }}>
            <AlertCircle size={18} className="flex-shrink-0"/>
            <span className="text-sm font-black flex-1">{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)}><X size={14}/></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <div className="bg-[var(--color-card)] backdrop-blur-2xl p-5 rounded-[2.5rem] border border-[var(--color-border)] shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {view === 'detalle' && (
              <button onClick={() => { setView('lista'); setExamenActivo(null); }}
                className="p-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-all">
                <ChevronLeft size={16}/>
              </button>
            )}
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background:'var(--color-primary)20', border:'1.5px solid var(--color-primary)40' }}>
              <GraduationCap size={22} style={{ color:'var(--color-primary)' }}/>
            </div>
            <div>
              <h2 className="text-xl font-black uppercase italic tracking-tighter leading-none text-[var(--color-text)]">
                {view === 'lista' ? 'Exámenes' : (examenActivo?.nombre_examen || 'Detalle')}
              </h2>
              <p className="text-[7px] font-black uppercase tracking-[0.4em] mt-1 opacity-40 text-[var(--color-text-muted)]">
                {view === 'lista' ? 'Gestión de Grados' : formatFecha(examenActivo?.fecha_programada)}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <motion.button whileTap={{ scale:0.88, rotate:-180 }} transition={{ duration:0.35 }}
              onClick={view === 'lista' ? loadExamenes : recargarDetalle}
              disabled={loading || loadingDetalle}
              className="h-9 w-9 flex items-center justify-center rounded-xl border transition-all"
              style={{ background:'var(--color-background)', borderColor:'var(--color-border)', color:'var(--color-text-muted)' }}>
              {(loading || loadingDetalle) ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14}/>}
            </motion.button>

            {view === 'lista' && (
              <motion.button whileTap={{ scale:0.95 }} onClick={abrirCrear}
                className="h-9 px-4 rounded-xl flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white"
                style={{ background:'var(--color-primary)' }}>
                <Plus size={13}/> Nuevo
              </motion.button>
            )}

            {view === 'detalle' && examenActivo && (
              <div className="flex gap-2">
                {/* Upload PDF */}
                <motion.button whileTap={{ scale:0.95 }} onClick={() => setModalPdf(true)}
                  className="h-9 px-3 rounded-xl flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest border transition-all"
                  style={{ background: examenActivo.archivo_pdf ? '#22c55e15' : 'var(--color-background)', borderColor: examenActivo.archivo_pdf ? '#22c55e40' : 'var(--color-border)', color: examenActivo.archivo_pdf ? '#22c55e' : 'var(--color-text-muted)' }}>
                  <Upload size={12}/> {examenActivo.archivo_pdf ? 'PDF ✓' : 'PDF'}
                </motion.button>

                {/* Ver/Descargar PDF */}
                {examenActivo.archivo_pdf && (
                  <a href={examenActivo.archivo_pdf} target="_blank" rel="noreferrer"
                    className="h-9 px-3 rounded-xl flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest border transition-all"
                    style={{ background:'var(--color-background)', borderColor:'var(--color-border)', color:'var(--color-text-muted)' }}>
                    <Download size={12}/> Ver
                  </a>
                )}

                {/* Inscribir */}
                <motion.button whileTap={{ scale:0.95 }} onClick={() => { setBuscarAlu(''); setSelAlumnos([]); setModalInscribir(true); }}
                  className="h-9 px-3 rounded-xl flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white"
                  style={{ background:'var(--color-primary)' }}>
                  <UserPlus size={12}/> Inscribir
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          VISTA: LISTA DE EXÁMENES
      ══════════════════════════════════════════════════ */}
      {view === 'lista' && (
        loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-[var(--color-primary)]" size={32}/></div>
        ) : examenes.length === 0 ? (
          <div className="py-20 text-center opacity-30">
            <GraduationCap size={48} className="mx-auto mb-3"/>
            <p className="text-xs font-black uppercase tracking-widest">Sin exámenes registrados</p>
            <button onClick={abrirCrear} className="mt-4 px-6 h-10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white" style={{ background:'var(--color-primary)' }}>
              Crear primer examen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {examenes.map(e => (
              <CardExamen key={e.idexamen} examen={e}
                onClick={() => abrirDetalle(e.idexamen)}
                onEdit={() => abrirEditar(e)}
                onDelete={() => handleEliminar(e)}/>
            ))}
          </div>
        )
      )}

      {/* ══════════════════════════════════════════════════
          VISTA: DETALLE DEL EXAMEN
      ══════════════════════════════════════════════════ */}
      {view === 'detalle' && (
        loadingDetalle ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-[var(--color-primary)]" size={32}/></div>
        ) : examenActivo ? (
          <div className="space-y-3">

            {/* Info del examen */}
            <div className="bg-[var(--color-card)] rounded-[2rem] border border-[var(--color-border)] p-4 grid grid-cols-2 gap-3">
              {[
                { icon: Calendar,   color:'var(--color-primary)', label:'Fecha',   val: formatFecha(examenActivo.fecha_programada) },
                { icon: DollarSign, color:'#22c55e',               label:'Costo',   val: `$${Number(examenActivo.costo_examen||0).toLocaleString('es-MX')}` },
                { icon: MapPin,     color:'#ef4444',               label:'Lugar',   val: examenActivo.lugar || '—' },
                { icon: UserIcon,   color:'#8b5cf6',               label:'Sinodal', val: examenActivo.sinodal || '—' },
              ].map(({ icon: Icon, color, label, val }) => (
                <div key={label} className="flex items-start gap-2">
                  <Icon size={12} style={{ color }} className="flex-shrink-0 mt-0.5"/>
                  <div>
                    <p className="text-[6px] font-black uppercase tracking-widest opacity-40 text-[var(--color-text)]">{label}</p>
                    <p className="text-[10px] font-black text-[var(--color-text)] truncate">{val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Lista de alumnos inscritos */}
            {examenActivo.alumnos.length === 0 ? (
              <div className="py-12 text-center opacity-30">
                <Users size={36} className="mx-auto mb-3"/>
                <p className="text-xs font-black uppercase tracking-widest">Sin alumnos inscritos</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[8px] font-black uppercase tracking-widest opacity-40 text-[var(--color-text)] px-1">
                  Alumnos inscritos ({examenActivo.alumnos.length})
                </p>
                {examenActivo.alumnos.map(a => {
                  const nombre     = `${a.alumnos?.nombres || ''} ${a.alumnos?.apellidopaterno || ''}`.trim();
                  const pagado     = a.pago_estatus === 1;
                  const sinPago    = a.pago_estatus === null;
                  const calificado = a.calificacion !== null && a.calificacion !== undefined;
                  const cinAnterior = a.grado_ant;
                  const cinNuevo   = a.grado_nvo;

                  return (
                    <motion.div key={a.idhistorial} layout
                      className="bg-[var(--color-card)]/60 rounded-[1.8rem] border border-[var(--color-border)] p-3 space-y-2">

                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 border-2"
                          style={{ borderColor: getBeltHex(cinAnterior?.color)+'60', background:'var(--color-background)' }}>
                          {a.alumnos?.fotoalumno
                            ? <img src={a.alumnos.fotoalumno} className="w-full h-full object-cover" alt=""/>
                            : <span className="text-sm font-black opacity-40">{nombre.charAt(0)}</span>
                          }
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-black uppercase italic tracking-tighter truncate text-[var(--color-text)]">{nombre}</p>
                          {/* Cintas: anterior → nuevo */}
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {cinAnterior && <MiniCintaBelt colorName={cinAnterior.color} stripeName={cinAnterior.color_stripe}/>}
                            {cinAnterior && <span className="text-[7px] opacity-50">→</span>}
                            {cinNuevo && cinNuevo.color !== cinAnterior?.color && (
                              <MiniCintaBelt colorName={cinNuevo.color} stripeName={cinNuevo.color_stripe}/>
                            )}
                            {cinAnterior && (
                              <span className="text-[7px] font-bold opacity-50 text-[var(--color-text)]">{cinAnterior.nivelkupdan}</span>
                            )}
                          </div>
                        </div>

                        {/* Estatus pago */}
                        <div className="flex-shrink-0">
                          {sinPago ? (
                            <span className="flex items-center gap-1 text-[7px] font-black uppercase px-2 py-1 rounded-full bg-slate-500/15 text-slate-400">
                              <Unlock size={8}/> Sin cargo
                            </span>
                          ) : pagado ? (
                            <span className="flex items-center gap-1 text-[7px] font-black uppercase px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400">
                              <CheckCheck size={8}/> Pagado
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[7px] font-black uppercase px-2 py-1 rounded-full bg-orange-500/15 text-orange-400">
                              <Clock size={8}/> Pendiente
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Calificación si ya tiene */}
                      {calificado && (
                        <div className="flex items-center gap-3 px-3 py-2 rounded-xl"
                          style={{ background: a.aprobado ? '#22c55e10' : '#ef444410', border:`1px solid ${a.aprobado ? '#22c55e30' : '#ef444430'}` }}>
                          <Star size={14} style={{ color: a.aprobado ? '#22c55e' : '#ef4444' }}/>
                          <span className="text-lg font-black" style={{ color: a.aprobado ? '#22c55e' : '#ef4444' }}>{a.calificacion}</span>
                          <span className="text-[8px] font-black uppercase tracking-widest opacity-60 text-[var(--color-text)]">
                            {a.aprobado ? 'Aprobado' : 'Reprobado'}
                          </span>
                          {a.notas && <span className="text-[8px] italic opacity-40 truncate text-[var(--color-text)]">{a.notas}</span>}
                        </div>
                      )}

                      {/* Acciones */}
                      <div className="flex gap-2">
                        {/* Calificar — bloqueado si no ha pagado */}
                        <button
                          onClick={() => (pagado || sinPago) ? abrirCalificar(a) : setErrorMsg('El alumno debe pagar antes de recibir calificación.')}
                          className="flex-1 h-8 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-1.5"
                          style={pagado || sinPago
                            ? { background:'var(--color-primary)15', borderColor:'var(--color-primary)40', color:'var(--color-primary)' }
                            : { background:'var(--color-background)', borderColor:'var(--color-border)', color:'var(--color-text-muted)', opacity:0.5 }
                          }>
                          {pagado || sinPago ? <><CheckCheck size={10}/> Calificar</> : <><Lock size={10}/> Sin pago</>}
                        </button>

                        <button onClick={() => handleQuitarAlumno(a.idalumno)}
                          disabled={calificado}
                          className="h-8 w-8 rounded-xl border border-[var(--color-border)] flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all disabled:opacity-30"
                          title="Quitar del examen">
                          <XCircle size={12}/>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null
      )}

    </div>

    {/* ══════════════════════════════════════════════════
        MODALES
    ══════════════════════════════════════════════════ */}

    {/* Modal: Crear / Editar Examen */}
    <AnimatePresence>
      {modalForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setModalForm(false)}/>
          <motion.div initial={{ scale:0.9,opacity:0,y:30 }} animate={{ scale:1,opacity:1,y:0 }} exit={{ scale:0.9,opacity:0,y:30 }}
            className="relative w-full max-w-md bg-[var(--color-card)] rounded-[2.5rem] border border-[var(--color-border)] shadow-2xl overflow-hidden">

            <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] p-5 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/15 rounded-xl"><GraduationCap size={18}/></div>
                <div>
                  <h3 className="text-base font-black uppercase italic tracking-tighter">{editando ? 'Editar Examen' : 'Nuevo Examen'}</h3>
                  <p className="text-[6px] font-black uppercase tracking-widest opacity-70">TKW SYSTEM</p>
                </div>
              </div>
              <button onClick={() => setModalForm(false)} className="p-1.5 bg-black/20 rounded-full"><X size={16}/></button>
            </div>

            <div className="p-5 space-y-4">
              <InputField label="Nombre del Examen" name="nombre_examen" value={form.nombre_examen}
                onChange={(n,v) => setForm(p => ({ ...p, [n]:v }))} required placeholder="Ej. Examen 9° Kup → 8° Kup"/>
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Fecha" name="fecha_programada" type="date" value={form.fecha_programada}
                  onChange={(n,v) => setForm(p => ({ ...p, [n]:v }))} required/>
                <InputField label="Costo ($)" name="costo_examen" type="number" value={form.costo_examen}
                  onChange={(n,v) => setForm(p => ({ ...p, [n]:v }))} placeholder="0.00"/>
              </div>
              <InputField label="Lugar" name="lugar" value={form.lugar}
                onChange={(n,v) => setForm(p => ({ ...p, [n]:v }))} placeholder="Dojo Central"/>
              <InputField label="Sinodal" name="sinodal" value={form.sinodal}
                onChange={(n,v) => setForm(p => ({ ...p, [n]:v }))} placeholder="Nombre del evaluador (opcional)"/>

              <motion.button whileTap={{ scale:0.97 }} onClick={handleGuardarForm} disabled={savingForm}
                className="w-full h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background:'var(--color-primary)' }}>
                {savingForm ? <><Loader2 size={16} className="animate-spin"/> Guardando...</> : <><Save size={16}/> {editando ? 'Actualizar' : 'Crear Examen'}</>}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* Modal: Inscribir Alumnos */}
    <AnimatePresence>
      {modalInscribir && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setModalInscribir(false)}/>
          <motion.div initial={{ scale:0.9,opacity:0,y:30 }} animate={{ scale:1,opacity:1,y:0 }} exit={{ scale:0.9,opacity:0,y:30 }}
            className="relative w-full max-w-md bg-[var(--color-card)] rounded-[2.5rem] border border-[var(--color-border)] shadow-2xl max-h-[85vh] flex flex-col">

            <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] p-5 flex items-center justify-between text-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/15 rounded-xl"><UserPlus size={18}/></div>
                <div>
                  <h3 className="text-base font-black uppercase italic tracking-tighter">Inscribir Alumnos</h3>
                  <p className="text-[7px] font-black uppercase tracking-widest opacity-70">{selAlumnos.length} seleccionado(s)</p>
                </div>
              </div>
              <button onClick={() => setModalInscribir(false)} className="p-1.5 bg-black/20 rounded-full"><X size={16}/></button>
            </div>

            <div className="p-4 flex-shrink-0">
              <div className="relative">
                <input type="text" placeholder="Buscar alumno..."
                  className="w-full h-9 pl-9 pr-3 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] outline-none font-bold text-[11px] text-[var(--color-text)] placeholder:opacity-40"
                  value={buscarAlu} onChange={e => setBuscarAlu(e.target.value)}/>
                <Users size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"/>
              </div>
              {/* Selección rápida */}
              <div className="flex gap-2 mt-2">
                <button onClick={() => setSelAlumnos(alumnosFiltrados.map(a => a.idalumno))}
                  className="flex-1 h-7 rounded-lg text-[8px] font-black uppercase border transition-all"
                  style={{ background:'var(--color-primary)15', borderColor:'var(--color-primary)30', color:'var(--color-primary)' }}>
                  Selec. todos
                </button>
                <button onClick={() => setSelAlumnos([])}
                  className="flex-1 h-7 rounded-lg text-[8px] font-black uppercase border transition-all"
                  style={{ background:'var(--color-background)', borderColor:'var(--color-border)', color:'var(--color-text-muted)' }}>
                  Limpiar
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 space-y-1.5">
              {alumnosFiltrados.map(a => {
                const ci   = cintas.find((c: any) => c.idgrado === a.idgradoactual);
                const sel  = selAlumnos.includes(a.idalumno);
                return (
                  <button key={a.idalumno} onClick={() => setSelAlumnos(p => sel ? p.filter(x => x !== a.idalumno) : [...p, a.idalumno])}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left"
                    style={{ background: sel ? 'var(--color-primary)10' : 'var(--color-background)', borderColor: sel ? 'var(--color-primary)50' : 'var(--color-border)' }}>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${sel ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'border-[var(--color-border)]'}`}>
                      {sel && <CheckCheck size={10} className="text-white"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black uppercase italic truncate text-[var(--color-text)]">{a.nombres} {a.apellidopaterno}</p>
                      {ci && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <MiniCintaBelt colorName={ci.color} stripeName={ci.color_stripe}/>
                          <span className="text-[7px] font-bold opacity-50">{ci.nivelkupdan}</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 flex-shrink-0">
              <motion.button whileTap={{ scale:0.97 }} onClick={handleInscribir}
                disabled={!selAlumnos.length || inscribiendo}
                className="w-full h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background:'var(--color-primary)' }}>
                {inscribiendo ? <><Loader2 size={16} className="animate-spin"/> Inscribiendo...</> : <><UserPlus size={16}/> Inscribir {selAlumnos.length > 0 ? `(${selAlumnos.length})` : ''}</>}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* Modal: Calificar */}
    <AnimatePresence>
      {modalCalificar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setModalCalificar(null)}/>
          <motion.div initial={{ scale:0.9,opacity:0,y:30 }} animate={{ scale:1,opacity:1,y:0 }} exit={{ scale:0.9,opacity:0,y:30 }}
            className="relative w-full max-w-sm bg-[var(--color-card)] rounded-[2.5rem] border border-[var(--color-border)] shadow-2xl p-6 space-y-5">
            <button onClick={() => setModalCalificar(null)} className="absolute top-4 right-4 p-2 rounded-full opacity-40 hover:opacity-100"><X size={16}/></button>

            <div>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-40 text-[var(--color-text)] mb-1">Registrar Calificación</p>
              <h3 className="text-lg font-black uppercase italic tracking-tighter text-[var(--color-text)]">
                {modalCalificar.alumnos?.nombres} {modalCalificar.alumnos?.apellidopaterno}
              </h3>
              {modalCalificar.grado_ant && (
                <div className="flex items-center gap-2 mt-1">
                  <MiniCintaBelt colorName={modalCalificar.grado_ant.color} stripeName={modalCalificar.grado_ant.color_stripe}/>
                  <span className="text-[9px] font-bold opacity-60">{modalCalificar.grado_ant.nivelkupdan}</span>
                </div>
              )}
            </div>

            {/* Calificación */}
            <div className="space-y-1">
              <label className="text-[7px] font-black uppercase ml-2 text-[var(--color-text-muted)] tracking-widest">Calificación (0–10) *</label>
              <input type="number" min="0" max="10" step="0.1" placeholder="Ej. 8.5"
                className="w-full h-14 px-4 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none font-black text-2xl text-center text-[var(--color-text)] transition-all"
                value={calificacion} onChange={e => setCalificacion(e.target.value)}/>
              {calificacion && (
                <p className="text-center text-[9px] font-black uppercase tracking-widest mt-1"
                  style={{ color: parseFloat(calificacion) >= 6 ? '#22c55e' : '#ef4444' }}>
                  {parseFloat(calificacion) >= 6 ? '✓ Aprobado' : '✗ Reprobado'}
                </p>
              )}
            </div>

            {/* Grado nuevo — solo si aprueba */}
            {calificacion && parseFloat(calificacion) >= 6 && (
            <div className="space-y-1">
              <label className="text-[7px] font-black uppercase ml-2 text-[var(--color-text-muted)] tracking-widest">Grado que obtiene *</label>
              {gradoNuevo && (() => {
                const sel = cintas.find((c: any) => c.idgrado === Number(gradoNuevo));
                return sel ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 mb-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)]/50">
                    <MiniCintaBelt colorName={sel.color} stripeName={sel.color_stripe}/>
                    <span className="text-[9px] font-black uppercase" style={{ color: getBeltHex(sel.color) }}>{sel.nivelkupdan}</span>
                  </div>
                ) : null;
              })()}
              <select
                className="w-full h-11 px-4 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none font-black text-[9px] uppercase text-[var(--color-text)] appearance-none cursor-pointer"
                value={gradoNuevo} onChange={e => setGradoNuevo(e.target.value ? Number(e.target.value) : '')}>
                <option value="">— Selecciona grado —</option>
                {cintas.map((c: any) => (
                  <option key={c.idgrado} value={c.idgrado}>
                    {c.nivelkupdan} — {c.color}{c.color_stripe ? ` / ${c.color_stripe}` : ''}
                  </option>
                ))}
              </select>
            </div>
            )}

            {/* Notas */}
            <div className="space-y-1">
              <label className="text-[7px] font-black uppercase ml-2 text-[var(--color-text-muted)] tracking-widest">Notas (opcional)</label>
              <textarea placeholder="Observaciones del evaluador..." rows={2}
                className="w-full px-4 py-3 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none font-bold text-[11px] text-[var(--color-text)] resize-none transition-all"
                value={notasCal} onChange={e => setNotasCal(e.target.value)}/>
            </div>

            <motion.button whileTap={{ scale:0.97 }} onClick={handleCalificar} disabled={savingCal}
              className="w-full h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background:'var(--color-primary)' }}>
              {savingCal ? <><Loader2 size={16} className="animate-spin"/> Guardando...</> : <><Star size={16}/> Registrar Calificación</>}
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* Modal: Subir PDF */}
    <AnimatePresence>
      {modalPdf && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setModalPdf(false)}/>
          <motion.div initial={{ scale:0.9,opacity:0,y:30 }} animate={{ scale:1,opacity:1,y:0 }} exit={{ scale:0.9,opacity:0,y:30 }}
            className="relative w-full max-w-sm bg-[var(--color-card)] rounded-[2.5rem] border border-[var(--color-border)] shadow-2xl p-6 space-y-5">
            <button onClick={() => setModalPdf(false)} className="absolute top-4 right-4 p-2 rounded-full opacity-40 hover:opacity-100"><X size={16}/></button>

            <div>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-40 text-[var(--color-text)] mb-1">Documento del Examen</p>
              <h3 className="text-lg font-black uppercase italic tracking-tighter text-[var(--color-text)]">Subir PDF</h3>
              <p className="text-[9px] opacity-50 mt-1 text-[var(--color-text)]">Solo archivos .pdf · Se usará para imprimir o compartir</p>
            </div>

            {examenActivo?.archivo_pdf && (
              <div className="flex items-center gap-3 p-3 rounded-2xl border"
                style={{ background:'#22c55e10', borderColor:'#22c55e30' }}>
                <FileText size={16} style={{ color:'#22c55e' }}/>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black uppercase text-emerald-400">PDF actual</p>
                  <a href={examenActivo.archivo_pdf} target="_blank" rel="noreferrer"
                    className="text-[8px] underline text-emerald-400 opacity-70 truncate block">
                    Ver PDF actual
                  </a>
                </div>
              </div>
            )}

            <button onClick={() => pdfInputRef.current?.click()} disabled={uploadingPdf}
              className="w-full h-32 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all disabled:opacity-50"
              style={{ borderColor:'var(--color-primary)50', background:'var(--color-primary)05' }}>
              {uploadingPdf
                ? <><Loader2 size={28} className="animate-spin text-[var(--color-primary)]"/><span className="text-[9px] font-black uppercase tracking-widest opacity-60">Subiendo...</span></>
                : <><Upload size={28} style={{ color:'var(--color-primary)' }}/><span className="text-[9px] font-black uppercase tracking-widest" style={{ color:'var(--color-primary)' }}>Seleccionar PDF</span></>
              }
            </button>
            <input type="file" ref={pdfInputRef} className="hidden" accept=".pdf" onChange={handleUploadPdf}/>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
};

export default ExamenesView;