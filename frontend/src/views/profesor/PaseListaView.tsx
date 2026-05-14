// ============================================================
//  src/views/profesor/PaseListaView.tsx
//  Pase de lista + CRUD de alumnos del profesor
//  Modal de alumnos IDÉNTICO a GestionAlumnos
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
  HeartPulse, ShieldAlert, DollarSign, UserCircle, Link2, Copy, Smartphone, QrCode,
} from 'lucide-react';

import { FormularioInscripcion } from '../../pages/FormularioInscripcion';
import type { EscuelaInfo } from '../../types/inscripciones_publicas.types';
import { alumnoService }     from '../../services/alumno.service';
import { profesorService }    from '../../services/profesor.service';
import { cintasService }     from '../../services/cintas.service';
import {
  asistenciaService,
  type AlumnoDia,
  type ResumenAlumno,
  type ListaDiaResponse,
} from '../../services/asistencia.service';
import api from '../../api/axios';
import { getBeltHex } from '../../utils/beltColors';

// ─────────────────────────────────────────────────────────────
//  MINI COMPONENTE DE CINTA (con franja)
// ─────────────────────────────────────────────────────────────
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
//  INPUT FIELD (unificado con GestionAlumnos)
// ─────────────────────────────────────────────────────────────
interface InputProps {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  error?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
}

const InputField: React.FC<InputProps> = ({ 
  label, name, value, onChange, error, type = "text", required, placeholder, maxLength 
}) => (
  <div className="space-y-1">
    <label className="text-label font-black uppercase ml-2 text-[var(--color-text-muted)] tracking-widest flex items-center gap-1">
      {label} {required && <span className="text-red-500 font-bold text-label">*</span>}
    </label>
    <input 
      type={type}
      placeholder={placeholder}
      maxLength={maxLength}
      className={`w-full h-11 px-4 bg-[var(--color-background)] rounded-xl border ${error ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'border-[var(--color-border)]'} focus:border-[var(--color-primary)] outline-none font-bold text-label text-[var(--color-text)] shadow-inner transition-all placeholder:opacity-20`}
      value={value} 
      onChange={e => onChange(name, e.target.value)} 
    />
    <AnimatePresence>
      {error && (
        <motion.p 
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
          className="text-label text-red-500 ml-2 font-black uppercase italic tracking-tighter overflow-hidden"
        >
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);

// ─────────────────────────────────────────────────────────────
//  MODAL: Compartir link de inscripción (específico al profesor)
//  La URL lleva ?profesor={id} para pre-asignar el instructor.
// ─────────────────────────────────────────────────────────────
function ModalCompartirLinkProfesor({
  idprofesor,
  onClose,
}: {
  idprofesor: number;
  onClose: () => void;
}) {
  const [copiado, setCopiado]         = useState(false);
  const [verQR, setVerQR]             = useState(false);
  const [slug, setSlug]               = useState('');
  const [loadingSlug, setLoadingSlug] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<any>('/escuelas/escuelas/mi-escuela');
        const nombre: string = res.data?.nombreescuela ?? res.data?.escuela?.nombreescuela ?? '';
        if (nombre) {
          setSlug(
            nombre.toLowerCase().trim()
              .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e')
              .replace(/[íìï]/g,'i').replace(/[óòö]/g,'o')
              .replace(/[úùü]/g,'u').replace(/[ñ]/g,'n')
              .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
          );
        }
      } catch { /* silencioso */ }
      finally { setLoadingSlug(false); }
    })();
  }, []);

  // URL con el idprofesor embebido → FormularioInscripcion lo leerá con useSearchParams
  const url = slug
    ? `${window.location.origin}/registro/${slug}?profesor=${idprofesor}`
    : '';

  const copiar = async () => {
    if (!url) return;
    try { await navigator.clipboard.writeText(url); }
    catch {
      const t = document.createElement('textarea');
      t.value = url; document.body.appendChild(t); t.select();
      document.execCommand('copy'); document.body.removeChild(t);
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const compartirNativo = async () => {
    if (navigator.share && url) {
      await navigator.share({ title: 'Formulario de Inscripción', text: 'Regístrate en nuestra escuela', url });
    } else { copiar(); }
  };

  return (
    <div className="flex flex-col gap-4">

      {/* URL preview */}
      <div className="flex items-center gap-2 p-3 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)]">
        <Link2 size={13} className="text-[var(--color-primary)] shrink-0"/>
        {loadingSlug
          ? <span className="text-label text-[var(--color-text-muted)] italic">Cargando...</span>
          : <span className="text-label text-[var(--color-text)] font-mono truncate flex-1">{url}</span>
        }
      </div>

      {/* Aviso: los alumnos que entren por este link quedan asignados a este profesor */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-caption font-bold"
        style={{ background:'var(--color-primary)10', color:'var(--color-primary)', border:'1px solid var(--color-primary)25' }}>
        <UserCheck size={13} className="shrink-0 mt-0.5"/>
        <span>Los alumnos que se registren con este link quedarán asignados automáticamente a <strong>tu perfil</strong>.</span>
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-3 gap-2">
        <motion.button whileTap={{ scale: 0.95 }} onClick={copiar} disabled={!url}
          className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-[var(--color-border)] transition-all disabled:opacity-40"
          style={{
            background: copiado ? 'rgba(34,197,94,0.1)' : 'var(--color-background)',
            color: copiado ? '#22c55e' : 'var(--color-text-muted)',
            borderColor: copiado ? '#22c55e44' : undefined,
          }}>
          {copiado ? <CheckCheck size={18}/> : <Copy size={18}/>}
          <span className="text-caption font-bold">{copiado ? '¡Copiado!' : 'Copiar'}</span>
        </motion.button>

        <motion.button whileTap={{ scale: 0.95 }} onClick={compartirNativo} disabled={!url}
          className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all disabled:opacity-40"
          style={{ background:'var(--color-primary)1A', border:'1px solid var(--color-primary)33', color:'var(--color-primary)' }}>
          <Smartphone size={18}/>
          <span className="text-caption font-bold">Compartir</span>
        </motion.button>

        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setVerQR(v => !v)} disabled={!url}
          className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all disabled:opacity-40 ${verQR ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-muted)]'}`}>
          <QrCode size={18}/>
          <span className="text-caption font-bold">QR</span>
        </motion.button>
      </div>

      {/* QR expandible */}
      <AnimatePresence>
        {verQR && url && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} className="overflow-hidden">
            <div className="flex flex-col items-center gap-3 pt-1">
              <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}&margin=4`}
                  alt="QR de inscripción"
                  className="w-[160px] h-[160px]"
                />
              </div>
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}&margin=10`;
                  a.download = `qr-inscripcion-prof${idprofesor}.png`;
                  a.click();
                }}
                className="text-caption font-bold text-[var(--color-primary)] flex items-center gap-1"
              >
                Descargar QR
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-caption text-[var(--color-text-muted)] text-center leading-relaxed">
        Comparte este link con tus alumnos para que llenen el formulario. Los datos se guardan automáticamente y quedan bajo tu grupo.
      </p>
    </div>
  );
}

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
  //  ESTADO GLOBAL (cintas, profesores, profesor logueado)
  // ══════════════════════════════════════════════════════════
  const [cintas, setCintas] = useState<any[]>([]);
  const [profesores, setProfesores] = useState<any[]>([]);
  const [idProfesorActual, setIdProfesorActual] = useState<number | null>(null);

  // Cargar grados y profesores al montar
  useEffect(() => {
    cintasService.listarGrados().then(res => {
      const sorted = (res || []).slice().sort((a: any, b: any) => (a.orden ?? 99) - (b.orden ?? 99));
      setCintas(sorted);
    }).catch(() => setErrorMsg('Error al cargar grados'));

    // Obtener perfil propio: no usamos listarProfesores() (endpoint exclusivo de escuela)
    // El select de "Instructor Responsable" se pre-llena solo con el profesor logueado
    api.get<any>('/profesores/mi-perfil')
      .then(res => {
        const perfil = res.data?.profesor ?? res.data ?? null;
        const id = perfil?.idprofesor ?? null;
        if (id) {
          setIdProfesorActual(id);
          setProfesores([{
            idprofesor: id,
            nombrecompleto: (perfil?.nombrecompleto
              ?? `${perfil?.nombres ?? ''} ${perfil?.apellidopaterno ?? ''}`.trim())
              || 'Yo (instructor)',
          }]);
        }
      })
      .catch(() => {
        api.get<any>('/auth/me').then(res => {
          const id = res.data?.idprofesor ?? res.data?.profesor?.idprofesor ?? null;
          if (id) {
            setIdProfesorActual(id);
            setProfesores([{
              idprofesor: id,
              nombrecompleto: res.data?.nombrecompleto ?? 'Yo (instructor)',
            }]);
          }
        }).catch(() => {/* silencioso */});
      });
  }, []);

  // Función para obtener franja desde cintas usando nivel y color
  const obtenerStripePorNivelYColor = useCallback((nivel?: string | null, colorBase?: string | null): string | null => {
  if (!nivel || !cintas.length) return null;
  const grado = cintas.find(c =>
    c.nivelkupdan === nivel &&
    (c.color || '').toLowerCase() === (colorBase || '').toLowerCase()
  );
  return grado?.color_stripe || null;
}, [cintas]);

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

      const alumnosConStripe = (res.alumnos || []).map(alumno => ({
        ...alumno,
        cinta_stripe: obtenerStripePorNivelYColor(alumno.cinta_nivel, alumno.cinta_color)
      }));

      setListaData({ ...res, alumnos: alumnosConStripe });
      const init: Record<number, boolean> = {};
      alumnosConStripe.forEach(a => { init[a.idalumno] = a.presente !== null ? a.presente : true; });
      setLocal(init);
    } catch { setErrorMsg('Error al cargar la lista.'); }
    finally { setListaLoading(false); }
  }, [obtenerStripePorNivelYColor]);

  useEffect(() => { if (cintas.length) loadLista(fecha); }, [fecha, loadLista, cintas]);

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
  //  ESTADO: ALUMNOS (CRUD) — MODAL UNIFICADO
  // ══════════════════════════════════════════════════════════
  const [alumnos, setAlumnos]   = useState<any[]>([]);
  const [aluLoading, setAluLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Formulario a pantalla completa (nuevo alumno con FormularioInscripcion)
  const [showFormulario, setShowFormulario] = useState(false);
  // Modal link/QR de inscripción
  const [modalLink, setModalLink] = useState(false);

  // Modal (editar / detalle / foto)
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

  // Estado del formulario (compatible con GestionAlumnos)
  const initialFormState = {
    nombres: '',
    apellidopaterno: '',
    apellidomaterno: 'N/A',
    fechanacimiento: '',
    contacto_emergencia_nombre: '',
    contacto_emergencia_tel: '',
    nombretutor: '',
    telefonocontacto: '',
    correotutor: '',
    direcciondomicilio: '',
    grado_escolar: 'Desconocido',
    escuela_procedencia: 'Ninguna',
    fotoalumno: '',
    tipo_sangre: 'O+',
    alergias: 'Ninguna',
    padecimientos_cronicos: 'Ninguno',
    seguro_medico: 'No cuenta',
    nss_o_poliza: '',
    idgradoactual: 1,
    idescuela: 0,
    idprofesor: null as number | null,
    estatus: 1
  };
  const [formData, setFormData] = useState<any>(initialFormState);

  const loadAlumnos = useCallback(async () => {
    setAluLoading(true);
    try {
      const aluRes = await alumnoService.getAlumnos();
      setAlumnos(aluRes || []);
    } catch { setErrorMsg('Error al cargar alumnos.'); }
    finally { setAluLoading(false); }
  }, []);

  useEffect(() => { if (tab === 'alumnos') loadAlumnos(); }, [tab, loadAlumnos]);

  const getCintaInfo = (id: number) => cintas.find((c: any) => c.idgrado === id);

  const filtered = useMemo(() =>
    (alumnos || []).filter(a =>
      `${a.nombres} ${a.apellidopaterno}`.toLowerCase().includes(searchTerm.toLowerCase())
    ), [alumnos, searchTerm]);

  // ─── VALIDACIÓN (IDÉNTICA A GestionAlumnos) ─────────────────
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (formData.nombres.trim().length < 2) newErrors.nombres = "Obligatorio";
    if (formData.apellidopaterno.trim().length < 2) newErrors.apellidopaterno = "Obligatorio";
    
    if (!isEditing) {
      if (!formData.fechanacimiento) newErrors.fechanacimiento = "Necesaria";
      if (!formData.idprofesor) newErrors.idprofesor = "Selecciona instructor";
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.correotutor || !emailRegex.test(formData.correotutor)) 
        newErrors.correotutor = "Email inválido";
      
      if (formData.nombretutor.trim().length < 5) newErrors.nombretutor = "Nombre obligatorio";
      
      const phoneClean = formData.telefonocontacto.replace(/\D/g, '');
      if (phoneClean.length !== 10) newErrors.telefonocontacto = "10 dígitos";
      
      if (formData.direcciondomicilio.trim().length < 10) newErrors.direcciondomicilio = "Dirección insuficiente";
      
      if (formData.contacto_emergencia_nombre.trim().length < 5) newErrors.contacto_emergencia_nombre = "Nombre obligatorio";
      const emergencyPhoneClean = formData.contacto_emergencia_tel.replace(/\D/g, '');
      if (emergencyPhoneClean.length !== 10) newErrors.contacto_emergencia_tel = "10 dígitos";

      if (formData.seguro_medico !== 'No cuenta') {
        const nssClean = formData.nss_o_poliza.replace(/\D/g, '');
        if (nssClean.length !== 11) newErrors.nss_o_poliza = "Requiere 11 dígitos";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (name: string, value: string) => {
    if (["telefonocontacto", "contacto_emergencia_tel", "nss_o_poliza"].includes(name)) {
      const limit = name === "nss_o_poliza" ? 11 : 10;
      const numericValue = value.replace(/\D/g, '').slice(0, limit);
      setFormData((prev: any) => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleOpenAdd = () => {
    // Abre el modal con la URL/QR para que el alumno se registre desde su celular
    setModalLink(true);
  };

  const handleOpenEdit = (a: any) => {
    setIsEditing(true);
    setSelectedAlumno(a);
    setFormData({ ...a });
    setErrors({});
    setStep('form');
    setIsModalOpen(true);
  };

  const handleOpenDetail = async (id: number) => {
    setStep('detail'); setIsModalOpen(true);
    try { const d = await alumnoService.getDetalle(id); setSelectedAlumno(d); } catch { /**/ }
  };

  const handleOpenPhoto = (a: any) => {
    setSelectedAlumno(a);
    setStep('photo_choice');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSavingAlu(true);
    try {
      if (isEditing && selectedAlumno) {
        const updatePayload = {
          nombres: formData.nombres,
          apellidopaterno: formData.apellidopaterno,
          apellidomaterno: formData.apellidomaterno,
          idgradoactual: formData.idgradoactual,
          estatus: formData.estatus,
          fotoalumno: formData.fotoalumno
        };
        const res = await alumnoService.actualizar(selectedAlumno.idalumno, updatePayload);
        setAlumnos(prev => prev.map(a => a.idalumno === res.idalumno ? res : a));
        setIsModalOpen(false);
        setSuccessMsg('Alumno actualizado');
      } else {
        const payload = { ...formData, idprofesor: idProfesorActual };
        const res = await alumnoService.registrar(payload);
        setSelectedAlumno(res);
        setAlumnos(prev => [...prev, res]);
        setStep('photo_choice');
        setSuccessMsg('Alumno registrado');
      }
    } catch { setErrorMsg('Error al guardar.'); }
    finally { setSavingAlu(false); }
  };

  // ─── GESTIÓN DE FOTOGRAFÍA ──────────────────────────────────
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
      setAlumnos(prev => prev.map(a => a.idalumno === res.idalumno ? res : a));
      setIsModalOpen(false); setSuccessMsg('Foto actualizada');
    } catch { setErrorMsg('Error al subir foto.'); }
    finally { setSavingAlu(false); }
  };

  // ══════════════════════════════════════════════════════════
  //  ESTADO: RESUMEN (con franjas)
  // ══════════════════════════════════════════════════════════
  const [resumen, setResumen]       = useState<ResumenAlumno[]>([]);
  const [resLoading, setResLoading] = useState(false);
  const [resDias, setResDias]       = useState(30);

  const loadResumen = useCallback(async () => {
    setResLoading(true);
    try {
      const hasta = hoy(); const desde = offsetFecha(hasta, -(resDias-1));
      const res = await asistenciaService.resumenGrupo({ desde, hasta });
      const alumnosConStripe = (res.alumnos || []).map(alumno => ({
        ...alumno,
        cinta_stripe: obtenerStripePorNivelYColor(alumno.cinta_nivel, alumno.cinta_color)
      }));
      setResumen(alumnosConStripe);
    } catch { setResumen([]); }
    finally { setResLoading(false); }
  }, [resDias, obtenerStripePorNivelYColor]);

  useEffect(() => { if (tab === 'resumen' && cintas.length) loadResumen(); }, [tab, loadResumen, cintas]);

  // ══════════════════════════════════════════════════════════
  //  RENDER: Formulario de nuevo alumno (pantalla completa)
  // ══════════════════════════════════════════════════════════
  if (showFormulario) {
    // Construimos un objeto EscuelaInfo mínimo a partir del perfil del profesor
    // para que el header del formulario muestre algo coherente.
    const escuelaParaFormulario: EscuelaInfo | undefined = profesores[0]
      ? { nombreescuela: profesores[0].nombrecompleto ? `Grupo de ${profesores[0].nombrecompleto}` : 'Mi Grupo', lema: 'Registro interno' } as EscuelaInfo
      : undefined;

    return (
      <FormularioInscripcion
        idprofesorOverride={idProfesorActual ?? undefined}
        escuelaOverride={escuelaParaFormulario}
        onSuccess={alumnoNuevo => {
          // Agregar el alumno a la lista local y cerrar
          setAlumnos(prev => [...prev, alumnoNuevo]);
          setShowFormulario(false);
          setSuccessMsg(`${alumnoNuevo.nombres} registrado correctamente`);
          // Recargar la lista oficial desde el servidor
          loadAlumnos();
        }}
        onCancel={() => setShowFormulario(false)}
      />
    );
  }

  // ──────────────────────────────────────────────────────────
  //  RENDER
  // ──────────────────────────────────────────────────────────
  return (
    <>
    <div className="space-y-4 text-[var(--color-text)] animate-in fade-in duration-500 pb-32">
      {/* Toasts */}
      <AnimatePresence>
        {successMsg && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
            className="fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border border-green-500"
            style={{ backgroundColor:'#16a34a', color:'white' }}>
            <CheckCircle2 size={18} /><span className="text-datos font-black tracking-tight">{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {errorMsg && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
            className="fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border border-red-500 max-w-sm"
            style={{ backgroundColor:'#dc2626', color:'white' }}>
            <AlertCircle size={18} className="flex-shrink-0" />
            <span className="text-datos font-black tracking-tight flex-1">{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)}><X size={14}/></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="bg-[var(--color-card)] backdrop-blur-2xl p-5 rounded-[2.5rem] border border-[var(--color-border)] shadow-2xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background:'var(--color-primary)20', border:'1.5px solid var(--color-primary)40' }}>
              <UserCheck size={22} style={{ color:'var(--color-primary)' }} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-subtitulo font-black uppercase italic tracking-tighter leading-none text-[var(--color-text)]">
                {tab === 'asistencia' ? 'Pase de Lista' : tab === 'alumnos' ? 'Mis Alumnos' : 'Resumen'}
              </h2>
              <p className="text-label font-black uppercase tracking-[0.4em] mt-1 opacity-40 leading-none text-[var(--color-text-muted)]">
                {tab === 'asistencia' ? 'Control de Asistencia' : tab === 'alumnos' ? 'CRUD — Grupo a Cargo' : 'Estadísticas de Asistencia'}
              </p>
            </div>
          </div>
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
                className="h-9 px-4 rounded-xl flex items-center gap-1.5 text-caption font-black uppercase tracking-widest text-white"
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

        {/* Navegador de fecha (asistencia) */}
        {tab === 'asistencia' && (
          <>
            <div className="flex items-center gap-2">
              <button onClick={() => setFecha(f => offsetFecha(f, -1))}
                className="h-9 w-9 rounded-xl flex items-center justify-center border transition-all"
                style={{ background:'var(--color-background)', borderColor:'var(--color-border)', color:'var(--color-text-muted)' }}>
                <ChevronLeft size={16}/>
              </button>
              <div className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl border font-black text-datos"
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
                  className="h-9 px-3 rounded-xl text-caption font-black uppercase border transition-all"
                  style={{ background:'var(--color-primary)15', borderColor:'var(--color-primary)40', color:'var(--color-primary)' }}>
                  Hoy
                </button>
              )}
            </div>
            {/* Grid de Estadísticas Adaptativo */}
{!listaLoading && (listaData?.alumnos?.length ?? 0) > 0 && (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
    {[
      { label: 'Total', val: statsAsist.total, color: 'var(--color-text)', Icon: Users, bg: 'var(--color-background)' },
      { label: 'Presentes', val: statsAsist.presentes, color: '#22c55e', Icon: CheckCircle2, bg: '#22c55e0a' },
      { label: 'Ausentes', val: statsAsist.ausentes, color: '#ef4444', Icon: XCircle, bg: '#ef44440a' },
    ].map(({ label, val, color, Icon, bg }, idx) => (
      <div 
        key={label} 
        className={`
          rounded-3xl p-4 text-center border transition-all duration-300
          ${idx === 2 ? 'col-span-2 md:col-span-1 mx-auto w-1/2 md:w-full' : 'col-span-1'}
          flex flex-col items-center justify-center gap-1
        `}
        style={{ 
          backgroundColor: bg, 
          borderColor: 'var(--color-border)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
        }}
      >
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center mb-1"
          style={{ background: `${color}15` }}
        >
          <Icon size={16} style={{ color }} />
        </div>
        <p className="text-2xl font-black leading-none tracking-tighter" style={{ color }}>
          {val}
        </p>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 text-[var(--color-text)]">
          {label}
        </p>
      </div>
    ))}
  </div>
)}
          </>
        )}

        {/* Buscador alumnos */}
        {tab === 'alumnos' && (
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={12}/>
            <input type="text" placeholder="Buscar alumno..."
              className="w-full h-9 pl-10 pr-3 bg-[var(--color-background)]/50 rounded-xl border border-[var(--color-border)] focus:border-[var(--color-primary)]/50 outline-none font-bold text-label text-[var(--color-text)] shadow-inner transition-all placeholder:opacity-40"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
          </div>
        )}
      </div>

      {/* TABS */}
      <div className="flex p-1.5 bg-[var(--color-card)] rounded-[1.8rem] border border-[var(--color-border)] shadow-xl">
        {([
          { key:'asistencia', label:'Lista', Icon: CheckCheck },
          { key:'alumnos', label:'Alumnos', Icon: Users },
          { key:'resumen', label:'Resumen', Icon: BarChart2 },
        ] as const).map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex-1 py-2.5 rounded-2xl text-caption font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
            style={tab === key
              ? { backgroundColor:'var(--color-primary)', color:'white', boxShadow:'0 4px 16px -4px var(--color-primary)50' }
              : { opacity:0.4, color:'var(--color-text)' }}>
            <Icon size={12} strokeWidth={2.5}/>{label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════
          TAB — ASISTENCIA (sin cambios)
      ══════════════════════════════════════════════════ */}
      {tab === 'asistencia' && (
        <div className="space-y-3">
          {!listaLoading && listaData?.ya_registrada && (
            <motion.div initial={{ opacity:0,y:-8 }} animate={{ opacity:1,y:0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
              style={{ background:'#22c55e10', borderColor:'#22c55e35' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'#22c55e20' }}>
                <Lock size={14} style={{ color:'#22c55e' }}/>
              </div>
              <div>
                <p className="text-caption font-black uppercase tracking-widest" style={{ color:'#22c55e' }}>Lista registrada</p>
                <p className="text-caption font-bold opacity-60 text-[var(--color-text)]">Ya se pasó lista este día. Solo lectura.</p>
              </div>
            </motion.div>
          )}

          {!listaLoading && (listaData?.alumnos?.length ?? 0) > 0 && !listaData?.ya_registrada && (
            <div className="flex gap-2">
              <button onClick={() => marcarTodos(true)}
                className="flex-1 h-9 rounded-xl text-xs font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-1.5"
                style={{ background:'#22c55e15', borderColor:'#22c55e35', color:'#22c55e' }}>
                <CheckCircle2 size={12}/> Todos presentes
              </button>
              <button onClick={() => marcarTodos(false)}
                className="flex-1 h-9 rounded-xl text-xs font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-1.5"
                style={{ background:'#ef444415', borderColor:'#ef444435', color:'#ef4444' }}>
                <XCircle size={12}/> Todos ausentes
              </button>
            </div>
          )}

          {listaLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-[var(--color-primary)]" size={32}/></div>
          ) : (listaData?.alumnos?.length ?? 0) === 0 ? (
            <div className="py-20 text-center opacity-30">
              <Users size={40} className="mx-auto mb-3"/>
              <p className="text-label font-black uppercase tracking-widest text-[var(--color-text)]">Sin alumnos asignados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(listaData?.alumnos || []).map((alumno, i) => {
                const presente   = local[alumno.idalumno] ?? true;
                const noReg      = alumno.presente === null && !dirty;
                const hex        = getBeltHex(alumno.cinta_color);
                const yaRegistrada = listaData?.ya_registrada ?? false;
                const stripeName = (alumno as any).cinta_stripe;
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
                    <div className="relative flex-shrink-0 ml-1">
                      <div className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center border-2"
                        style={{ borderColor: presente ? '#22c55e50' : '#ef444450', background:'var(--color-background)' }}>
                        {alumno.foto
                          ? <img src={alumno.foto} className="w-full h-full object-cover" alt=""/>
                          : <span className="text-datos font-black" style={{ color:'var(--color-text-muted)' }}>{alumno.nombres.charAt(0)}</span>
                        }
                      </div>
                      <div className="absolute -bottom-1 -right-1 border-2 rounded shadow-lg z-10 overflow-hidden" style={{ borderColor:'var(--color-background)' }}>
                        <MiniCintaBelt colorName={alumno.cinta_color} stripeName={stripeName} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-label font-black uppercase italic tracking-tighter truncate leading-none text-[var(--color-text)] mb-1">
                        {alumno.nombres} {alumno.apellidopaterno}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-caption font-black uppercase tracking-wide"
                          style={{ color: hex === '#f8f8f8' ? 'var(--color-text-muted)' : hex }}>
                          {alumno.cinta_nivel || '—'}
                        </span>
                        {noReg && (
                          <span className="flex items-center gap-0.5 text-label font-black uppercase text-[var(--color-text-muted)] opacity-50">
                            <Clock size={8}/> sin registrar
                          </span>
                        )}
                      </div>
                    </div>
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
          <div className="h-8" />
          {!listaLoading && (listaData?.alumnos?.length ?? 0) > 0 && !listaData?.ya_registrada && (
            <div className="pt-2">
              <motion.button whileTap={{ scale:0.97 }} onClick={handleGuardar} disabled={saving}
                className="w-full h-14 rounded-[2rem] flex items-center justify-center gap-3 font-black text-datos uppercase tracking-widest text-white shadow-2xl disabled:opacity-60"
                style={{ background:'var(--color-primary)', boxShadow:'0 8px 32px -8px var(--color-primary)80' }}>
                {saving ? <><Loader2 size={20} className="animate-spin"/> Guardando...</> : <><Save size={20}/> Guardar Lista</>}
              </motion.button>
              {dirty && <p className="text-center text-caption font-black uppercase tracking-widest opacity-40 mt-2 text-[var(--color-text)]">Cambios sin guardar</p>}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB — ALUMNOS (CRUD) — CON MODAL UNIFICADO
      ══════════════════════════════════════════════════ */}
      {tab === 'alumnos' && (
        <div className="space-y-2.5">
          {aluLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-[var(--color-primary)]" size={32}/></div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center opacity-30">
              <Users size={40} className="mx-auto mb-3"/>
              <p className="text-label font-black uppercase tracking-widest text-[var(--color-text)]">{searchTerm ? 'Sin coincidencias' : 'Sin alumnos'}</p>
            </div>
          ) : filtered.map((alumno: any, i: number) => {
            const beltInfo     = getCintaInfo(alumno.idgradoactual);
            const beltColorName = beltInfo?.color || 'Blanca';
            const hex          = getBeltHex(beltColorName);
            const stripeName   = beltInfo?.color_stripe || null;
            const tieneDeuda   = (alumno.total_deuda || 0) > 0;
            return (
              <motion.div key={alumno.idalumno} layout
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.02 }}
                className={`relative bg-[var(--color-card)]/40 backdrop-blur-xl p-3 rounded-[1.8rem] border border-[var(--color-border)] shadow-xl overflow-hidden transition-all ${tieneDeuda ? 'border-red-500/20' : ''}`}>
                <div className="absolute left-0 top-0 bottom-0 w-[4px] opacity-30" style={{ backgroundColor: hex }}/>
                <div className="flex items-center gap-3 ml-1">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-black/20 border-[3px] overflow-hidden flex items-center justify-center"
                      style={{ borderColor: hex, boxShadow:`0 0 10px -2px ${hex}44` }}>
                      {alumno.fotoalumno
                        ? <img src={alumno.fotoalumno} className="w-full h-full object-cover" alt=""/>
                        : <UserIcon size={20} className="text-[var(--color-text-muted)] opacity-30"/>}
                    </div>
                    <div className="absolute -bottom-1 -right-1 border-2 rounded-md shadow-lg z-20 overflow-hidden" style={{ borderColor:'var(--color-background)' }}>
                      <MiniCintaBelt colorName={beltColorName} stripeName={stripeName} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-label font-black uppercase italic tracking-tighter text-[var(--color-text)] truncate leading-none">
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
                        <MiniCintaBelt colorName={beltColorName} stripeName={stripeName} />
                        <span className="text-caption font-black uppercase tracking-wide"
                          style={{ color: hex === '#f8f8f8' ? 'var(--color-text-muted)' : hex }}>
                          {beltInfo.nivelkupdan}
                          {beltInfo.color_stripe && <span className="opacity-60"> / {beltInfo.color_stripe}</span>}
                        </span>
                      </div>
                    )}
                    <span className="text-caption font-bold flex items-center gap-1 text-[var(--color-text-muted)]">
                      <Phone size={8} className="text-emerald-500 flex-shrink-0"/>
                      {alumno.telefonocontacto || 'S/T'}
                    </span>
                  </div>
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
          TAB — RESUMEN (sin cambios)
      ══════════════════════════════════════════════════ */}
      {tab === 'resumen' && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {[7,14,30,60].map(d => (
              <button key={d} onClick={() => setResDias(d)}
                className="h-8 px-3 rounded-xl text-caption font-black uppercase tracking-widest border transition-all"
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
              <p className="text-label font-black uppercase tracking-widest text-[var(--color-text)]">Sin datos</p>
            </div>
          ) : resumen.map((alumno, i) => {
            const hex      = getBeltHex(alumno.cinta_color);
            const stripeName = (alumno as any).cinta_stripe;
            const pct      = alumno.porcentaje;
            const barColor = pct === null ? '#6b7280' : pct >= 80 ? '#22c55e' : pct >= 60 ? '#f97316' : '#ef4444';
            return (
              <motion.div key={alumno.idalumno}
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.02 }}
                className="bg-[var(--color-card)] rounded-[1.5rem] border border-[var(--color-border)] p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border-2 overflow-hidden relative"
                    style={{ borderColor: hex+'60', background:'var(--color-background)' }}>
                    {alumno.foto
                      ? <img src={alumno.foto} className="w-full h-full object-cover" alt=""/>
                      : <span className="text-datos font-black" style={{ color:'var(--color-text-muted)' }}>{alumno.nombre_completo.charAt(0)}</span>
                    }
                    <div className="absolute -bottom-0.5 -right-0.5 border rounded overflow-hidden z-10" style={{ borderColor:'var(--color-background)' }}>
                      <MiniCintaBelt colorName={alumno.cinta_color} stripeName={stripeName} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-label font-black uppercase italic tracking-tighter truncate text-[var(--color-text)]">
                      {alumno.nombre_completo}
                    </p>
                    <span className="text-caption font-black uppercase tracking-wide"
                      style={{ color: hex === '#f8f8f8' ? 'var(--color-text-muted)' : hex }}>
                      {alumno.cinta_nivel || '—'}
                    </span>
                  </div>
                  {pct !== null ? (
                    <div className="px-2 py-0.5 rounded-full flex-shrink-0" style={{ background:`${barColor}18`, border:`1px solid ${barColor}35` }}>
                      <span className="text-caption font-black" style={{ color:barColor }}>{pct}%</span>
                    </div>
                  ) : (
                    <span className="text-caption opacity-30 font-bold text-[var(--color-text)]">—</span>
                  )}
                </div>
                {pct !== null && (
                  <div className="space-y-1">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'var(--color-background)' }}>
                      <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:0.6, delay:i*0.02 }}
                        className="h-full rounded-full" style={{ backgroundColor: barColor }}/>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-label font-bold opacity-40 text-[var(--color-text)]">{alumno.presentes}✓ · {alumno.ausentes}✗</span>
                      <span className="text-label font-bold opacity-40 text-[var(--color-text)]">{alumno.total_dias} días</span>
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
        MODAL ALUMNOS (IDÉNTICO A GestionAlumnos)
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
                  <h3 className="text-datos font-black italic uppercase tracking-tighter leading-none">
                    {isEditing ? 'Actualizar Perfil' : step === 'detail' ? 'Expediente Completo' : 'Nueva Inscripción'}
                  </h3>
                  <p className="text-[6px] font-black uppercase tracking-[0.3em] opacity-70 mt-1">TKW SYSTEM</p>
                </div>
              </div>
              <button onClick={() => { stopCamera(); setIsModalOpen(false); }} className="p-1.5 bg-black/20 rounded-full">
                <X size={16}/>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 text-left">
              {/* PASO: FORM (IDÉNTICO A GestionAlumnos) */}
              {step === 'form' && (
                <form onSubmit={handleSave} className="space-y-8 pb-10">
                  
                  {/* SECCIÓN IDENTIDAD MARCIAL */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[var(--color-primary)] opacity-80 font-black italic">
                      <UserIcon size={14} /><span className="text-caption uppercase tracking-[0.2em]">Identidad Marcial</span>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <InputField label="Nombres" name="nombres" value={formData.nombres} onChange={handleInputChange} error={errors.nombres} required placeholder="Juan Román" />
                      <div className="grid grid-cols-2 gap-4">
                        <InputField label="Apellido Paterno" name="apellidopaterno" value={formData.apellidopaterno} onChange={handleInputChange} error={errors.apellidopaterno} required placeholder="Riquelme" />
                        <InputField label="Apellido Materno" name="apellidomaterno" value={formData.apellidomaterno} onChange={handleInputChange} placeholder="Opcional" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-label font-black uppercase ml-2 text-[var(--color-text-muted)] tracking-widest">Grado Dojo Actual</label>
                          {/* Preview cinta */}
                          {formData.idgradoactual && (() => {
                            const sel = cintas.find((c: any) => c.idgrado === Number(formData.idgradoactual));
                            return sel ? (
                              <div className="flex items-center gap-2 px-3 py-1.5 mb-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)]/50">
                                <MiniCintaBelt colorName={sel.color} stripeName={sel.color_stripe} />
                                <span className="text-caption font-black uppercase tracking-wider" style={{ color: getBeltHex(sel.color) === '#f8f8f8' ? 'var(--color-text-muted)' : getBeltHex(sel.color) }}>
                                  {sel.nivelkupdan}
                                </span>
                                {sel.color_stripe && <span className="text-caption font-bold text-[var(--color-text-muted)]">· franja {sel.color_stripe}</span>}
                              </div>
                            ) : null;
                          })()}
                          <select
                            required
                            className="w-full h-11 px-4 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none font-black text-caption uppercase text-[var(--color-text)] appearance-none cursor-pointer shadow-inner"
                            value={formData.idgradoactual}
                            onChange={e => handleInputChange('idgradoactual', e.target.value)}
                          >
                            {cintas.map((c: any) => (
                              <option key={c.idgrado} value={c.idgrado}>
                                {c.nivelkupdan} — {c.color}{c.color_stripe ? ` / ${c.color_stripe}` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        {isEditing && (
                          <div className="space-y-1">
                            <label className="text-label font-black uppercase ml-2 text-[var(--color-text-muted)] tracking-widest">Estatus Alumno</label>
                            <select className="w-full h-11 px-4 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none font-black text-caption uppercase text-[var(--color-text)] appearance-none cursor-pointer shadow-inner" value={formData.estatus} onChange={e => handleInputChange('estatus', e.target.value)}>
                              <option value={1}>ACTIVO</option>
                              <option value={0}>INACTIVO</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SOLO PARA ALTA: FAMILIA Y AVISOS + MÉDICOS */}
                  {!isEditing && (
                    <>
                      {/* SECCIÓN FAMILIA Y AVISOS */}
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-2 text-[var(--color-primary)] opacity-80 font-black italic">
                          <Mail size={14} /><span className="text-caption uppercase tracking-[0.2em]">Familia y Avisos</span>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <InputField label="F. Nacimiento" name="fechanacimiento" type="date" value={formData.fechanacimiento} onChange={handleInputChange} error={errors.fechanacimiento} required />
                          <InputField label="Email del Tutor (Vital para Avisos)" name="correotutor" type="email" value={formData.correotutor} onChange={handleInputChange} error={errors.correotutor} required placeholder="tutor@dominio.com" />
                          <div className="grid grid-cols-2 gap-4">
                            <InputField label="Nombre Completo Tutor" name="nombretutor" value={formData.nombretutor} onChange={handleInputChange} error={errors.nombretutor} required placeholder="Nombre del padre/madre" />
                            <InputField label="WhatsApp Contacto" name="telefonocontacto" maxLength={10} value={formData.telefonocontacto} onChange={handleInputChange} error={errors.telefonocontacto} required placeholder="10 dígitos" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-label font-black uppercase ml-2 text-[var(--color-text-muted)] tracking-widest">Instructor Responsable <span className="text-red-500 font-bold">*</span></label>
                            <select 
                              className={`w-full h-11 px-4 bg-[var(--color-background)] rounded-xl border ${errors.idprofesor ? 'border-red-500' : 'border-[var(--color-border)]'} focus:border-[var(--color-primary)] outline-none font-black text-caption uppercase text-[var(--color-text)] appearance-none cursor-pointer transition-all`} 
                              value={formData.idprofesor || ''} 
                              onChange={e => handleInputChange('idprofesor', e.target.value)}
                            >
                              <option value="">Seleccionar Maestro</option>
                              {profesores.map(p => <option key={p.idprofesor} value={p.idprofesor}>{p.nombrecompleto}</option>)}
                            </select>
                            {errors.idprofesor && <p className="text-label text-red-500 ml-2 font-bold uppercase italic">{errors.idprofesor}</p>}
                          </div>
                          <div className="space-y-1">
                            <label className="text-label font-black uppercase ml-2 text-[var(--color-text-muted)] tracking-widest">Dirección de Domicilio <span className="text-red-500 font-bold">*</span></label>
                            <textarea rows={2} className={`w-full p-4 bg-[var(--color-background)] rounded-xl border ${errors.direcciondomicilio ? 'border-red-500' : 'border-[var(--color-border)]'} focus:border-[var(--color-primary)] outline-none font-bold text-caption text-[var(--color-text)] resize-none transition-all placeholder:opacity-20`} placeholder="Calle, número, colonia..." value={formData.direcciondomicilio} onChange={e => handleInputChange('direcciondomicilio', e.target.value)} />
                            {errors.direcciondomicilio && <p className="text-label text-red-500 ml-2 font-bold uppercase italic">{errors.direcciondomicilio}</p>}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <InputField label="Emergencia (Nombre)" name="contacto_emergencia_nombre" value={formData.contacto_emergencia_nombre} onChange={handleInputChange} error={errors.contacto_emergencia_nombre} required placeholder="Llamar a..." />
                            <InputField label="Emergencia (Tel)" name="contacto_emergencia_tel" maxLength={10} value={formData.contacto_emergencia_tel} onChange={handleInputChange} error={errors.contacto_emergencia_tel} required placeholder="Teléfono" />
                          </div>
                        </div>
                      </div>

                      {/* SECCIÓN FICHA MÉDICA */}
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-2 text-[var(--color-primary)] opacity-80 font-black italic">
                          <HeartPulse size={14} /><span className="text-caption uppercase tracking-[0.2em]">Ficha Médica</span>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <label className="text-label font-black uppercase ml-2 text-[var(--color-text-muted)] tracking-widest flex items-center gap-1">Sangre <span className="text-red-500 font-bold text-label">*</span></label>
                              <select className="w-full h-11 px-4 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none font-black text-caption uppercase text-[var(--color-text)]" value={formData.tipo_sangre} onChange={e => handleInputChange('tipo_sangre', e.target.value)}>
                                <option value="O+">O+</option><option value="O-">O-</option><option value="A+">A+</option><option value="B+">B+</option><option value="AB+">AB+</option>
                              </select>
                            </div>
                            <div className="col-span-2">
                              <div className="space-y-1">
                                <label className="text-label font-black uppercase ml-2 text-[var(--color-text-muted)] tracking-widest flex items-center gap-1">Seguro Médico <span className="text-red-500 font-bold text-label">*</span></label>
                                <select className="w-full h-11 px-4 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none font-black text-caption uppercase text-[var(--color-text)] appearance-none cursor-pointer transition-all shadow-inner" value={formData.seguro_medico} onChange={e => handleInputChange('seguro_medico', e.target.value)}>
                                  <option value="No cuenta">No cuenta</option>
                                  <option value="IMSS">IMSS</option>
                                  <option value="ISSSTE">ISSSTE</option>
                                  <option value="Privado">Seguro Privado</option>
                                  <option value="Otro">Otro</option>
                                </select>
                              </div>
                            </div>
                          </div>
                          <InputField label="NSS / Póliza de Seguro" name="nss_o_poliza" value={formData.nss_o_poliza} onChange={handleInputChange} error={errors.nss_o_poliza} required={formData.seguro_medico !== 'No cuenta'} placeholder="11 dígitos" maxLength={11} />
                          <InputField label="Alergias o Padecimientos" name="alergias" value={formData.alergias} onChange={handleInputChange} placeholder="Ninguna" />
                        </div>
                      </div>
                    </>
                  )}

                  <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={savingAlu}
                    className="w-full h-16 bg-[var(--color-primary)] text-white font-black rounded-[2rem] shadow-xl flex items-center justify-center gap-3 active:brightness-125 transition-all mt-6">
                    {savingAlu ? <Loader2 className="animate-spin" size={24} /> : <><Save size={24}/> <span className="text-datos uppercase italic tracking-tighter font-black">{isEditing ? 'Sincronizar Perfil' : 'Completar Registro'}</span></>}
                  </motion.button>
                </form>
              )}

              {/* PASO: DETAIL (EXPEDIENTE COMPLETO) — igual a GestionAlumnos */}
              {step === 'detail' && selectedAlumno && (
                <div className="space-y-6 pb-6 text-left">
                  {/* Encabezado */}
                  <div className="flex items-center gap-5 p-5 bg-[var(--color-background)] rounded-[2.2rem] border border-[var(--color-border)] shadow-sm">
                    <div className="w-24 h-24 rounded-[1.8rem] bg-black/20 border-4 shadow-2xl flex items-center justify-center overflow-hidden flex-shrink-0"
                      style={{ borderColor: getBeltHex(getCintaInfo(selectedAlumno.idgradoactual)?.color || "Blanca") }}>
                      {selectedAlumno.fotoalumno ? <img src={selectedAlumno.fotoalumno} className="w-full h-full object-cover" alt="" /> : <UserIcon size={36} className="text-[var(--color-text-muted)] opacity-30" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getCintaInfo(selectedAlumno.idgradoactual) && (
                          <MiniCintaBelt
                            colorName={getCintaInfo(selectedAlumno.idgradoactual)?.color || "Blanca"}
                            stripeName={getCintaInfo(selectedAlumno.idgradoactual)?.color_stripe}
                          />
                        )}
                        <span className="text-caption font-black uppercase text-[var(--color-primary)] tracking-widest">{getCintaInfo(selectedAlumno.idgradoactual)?.nivelkupdan}</span>
                      </div>
                      <h2 className="text-subtitulo font-black italic uppercase tracking-tighter text-[var(--color-text)] leading-tight truncate">{selectedAlumno.nombres}</h2>
                      <h3 className="text-datos font-bold text-[var(--color-text-muted)] uppercase tracking-tighter">{selectedAlumno.apellidopaterno} {selectedAlumno.apellidomaterno}</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5">
                    {/* Adeudos */}
                    {(selectedAlumno.total_deuda || 0) > 0 && (
                      <div className="bg-red-500/10 p-5 rounded-[2rem] border border-red-500/20 space-y-4">
                        <div className="flex items-center justify-between text-red-500">
                          <div className="flex items-center gap-2"><ShieldAlert size={16} /><span className="text-caption font-black uppercase tracking-widest">Adeudos Pendientes</span></div>
                          <span className="text-subtitulo font-black">${selectedAlumno.total_deuda}</span>
                        </div>
                        <div className="space-y-2">
                          {(selectedAlumno.pagos_pendientes_detalle || []).map((p: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-caption text-[var(--color-text)] opacity-80 bg-white/5 p-3 rounded-xl border border-red-500/5">
                              <div className="flex items-center gap-2"><DollarSign size={12} className="text-red-500" /><span>{p.concepto}</span></div>
                              <span className="font-black text-red-500 text-label">${p.monto}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Identidad y Contacto */}
                    <div className="bg-[var(--color-card)] p-6 rounded-[2.2rem] border border-[var(--color-border)] space-y-5">
                      <div className="flex items-center gap-2 text-[var(--color-primary)] font-black uppercase text-caption tracking-widest"><UserCircle size={14}/> Identidad y Contacto</div>
                      <div className="grid grid-cols-2 gap-5">
                        <div><p className="text-label font-black uppercase text-[var(--color-text-muted)] opacity-50">Nacimiento</p><p className="text-label font-bold text-[var(--color-text)] flex items-center gap-1"><CalendarDays size={10} /> {selectedAlumno.fechanacimiento || '---'}</p></div>
                        <div><p className="text-label font-black uppercase text-[var(--color-text-muted)] opacity-50">Email Tutor</p><p className="text-label font-bold text-[var(--color-text)] truncate">{selectedAlumno.correotutor}</p></div>
                        <div><p className="text-label font-black uppercase text-[var(--color-text-muted)] opacity-50">Nombre Tutor</p><p className="text-label font-bold text-[var(--color-text)] italic">{selectedAlumno.nombretutor || 'No registrado'}</p></div>
                        <div><p className="text-label font-black uppercase text-[var(--color-text-muted)] opacity-50">WhatsApp</p><p className="text-label font-bold text-[var(--color-text)]">{selectedAlumno.telefonocontacto || 'S/T'}</p></div>
                        <div className="col-span-2 border-t border-white/5 pt-3"><p className="text-label font-black uppercase text-[var(--color-text-muted)] opacity-50">Domicilio</p><p className="text-caption font-bold text-[var(--color-text)]"><MapPin size={10} className="inline mr-1 text-red-500" /> {selectedAlumno.direcciondomicilio || 'No especificado'}</p></div>
                      </div>
                    </div>

                    {/* Emergencia y Salud */}
                    <div className="bg-[var(--color-card)] p-6 rounded-[2.2rem] border border-[var(--color-border)] space-y-5">
                      <div className="flex items-center gap-2 text-red-500 font-black uppercase text-caption tracking-widest"><Heart size={14}/> Ficha Médica y Emergencia</div>
                      <div className="grid grid-cols-2 gap-5">
                        <div className="col-span-2 bg-red-500/5 p-4 rounded-2xl border border-red-500/10">
                          <p className="text-label font-black uppercase text-red-500 opacity-60 mb-1">En caso de Emergencia</p>
                          <p className="text-datos font-black text-red-500 uppercase">{selectedAlumno.contacto_emergencia_nombre || 'S/D'}</p>
                          <p className="text-seccion font-black text-red-500 mt-1 flex items-center gap-2"><PhoneForwarded size={16} /> {selectedAlumno.contacto_emergencia_tel || '---'}</p>
                        </div>
                        <div><p className="text-label font-black uppercase text-[var(--color-text-muted)] opacity-50">Tipo Sangre</p><p className="text-datos font-black text-red-500">{selectedAlumno.tipo_sangre || 'S/D'}</p></div>
                        <div><p className="text-label font-black uppercase text-[var(--color-text-muted)] opacity-50">Seguro Médico</p><p className="text-caption font-bold uppercase">{selectedAlumno.seguro_medico}: {selectedAlumno.nss_o_poliza || 'S/N'}</p></div>
                        <div className="col-span-2"><p className="text-label font-black uppercase text-[var(--color-text-muted)] opacity-50">Alergias / Padecimientos</p><p className="text-label font-bold italic">{selectedAlumno.alergias} / {selectedAlumno.padecimientos_cronicos}</p></div>
                      </div>
                    </div>

                    {/* Académico */}
                    <div className="bg-[var(--color-card)] p-6 rounded-[2.2rem] border border-[var(--color-border)] space-y-5">
                      <div className="flex items-center gap-2 text-indigo-500 font-black uppercase text-caption tracking-widest"><BookOpen size={14}/> Académico y Registro</div>
                      <div className="grid grid-cols-2 gap-5">
                        <div><p className="text-label font-black uppercase text-[var(--color-text-muted)] opacity-50">Grado Escolar</p><p className="text-label font-bold">{selectedAlumno.grado_escolar || '---'}</p></div>
                        <div><p className="text-label font-black uppercase text-[var(--color-text-muted)] opacity-50">Escuela Procedencia</p><p className="text-label font-bold">{selectedAlumno.escuela_procedencia || 'Ninguna'}</p></div>
                        <div><p className="text-label font-black uppercase text-[var(--color-text-muted)] opacity-50">Matrícula</p><p className="text-datos font-black text-[var(--color-primary)]">ID #{selectedAlumno.idalumno}</p></div>
                        <div><p className="text-label font-black uppercase text-[var(--color-text-muted)] opacity-50">Fecha de Alta</p><p className="text-caption font-bold">{selectedAlumno.fecharegistro ? new Date(selectedAlumno.fecharegistro).toLocaleDateString() : '---'}</p></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO: PHOTO CHOICE, CAMERA, PREVIEW — ya existente */}
              {step === 'photo_choice' && (
                <div className="py-10 text-center space-y-10">
                  <div className="grid grid-cols-2 gap-6">
                    <button onClick={() => fileRef.current?.click()} className="flex flex-col items-center justify-center gap-4 p-10 bg-[var(--color-background)] rounded-[3rem] border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all group active:scale-95">
                      <ImagePlus className="text-[var(--color-primary)]" size={32} />
                      <span className="text-caption font-black uppercase text-[var(--color-text-muted)] tracking-widest">Galería</span>
                    </button>
                    <button onClick={startCamera} className="flex flex-col items-center justify-center gap-4 p-10 bg-[var(--color-background)] rounded-[3rem] border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all group active:scale-95">
                      <CameraIcon className="text-[var(--color-primary)]" size={32} />
                      <span className="text-caption font-black uppercase text-[var(--color-text-muted)] tracking-widest">Cámara</span>
                    </button>
                  </div>
                  <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if(f) { setTempFile(f); setStep('preview'); } }} />
                  <button onClick={() => setIsModalOpen(false)} className="text-caption font-black uppercase text-[var(--color-text-muted)] border-b border-transparent hover:border-[var(--color-primary)] transition-all opacity-50 tracking-widest">Omitir por ahora</button>
                </div>
              )}

              {step === 'camera' && (
                <div className="space-y-10 text-center py-4 flex flex-col items-center">
                  <div className="w-64 h-64 bg-black rounded-[4.5rem] border-4 border-[var(--color-primary)] overflow-hidden relative shadow-2xl scale-x-[-1]">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  </div>
                  <button onClick={capture} className="w-16 h-16 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 border-8 border-[var(--color-card)]"><CameraIcon size={24} /></button>
                </div>
              )}

              {step === 'preview' && (
                <div className="text-center space-y-10 py-6 flex flex-col items-center">
                  <div className="w-56 h-56 rounded-[4rem] border-4 border-[var(--color-primary)] overflow-hidden shadow-2xl relative">
                    {tempFile && <img src={URL.createObjectURL(tempFile)} className="w-full h-full object-cover" alt="Preview" />}
                    {savingAlu && <div className="absolute inset-0 bg-black/70 flex items-center justify-center"><Loader2 className="animate-spin text-white" size={32} /></div>}
                  </div>
                  <div className="flex flex-col gap-4 w-full px-10">
                    <motion.button whileTap={{ scale: 0.95 }} onClick={confirmUpload} disabled={savingAlu} className="w-full h-16 bg-[var(--color-text)] text-[var(--color-card)] font-black rounded-[2.5rem] flex items-center justify-center gap-3 shadow-2xl border border-black/10">
                      <CheckCircle2 size={24} className="text-[var(--color-primary)]" /> <span className="text-datos uppercase italic tracking-tighter font-black">Actualizar Foto</span>
                    </motion.button>
                    <button onClick={() => setStep('photo_choice')} disabled={savingAlu} className="text-caption font-black uppercase text-[var(--color-text-muted)] tracking-widest opacity-60 flex items-center justify-center gap-2"><RotateCcw size={14}/> Reintentar</button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* ── MODAL LINK / QR DE INSCRIPCIÓN ── portal ────────── */}
    {idProfesorActual && createPortal(
      <AnimatePresence>
        {modalLink && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-4"
            onClick={() => setModalLink(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.93 }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
              className="bg-[var(--color-card)] rounded-3xl border border-[var(--color-border)] p-6 w-full max-w-sm shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                    <Link2 size={16} className="text-[var(--color-primary)]"/>
                  </div>
                  <h2 className="text-datos font-black text-[var(--color-text)]">Inscribir Alumno</h2>
                </div>
                <button
                  onClick={() => setModalLink(false)}
                  className="w-7 h-7 rounded-xl bg-[var(--color-border)]/50 flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-border)] transition-colors"
                >
                  <X size={14}/>
                </button>
              </div>

              <ModalCompartirLinkProfesor
                idprofesor={idProfesorActual}
                onClose={() => setModalLink(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>
  );
};

export default PaseListaView;