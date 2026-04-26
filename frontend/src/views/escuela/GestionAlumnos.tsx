import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, UserPlus, X, Loader2, Smartphone, 
  User as UserIcon, Phone, 
  Briefcase, CameraIcon, Eye, Save, HeartPulse, 
  Edit3, DollarSign, ImagePlus, CheckCircle2,
  GraduationCap, RotateCcw, MapPin, Heart, BookOpen, ShieldAlert, Mail, UserCircle, CalendarDays, PhoneForwarded,
  Link2, Copy, CheckCheck, QrCode, UserPlus as UserPlusIcon
} from 'lucide-react';

/**
 * --- NOTA PARA EL DESARROLLADOR ---
 * Para que el Canvas pueda previsualizar la interfaz sin errores de compilación,
 * hemos definido mocks internos de los servicios. En tu entorno local de desarrollo,
 * simplemente DESCOMENTA las importaciones reales de abajo y elimina los mocks.
 */

import api from '../../api/axios';
import { alumnoService } from '../../services/alumno.service';
import { profesorService } from '../../services/profesor.service';
import { cintasService } from '../../services/cintas.service';

/**
 * MAPA TÉCNICO DE COLORES DE CINTAS
 */
const BELT_COLORS: Record<string, string> = {
  "Blanca": "#f8f8f8", "Crema": "#fffde7", "Marfil": "#fffff0",
  "Amarilla": "#facc15", "Dorada": "#d97706", "Naranja": "#f97316",
  "Verde": "#16a34a", "Verde Claro": "#4ade80", "Verde Oscuro": "#14532d",
  "Celeste": "#38bdf8", "Azul": "#2563eb", "Azul Marino": "#1e40af", "Cian": "#06b6d4",
  "Coral": "#ff6b6b", "Roja": "#dc2626", "Guinda": "#881337", "Granate": "#991b1b",
  "Lila": "#c084fc", "Morada": "#7c3aed", "Purpura": "#9333ea",
  "Rosa": "#ec4899", "Fucsia": "#db2777",
  "Cafe Claro": "#a16207", "Cafe": "#7c2d12", "Vino": "#7f1d1d",
  "Gris": "#6b7280", "Plateada": "#d1d5db", "Negra": "#111111",
  // aliases
  "Marrón": "#7c2d12", "Café": "#7c2d12", "Negro": "#111111",
};

// Helper para obtener hex de cualquier nombre de color (case-insensitive)
function getBeltHex(colorName: string): string {
  if (!colorName) return "#f8f8f8";
  const direct = BELT_COLORS[colorName];
  if (direct) return direct;
  // case-insensitive fallback
  const key = Object.keys(BELT_COLORS).find(k => k.toLowerCase() === colorName.toLowerCase());
  return key ? BELT_COLORS[key] : "#888888";
}
// Mini visual de cinta para tarjetas de alumno
function MiniCintaBelt({ colorName, stripeName }: { colorName: string; stripeName?: string | null }) {
  const bg = getBeltHex(colorName);
  const stripeBg = stripeName ? getBeltHex(stripeName) : null;
  return (
    <div className="relative w-10 h-3 rounded-sm overflow-hidden border border-white/10 shadow-inner shrink-0"
         style={{ background: bg }}>
      {stripeBg && (
        <div className="absolute right-1 top-0 bottom-0 w-[20%]" style={{ background: stripeBg }} />
      )}
    </div>
  );
}


/**
 * COMPONENTE HELPER: InputField
 * Definido fuera del componente principal para evitar pérdida de foco y lag al escribir.
 */
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
    <label className="text-[7px] font-black uppercase ml-2 text-[var(--color-text-muted)] tracking-widest flex items-center gap-1">
      {label} {required && <span className="text-red-500 font-bold text-xs">*</span>}
    </label>
    <input 
      type={type}
      placeholder={placeholder}
      maxLength={maxLength}
      className={`w-full h-11 px-4 bg-[var(--color-background)] rounded-xl border ${error ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'border-[var(--color-border)]'} focus:border-[var(--color-primary)] outline-none font-bold text-[11px] text-[var(--color-text)] shadow-inner transition-all placeholder:opacity-20`} 
      value={value} 
      onChange={e => onChange(name, e.target.value)} 
    />
    <AnimatePresence>
      {error && (
        <motion.p 
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
          className="text-[7px] text-red-500 ml-2 font-black uppercase italic tracking-tighter overflow-hidden"
        >
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);

// ─── Modal compartir link de inscripción ──────────────────────
function ModalCompartirLink({ onClose }: { onClose: () => void }) {
  const [copiado, setCopiado]         = useState(false);
  const [verQR, setVerQR]             = useState(false);
  const [nombreEscuela, setNombre]    = useState('');
  const [loadingSlug, setLoadingSlug] = useState(true);

  // Cargar nombre real de la escuela desde el API (igual que EscuelaDashboard)
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<any>('/escuelas/escuelas/mi-escuela');
        const d = res.data;
        const nombre = d?.nombreescuela ?? d?.escuela?.nombreescuela ?? '';
        if (nombre) setNombre(nombre);
      } catch {}
      finally { setLoadingSlug(false); }
    })();
  }, []);

  const slug = nombreEscuela
    .toLowerCase().trim()
    .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e')
    .replace(/[íìï]/g,'i').replace(/[óòö]/g,'o')
    .replace(/[úùü]/g,'u').replace(/[ñ]/g,'n')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

  const url = `${window.location.origin}/registro/${slug}`;

  const copiar = async () => {
    try { await navigator.clipboard.writeText(url); }
    catch { const t = document.createElement('textarea'); t.value = url; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const compartirNativo = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Formulario de Inscripción', text: 'Regístrate en nuestra escuela de Taekwondo', url });
    } else { copiar(); }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 p-3 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)]">
        <Link2 size={13} className="text-[var(--color-primary)] shrink-0"/>
        {loadingSlug
          ? <span className="text-[11px] text-[var(--color-text-muted)] italic">Cargando...</span>
          : <span className="text-[11px] text-[var(--color-text)] font-mono truncate flex-1">{url}</span>
        }
      </div>
      <div className="grid grid-cols-3 gap-2">
        <motion.button whileTap={{scale:0.95}} onClick={copiar}
          className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-[var(--color-border)] transition-all"
          style={{ background: copiado ? 'rgba(34,197,94,0.1)' : 'var(--color-background)', color: copiado ? '#22c55e' : 'var(--color-text-muted)', borderColor: copiado ? '#22c55e44' : undefined }}>
          {copiado ? <CheckCheck size={18}/> : <Copy size={18}/>}
          <span className="text-[9px] font-bold">{copiado ? '¡Copiado!' : 'Copiar'}</span>
        </motion.button>
        <motion.button whileTap={{scale:0.95}} onClick={compartirNativo}
          className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)] transition-all hover:bg-[var(--color-primary)]/20">
          <Smartphone size={18}/>
          <span className="text-[9px] font-bold">Compartir</span>
        </motion.button>
        <motion.button whileTap={{scale:0.95}} onClick={() => setVerQR(v => !v)}
          className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${verQR ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-muted)]'}`}>
          <QrCode size={18}/>
          <span className="text-[9px] font-bold">QR</span>
        </motion.button>
      </div>
      <AnimatePresence>
        {verQR && (
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className="overflow-hidden">
            <div className="flex flex-col items-center gap-3 pt-1">
              <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}&margin=4`} alt="QR" className="w-[160px] h-[160px]"/>
              </div>
              <button onClick={() => { const a = document.createElement('a'); a.href = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}&margin=10`; a.download = `qr-inscripcion-${slug}.png`; a.click(); }}
                className="text-[10px] font-bold text-[var(--color-primary)] flex items-center gap-1">
                Descargar QR
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <p className="text-[9px] text-[var(--color-text-muted)] text-center leading-relaxed">
        Comparte este link para que los alumnos llenen su registro. Los datos se guardan automáticamente.
      </p>
    </div>
  );
}

/**
 * COMPONENTE PRINCIPAL: GESTIÓN DE ALUMNOS
 */
export const App: React.FC = () => {
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [profesores, setProfesores] = useState<any[]>([]);
  const [cintas, setCintas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProf, setFilterProf] = useState<number | 'all'>('all');
  const [filterCinta, setFilterCinta] = useState<number | 'all'>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLink, setModalLink]     = useState(false);
  const [step, setStep] = useState<'form' | 'detail' | 'photo_choice' | 'camera' | 'preview'>('form');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAlumno, setSelectedAlumno] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modal asignar profesor (alumnos sin profesor)
  const [modalAsignar, setModalAsignar] = useState<{ open: boolean; alumno: any | null }>({ open: false, alumno: null });
  const [asignandoProf, setAsignandoProf] = useState(false);
  const [profSeleccionado, setProfSeleccionado] = useState<number | ''>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [tempFile, setTempFile] = useState<File | null>(null);

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
    idprofesor: null,
    estatus: 1
  };

  const [formData, setFormData] = useState<any>(initialFormState);

  // --- CARGA DE DATOS ---
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [aluRes, profRes, cintaRes] = await Promise.all([
        alumnoService?.getAlumnos?.() || Promise.resolve([]),
        profesorService?.listarProfesores?.() || Promise.resolve([]),
        cintasService.listarGrados(),   // /grados/mi-escuela — cintas de la escuela
      ]);
      setAlumnos(aluRes || []);
      setProfesores(profRes || []);
      // Ordenar por campo `orden` ASC (menor orden = grado más alto, o viceversa según tu BD)
      const sorted = (cintaRes || []).slice().sort((a: any, b: any) => (a.orden ?? 99) - (b.orden ?? 99));
      setCintas(sorted);
    } catch (err) { 
      console.error("Error al sincronizar datos:", err);
    } 
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // --- ASIGNAR / REASIGNAR PROFESOR ---
  const handleAsignarProfesor = async () => {
    if (!profSeleccionado || !modalAsignar.alumno) return;
    setAsignandoProf(true);
    try {
      const { data } = await api.put(
        `/alumnos/${modalAsignar.alumno.idalumno}/asignar-profesor`,
        null,
        { params: { idprofesor: Number(profSeleccionado) } }
      );
      setAlumnos(prev => prev.map(a =>
        a.idalumno === modalAsignar.alumno.idalumno ? { ...a, idprofesor: Number(profSeleccionado) } : a
      ));
      setModalAsignar({ open: false, alumno: null });
      setProfSeleccionado('');
    } catch (e: any) {
      console.error('Error al asignar profesor:', e?.response?.data?.detail ?? e);
    } finally {
      setAsignandoProf(false);
    }
  };

  // --- VALIDACIONES ---
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

  // --- MANEJADORES DE FLUJO ---
  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData(initialFormState);
    setErrors({});
    setStep('form');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (alumno: any) => {
    setIsEditing(true);
    setSelectedAlumno(alumno);
    setFormData({ ...alumno });
    setErrors({});
    setStep('form');
    setIsModalOpen(true);
  };

  const handleOpenPhotoUpload = (alumno: any) => {
    setSelectedAlumno(alumno);
    setStep('photo_choice');
    setIsModalOpen(true);
  };

  const handleOpenDetail = async (id: number) => {
    try {
      setStep('detail');
      setIsModalOpen(true);
      if (alumnoService?.getDetalle) {
        const fullAlumno = await alumnoService.getDetalle(id);
        setSelectedAlumno(fullAlumno);
      }
    } catch (err) { console.error(err); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
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
      } else {
        const res = await alumnoService.registrar(formData);
        setSelectedAlumno(res);
        setAlumnos(prev => [...prev, res]);
        setStep('photo_choice');
      }
    } catch (err) { console.error(err); } 
    finally { setSaving(false); }
  };

  // --- GESTIÓN DE FOTOGRAFÍA ---
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 640 } });
      streamRef.current = stream;
      setStep('camera');
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch (err) { console.error(err); }
  };

  const stopCamera = () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }
  };

  const capture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600; canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (ctx && videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0, 600, 600);
      canvas.toBlob(blob => {
        if (blob && selectedAlumno) {
          const file = new File([blob], `profile.jpg`, { type: 'image/jpeg' });
          setTempFile(file);
          setStep('preview');
        }
      }, 'image/jpeg');
    }
  };

  const confirmUpload = async () => {
    if (!tempFile || !selectedAlumno) return;
    setSaving(true);
    try {
      const res = await alumnoService.subirFoto(selectedAlumno.idalumno, tempFile);
      setAlumnos(prev => prev.map(a => a.idalumno === res.idalumno ? res : a));
      setIsModalOpen(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const getCintaInfo = (id: number) => cintas.find(c => c.idgrado === id);

  const filtered = useMemo(() => {
    return (alumnos || []).filter(a => {
      const full = `${a.nombres} ${a.apellidopaterno}`.toLowerCase();
      return full.includes(searchTerm.toLowerCase());
    });
  }, [alumnos, searchTerm]);

  return (
    <>
    <div className="space-y-3 pb-40 text-[var(--color-text)]">
      
      {/* HEADER ULTRA SLIM */}
      <div className="bg-[var(--color-card)]/60 backdrop-blur-2xl p-3 rounded-[1.8rem] border border-[var(--color-border)] shadow-2xl space-y-3 transition-all duration-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[var(--color-primary)]/10 rounded-xl flex items-center justify-center text-[var(--color-primary)] border border-[var(--color-primary)]/10 shadow-inner">
              <Users size={16} />
            </div>
            <div className="text-left text-[var(--color-text)]">
              <h2 className="text-sm font-black uppercase italic tracking-tighter leading-none">Matrícula</h2>
              <p className="text-[6px] font-black uppercase tracking-[0.4em] mt-0.5 italic opacity-60">TKW SYSTEM</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden xs:flex px-2.5 py-1 bg-[var(--color-primary)]/10 rounded-lg border border-[var(--color-primary)]/20">
              <span className="text-[8px] font-black text-[var(--color-primary)] uppercase tracking-widest leading-none">{filtered.length} Alumnos</span>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setModalLink(true)}
              title="Link de inscripción"
              className="w-9 h-9 bg-[var(--color-primary)] text-white rounded-xl flex items-center justify-center shadow-lg active:brightness-110 border border-white/10"
            >
              <UserPlusIcon size={18} strokeWidth={2.5} />
            </motion.button>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <div className="relative group flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors" size={12} />
            <input 
              type="text" placeholder="Buscar alumno..." 
              className="w-full h-9 pl-10 pr-3 bg-[var(--color-background)]/50 rounded-xl border border-[var(--color-border)] focus:border-[var(--color-primary)]/50 outline-none font-bold text-[11px] text-[var(--color-text)] shadow-inner transition-all placeholder:opacity-40" 
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.88, rotate: -180 }}
            transition={{ duration: 0.35 }}
            onClick={loadData}
            disabled={loading}
            title="Recargar lista"
            className="h-9 w-9 flex items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-background)]/50 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/40 transition-all shadow-sm flex-shrink-0"
          >
            {loading
              ? <Loader2 size={14} className="animate-spin" />
              : <RotateCcw size={14} />
            }
          </motion.button>
        </div>
      </div>

      {/* LISTADO DE TARJETAS TÉCNICAS */}
      <div className="grid grid-cols-1 gap-2.5 px-1">
        {loading ? (
          <div className="py-24 flex flex-col items-center gap-3"><Loader2 className="animate-spin text-[var(--color-primary)]" size={28} /></div>
        ) : (
          filtered.map(alumno => {
            const beltInfo = getCintaInfo(alumno.idgradoactual);
            const beltColorName = beltInfo?.color || "Blanca";
            const beltHex = getBeltHex(beltColorName);
            const tieneDeuda = (alumno.total_deuda || 0) > 0;

            return (
              <motion.div
                layout
                key={alumno.idalumno}
                className={`relative bg-[var(--color-card)]/40 backdrop-blur-xl p-3 rounded-[1.8rem] border border-[var(--color-border)] shadow-xl overflow-hidden transition-all hover:bg-[var(--color-card)]/60 ${tieneDeuda ? 'border-red-500/20 shadow-red-500/5' : ''}`}
              >
                {/* Barra de color de cinta */}
                <div className="absolute left-0 top-0 bottom-0 w-[4px] opacity-30" style={{ backgroundColor: beltHex }} />

                {/* Fila principal: foto + info + botones */}
                <div className="flex items-center gap-3 ml-1">

                  {/* Foto */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-12 h-12 rounded-2xl bg-black/20 border-[3px] overflow-hidden flex items-center justify-center"
                      style={{ borderColor: beltHex, boxShadow: `0 0 10px -2px ${beltHex}44` }}
                    >
                      {alumno.fotoalumno
                        ? <img src={alumno.fotoalumno} className="w-full h-full object-cover" alt="" />
                        : <UserIcon size={20} className="text-[var(--color-text-muted)] opacity-30" />}
                    </div>
                    <div className="absolute -bottom-1 -right-1 border-2 rounded-md shadow-lg z-20 overflow-hidden" style={{ borderColor: 'var(--color-background)' }}>
                      <MiniCintaBelt colorName={beltColorName} stripeName={beltInfo?.color_stripe} />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 text-left">
                    {/* Nombre + deuda */}
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

                    {/* Cinta */}
                    {beltInfo && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <MiniCintaBelt colorName={beltColorName} stripeName={beltInfo?.color_stripe} />
                        <span className="text-[8px] font-black uppercase tracking-wide" style={{ color: beltHex === '#f8f8f8' ? 'var(--color-text-muted)' : beltHex }}>
                          {beltInfo.nivelkupdan}
                        </span>
                      </div>
                    )}

                    {/* Profesor + teléfono */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {alumno.idprofesor ? (
                        <span className="text-[8px] font-bold uppercase flex items-center gap-1 text-[var(--color-text-muted)]">
                          <Briefcase size={8} className="text-[var(--color-primary)] flex-shrink-0"/>
                          <span className="truncate max-w-[120px]">
                            {profesores.find(p => p.idprofesor === alumno.idprofesor)?.nombrecompleto || 'Sin Asignar'}
                          </span>
                        </span>
                      ) : (
                        <button
                          onClick={e => { e.stopPropagation(); setProfSeleccionado(''); setModalAsignar({ open: true, alumno }); }}
                          className="text-[7px] font-black uppercase flex items-center gap-1 px-2 py-0.5 rounded-lg border border-orange-500/40 text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 transition-all flex-shrink-0"
                        >
                          <Briefcase size={7}/> Sin profesor
                        </button>
                      )}
                      <span className="text-[8px] font-bold flex items-center gap-1 text-[var(--color-text-muted)]">
                        <Phone size={8} className="text-emerald-500 flex-shrink-0"/>
                        {alumno.telefonocontacto || 'S/T'}
                      </span>
                    </div>
                  </div>

                  {/* Botones de acción — fila horizontal derecha */}
                  <div className="flex flex-row gap-1 flex-shrink-0 self-center">
                    <button onClick={() => handleOpenDetail(alumno.idalumno)} title="Ver detalles"
                      className="p-2 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] text-[var(--color-primary)] active:scale-90 transition-all hover:bg-[var(--color-primary)] hover:text-white shadow-sm">
                      <Eye size={13} />
                    </button>
                    <button onClick={() => handleOpenEdit(alumno)} title="Editar datos"
                      className="p-2 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] text-emerald-500 active:scale-90 transition-all hover:bg-emerald-500 hover:text-white shadow-sm">
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setProfSeleccionado(alumno.idprofesor || ''); setModalAsignar({ open: true, alumno }); }}
                      title={alumno.idprofesor ? 'Reasignar profesor' : 'Asignar profesor'}
                      className={`p-2 rounded-xl border active:scale-90 transition-all shadow-sm ${alumno.idprofesor ? 'bg-[var(--color-background)] border-[var(--color-border)] text-indigo-400 hover:bg-indigo-500 hover:text-white' : 'bg-orange-500/10 border-orange-500/40 text-orange-400 hover:bg-orange-500 hover:text-white'}`}>
                      <Briefcase size={13} />
                    </button>
                    <button onClick={() => handleOpenPhotoUpload(alumno)} title="Actualizar foto"
                      className="p-2 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] text-orange-400 active:scale-90 transition-all hover:bg-orange-500 hover:text-white shadow-sm">
                      <CameraIcon size={13} />
                    </button>
                  </div>

                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* MODAL MAESTRO: FORMULARIO TÉCNICO COMPLETO */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} className="relative w-full max-w-xl bg-[var(--color-card)] rounded-[2.5rem] border border-[var(--color-border)] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col transition-all duration-500">
              
              <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] p-4 text-white flex justify-between items-center relative flex-shrink-0 transition-all">
                 <div className="flex items-center gap-3.5 text-left relative z-10">
                    <div className="p-2.5 bg-white/15 rounded-xl border border-white/10 shadow-inner">
                      {isEditing ? <Edit3 size={18} /> : step === 'detail' ? <GraduationCap size={18} /> : <UserPlus size={18} />}
                    </div>
                    <div>
                       <h3 className="text-base font-black italic uppercase tracking-tighter leading-none">
                         {isEditing ? 'Actualizar Perfil' : step === 'detail' ? 'Expediente Completo' : 'Nueva Inscripción'}
                       </h3>
                       <p className="text-[6px] font-black uppercase tracking-[0.3em] opacity-70 mt-1 italic text-white/80 tracking-widest">TKW SYSTEM ELITE</p>
                    </div>
                 </div>
                 <button onClick={() => { stopCamera(); setIsModalOpen(false); }} className="p-1.5 bg-black/20 rounded-full hover:bg-black/30 transition-colors relative z-10"><X size={16} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar text-left">
                {step === 'form' ? (
                  <form onSubmit={handleSave} className="space-y-8 pb-10">
                    
                    {/* SECCIÓN 1: IDENTIDAD */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[var(--color-primary)] opacity-80 font-black italic"><UserIcon size={14} /><span className="text-[9px] uppercase tracking-[0.2em]">Identidad Marcial</span></div>
                        <div className="grid grid-cols-1 gap-4">
                            <InputField label="Nombres" name="nombres" value={formData.nombres} onChange={handleInputChange} error={errors.nombres} required placeholder="Juan Román" />
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="Apellido Paterno" name="apellidopaterno" value={formData.apellidopaterno} onChange={handleInputChange} error={errors.apellidopaterno} required placeholder="Riquelme" />
                                <InputField label="Apellido Materno" name="apellidomaterno" value={formData.apellidomaterno} onChange={handleInputChange} placeholder="Opcional" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[7px] font-black uppercase ml-2 text-[var(--color-text-muted)] tracking-widest">Grado Dojo Actual</label>
                                    {/* Preview visual de la cinta seleccionada */}
                                    {formData.idgradoactual && (() => {
                                      const sel = cintas.find((c: any) => c.idgrado === Number(formData.idgradoactual));
                                      return sel ? (
                                        <div className="flex items-center gap-2 px-3 py-1.5 mb-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)]/50">
                                          <MiniCintaBelt colorName={sel.color} stripeName={sel.color_stripe} />
                                          <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: getBeltHex(sel.color) === '#f8f8f8' ? 'var(--color-text-muted)' : getBeltHex(sel.color) }}>
                                            {sel.nivelkupdan}
                                          </span>
                                          {sel.color_stripe && (
                                            <span className="text-[8px] font-bold text-[var(--color-text-muted)]">· franja {sel.color_stripe}</span>
                                          )}
                                        </div>
                                      ) : null;
                                    })()}
                                    <select
                                      required
                                      className="w-full h-11 px-4 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none font-black text-[9px] uppercase text-[var(--color-text)] appearance-none cursor-pointer shadow-inner"
                                      value={formData.idgradoactual}
                                      onChange={e => handleInputChange('idgradoactual', e.target.value)}
                                    >
                                      {cintas.length === 0 && (
                                        <option disabled value="">Cargando grados...</option>
                                      )}
                                      {cintas.map((c: any) => (
                                        <option key={c.idgrado} value={c.idgrado}>
                                          {c.nivelkupdan} — {c.color}{c.color_stripe ? ` / ${c.color_stripe}` : ''}
                                        </option>
                                      ))}
                                    </select>
                                </div>
                                {isEditing && (
                                    <div className="space-y-1">
                                        <label className="text-[7px] font-black uppercase ml-2 text-[var(--color-text-muted)] tracking-widest">Estatus Alumno</label>
                                        <select required className="w-full h-11 px-4 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none font-black text-[9px] uppercase text-[var(--color-text)] appearance-none cursor-pointer shadow-inner" value={formData.estatus} onChange={e => handleInputChange('estatus', e.target.value)}>
                                            <option value={1}>ACTIVO</option>
                                            <option value={0}>INACTIVO</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {!isEditing && (
                        <>
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center gap-2 text-[var(--color-primary)] opacity-80 font-black italic"><Mail size={14} /><span className="text-[9px] uppercase tracking-[0.2em]">Familia y Avisos</span></div>
                                <div className="grid grid-cols-1 gap-4">
                                    <InputField label="F. Nacimiento" name="fechanacimiento" type="date" value={formData.fechanacimiento} onChange={handleInputChange} error={errors.fechanacimiento} required />
                                    <InputField label="Email del Tutor (Vital para Avisos)" name="correotutor" type="email" value={formData.correotutor} onChange={handleInputChange} error={errors.correotutor} required placeholder="tutor@dominio.com" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField label="Nombre Completo Tutor" name="nombretutor" value={formData.nombretutor} onChange={handleInputChange} error={errors.nombretutor} required placeholder="Nombre del padre/madre" />
                                        <InputField label="WhatsApp Contacto" name="telefonocontacto" maxLength={10} value={formData.telefonocontacto} onChange={handleInputChange} error={errors.telefonocontacto} required placeholder="10 dígitos" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[7px] font-black uppercase ml-2 text-[var(--color-text-muted)] tracking-widest">Instructor Responsable <span className="text-red-500 font-bold">*</span></label>
                                        <select 
                                            className={`w-full h-11 px-4 bg-[var(--color-background)] rounded-xl border ${errors.idprofesor ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-[var(--color-border)]'} focus:border-[var(--color-primary)] outline-none font-black text-[9px] uppercase text-[var(--color-text)] appearance-none cursor-pointer transition-all`} 
                                            value={formData.idprofesor || ''} 
onChange={e => handleInputChange('idprofesor', e.target.value)}
                                        >
                                            <option value="">Seleccionar Maestro</option>
                                            {profesores.map(p => <option key={p.idprofesor} value={p.idprofesor}>{p.nombrecompleto}</option>)}
                                        </select>
                                        {errors.idprofesor && <p className="text-[7px] text-red-500 ml-2 font-bold uppercase italic">{errors.idprofesor}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[7px] font-black uppercase ml-2 text-[var(--color-text-muted)] tracking-widest">Dirección de Domicilio <span className="text-red-500 font-bold">*</span></label>
                                        <textarea rows={2} className={`w-full p-4 bg-[var(--color-background)] rounded-xl border ${errors.direcciondomicilio ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-[var(--color-border)]'} focus:border-[var(--color-primary)] outline-none font-bold text-[10px] text-[var(--color-text)] resize-none transition-all placeholder:opacity-20`} placeholder="Calle, número, colonia..." value={formData.direcciondomicilio} onChange={e => handleInputChange('direcciondomicilio', e.target.value)} />
                                        {errors.direcciondomicilio && <p className="text-[7px] text-red-500 ml-2 font-bold uppercase italic">{errors.direcciondomicilio}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField label="Emergencia (Nombre)" name="contacto_emergencia_nombre" value={formData.contacto_emergencia_nombre} onChange={handleInputChange} error={errors.contacto_emergencia_nombre} required placeholder="Llamar a..." />
                                        <InputField label="Emergencia (Tel)" name="contacto_emergencia_tel" maxLength={10} value={formData.contacto_emergencia_tel} onChange={handleInputChange} error={errors.contacto_emergencia_tel} required placeholder="Teléfono" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="flex items-center gap-2 text-[var(--color-primary)] opacity-80 font-black italic"><HeartPulse size={14} /><span className="text-[9px] uppercase tracking-[0.2em]">Ficha Médica</span></div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[7px] font-black uppercase ml-2 text-[var(--color-text-muted)] tracking-widest flex items-center gap-1">
                                                Sangre <span className="text-red-500 font-bold text-xs">*</span>
                                            </label>
                                            <select className="w-full h-11 px-4 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none font-black text-[9px] uppercase text-[var(--color-text)]" value={formData.tipo_sangre} onChange={e => handleInputChange('tipo_sangre', e.target.value)}>
                                                <option value="O+">O+</option><option value="O-">O-</option><option value="A+">A+</option><option value="B+">B+</option><option value="AB+">AB+</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <div className="space-y-1">
                                                <label className="text-[7px] font-black uppercase ml-2 text-[var(--color-text-muted)] tracking-widest flex items-center gap-1">
                                                    Seguro Médico <span className="text-red-500 font-bold text-xs">*</span>
                                                </label>
                                                <select className="w-full h-11 px-4 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none font-black text-[9px] uppercase text-[var(--color-text)] appearance-none cursor-pointer transition-all shadow-inner" value={formData.seguro_medico} onChange={e => handleInputChange('seguro_medico', e.target.value)}>
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

                    <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={saving} className="w-full h-16 bg-[var(--color-primary)] text-white font-black rounded-[2rem] shadow-xl flex items-center justify-center gap-3 active:brightness-125 transition-all shadow-[var(--color-primary)]/20 mt-6">
                        {saving ? <Loader2 className="animate-spin" size={24} /> : <><Save size={24}/> <span className="text-base uppercase italic tracking-tighter font-black">{isEditing ? 'Sincronizar Perfil' : 'Completar Registro'}</span></>}
                    </motion.button>
                  </form>
                ) : step === 'detail' && selectedAlumno ? (
                  <div className="space-y-6 pb-6 text-left animate-in fade-in zoom-in-95 duration-300">
                     {/* ENCABEZADO DE PERFIL */}
                     <div className="flex items-center gap-5 p-5 bg-[var(--color-background)] rounded-[2.2rem] border border-[var(--color-border)] shadow-sm">
                        <div 
                          className="w-24 h-24 rounded-[1.8rem] bg-black/20 border-4 shadow-2xl flex items-center justify-center overflow-hidden flex-shrink-0" 
                          style={{ borderColor: getBeltHex(getCintaInfo(selectedAlumno.idgradoactual)?.color || "Blanca") }}
                        >
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
                             <span className="text-[9px] font-black uppercase text-[var(--color-primary)] tracking-widest">{getCintaInfo(selectedAlumno.idgradoactual)?.nivelkupdan}</span>
                           </div>
                           <h2 className="text-2xl font-black italic uppercase tracking-tighter text-[var(--color-text)] leading-tight truncate">{selectedAlumno.nombres}</h2>
                           <h3 className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-tighter">{selectedAlumno.apellidopaterno} {selectedAlumno.apellidomaterno}</h3>
                        </div>
                     </div>
                     
                     <div className="grid grid-cols-1 gap-5">
                        
                        {/* BLOQUE FINANCIERO */}
                        {(selectedAlumno.total_deuda || 0) > 0 && (
                          <div className="bg-red-500/10 p-5 rounded-[2rem] border border-red-500/20 space-y-4">
                            <div className="flex items-center justify-between text-red-500">
                                <div className="flex items-center gap-2"><ShieldAlert size={16} /><span className="text-[10px] font-black uppercase tracking-widest leading-none">Adeudos Pendientes</span></div>
                                <span className="text-2xl font-black tracking-tighter leading-none">${selectedAlumno.total_deuda}</span>
                            </div>
                            <div className="space-y-2">
                                {(selectedAlumno.pagos_pendientes_detalle || []).map((p: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center text-[10px] text-[var(--color-text)] opacity-80 bg-white/5 p-3 rounded-xl border border-red-500/5">
                                        <div className="flex items-center gap-2"><DollarSign size={12} className="text-red-500" /><span>{p.concepto}</span></div>
                                        <span className="font-black text-red-500 text-xs">${p.monto}</span>
                                    </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* BLOQUE IDENTIDAD Y FAMILIA */}
                        <div className="bg-[var(--color-card)] p-6 rounded-[2.2rem] border border-[var(--color-border)] space-y-5 shadow-inner">
                           <div className="flex items-center gap-2 text-[var(--color-primary)] opacity-80 font-black uppercase text-[9px] tracking-widest mb-2"><UserCircle size={14}/> Identidad y Contacto</div>
                           <div className="grid grid-cols-2 gap-5">
                              <div><p className="text-[7px] font-black uppercase text-[var(--color-text-muted)] opacity-50">Nacimiento</p><p className="text-xs font-bold text-[var(--color-text)] flex items-center gap-1"><CalendarDays size={10} className="text-[var(--color-primary)]" /> {selectedAlumno.fechanacimiento || '---'}</p></div>
                              <div><p className="text-[7px] font-black uppercase text-[var(--color-text-muted)] opacity-50">Email Tutor</p><p className="text-xs font-bold text-[var(--color-text)] truncate">{selectedAlumno.correotutor}</p></div>
                              <div><p className="text-[7px] font-black uppercase text-[var(--color-text-muted)] opacity-50">Nombre del Tutor</p><p className="text-xs font-bold text-[var(--color-text)] leading-tight italic">{selectedAlumno.nombretutor || 'No registrado'}</p></div>
                              <div><p className="text-[7px] font-black uppercase text-[var(--color-text-muted)] opacity-50">WhatsApp</p><p className="text-xs font-bold text-[var(--color-text)]">{selectedAlumno.telefonocontacto || 'S/T'}</p></div>
                              <div className="col-span-2 border-t border-white/5 pt-3"><p className="text-[7px] font-black uppercase text-[var(--color-text-muted)] opacity-50">Domicilio Actual</p><p className="text-[10px] font-bold text-[var(--color-text)] opacity-80 leading-relaxed"><MapPin size={10} className="inline mr-1 text-red-500" /> {selectedAlumno.direcciondomicilio || 'Domicilio no especificado'}</p></div>
                           </div>
                        </div>

                        {/* BLOQUE EMERGENCIA Y SALUD */}
                        <div className="bg-[var(--color-card)] p-6 rounded-[2.2rem] border border-[var(--color-border)] space-y-5 shadow-inner">
                           <div className="flex items-center gap-2 text-red-500 font-black uppercase text-[9px] tracking-widest mb-2"><Heart size={14}/> Ficha Médica y Emergencia</div>
                           <div className="grid grid-cols-2 gap-5">
                              <div className="col-span-2 bg-red-500/5 p-4 rounded-2xl border border-red-500/10">
                                <p className="text-[7px] font-black uppercase text-red-500 opacity-60 mb-1 tracking-widest">En caso de Emergencia</p>
                                <p className="text-sm font-black text-red-500 uppercase leading-none">{selectedAlumno.contacto_emergencia_nombre || 'S/D'}</p>
                                <p className="text-lg font-black text-red-500 mt-1 flex items-center gap-2"><PhoneForwarded size={16} /> {selectedAlumno.contacto_emergencia_tel || '---'}</p>
                              </div>
                              <div><p className="text-[7px] font-black uppercase text-[var(--color-text-muted)] opacity-50">Tipo Sangre</p><p className="text-sm font-black text-red-500">{selectedAlumno.tipo_sangre || 'S/D'}</p></div>
                              <div><p className="text-[7px] font-black uppercase text-[var(--color-text-muted)] opacity-50">Seguro Social</p><p className="text-[10px] font-bold tracking-tighter uppercase">{selectedAlumno.seguro_medico}: {selectedAlumno.nss_o_poliza || 'S/N'}</p></div>
                              <div className="col-span-2 border-t border-white/5 pt-3"><p className="text-[7px] font-black uppercase text-[var(--color-text-muted)] opacity-50">Alergias y Padecimientos</p><p className="text-xs font-bold text-[var(--color-text)] italic">{selectedAlumno.alergias} / {selectedAlumno.padecimientos_cronicos}</p></div>
                           </div>
                        </div>

                        {/* BLOQUE ACADÉMICO Y SISTEMA */}
                        <div className="bg-[var(--color-card)] p-6 rounded-[2.2rem] border border-[var(--color-border)] space-y-5 shadow-inner">
                           <div className="flex items-center gap-2 text-indigo-500 font-black uppercase text-[9px] tracking-widest mb-2"><BookOpen size={14}/> Académico y Registro</div>
                           <div className="grid grid-cols-2 gap-5">
                              <div><p className="text-[7px] font-black uppercase text-[var(--color-text-muted)] opacity-50">Grado Escolar</p><p className="text-xs font-bold text-[var(--color-text)]">{selectedAlumno.grado_escolar || '---'}</p></div>
                              <div><p className="text-[7px] font-black uppercase text-[var(--color-text-muted)] opacity-50">Escuela Procedencia</p><p className="text-xs font-bold text-[var(--color-text)] truncate">{selectedAlumno.escuela_procedencia || 'Ninguna'}</p></div>
                              <div><p className="text-[7px] font-black uppercase text-[var(--color-text-muted)] opacity-50">Matrícula Local</p><p className="text-sm font-black text-[var(--color-primary)]">ID #{selectedAlumno.idalumno}</p></div>
                              <div><p className="text-[7px] font-black uppercase text-[var(--color-text-muted)] opacity-50">Fecha de Alta</p><p className="text-[10px] font-bold text-[var(--color-text-muted)]">{selectedAlumno.fecharegistro ? new Date(selectedAlumno.fecharegistro).toLocaleDateString() : '---'}</p></div>
                           </div>
                        </div>

                     </div>
                  </div>
                ) : step === 'photo_choice' ? (
                  <div className="py-10 text-center space-y-10">
                     <div className="grid grid-cols-2 gap-6">
                        <button onClick={() => fileRef.current?.click()} className="flex flex-col items-center justify-center gap-4 p-10 bg-[var(--color-background)] rounded-[3rem] border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all group active:scale-95 shadow-sm">
                          <ImagePlus className="text-[var(--color-primary)] transition-transform group-hover:scale-110" size={32} />
                          <span className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-widest">Galería</span>
                        </button>
                        <button onClick={startCamera} className="flex flex-col items-center justify-center gap-4 p-10 bg-[var(--color-background)] rounded-[3rem] border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all group active:scale-95 shadow-sm">
                          <CameraIcon className="text-[var(--color-primary)] transition-transform group-hover:scale-110" size={32} />
                          <span className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-widest">Cámara</span>
                        </button>
                     </div>
                     <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={e => {
                       const file = e.target.files?.[0];
                       if(file) { setTempFile(file); setStep('preview'); }
                     }} />
                     <button onClick={() => setIsModalOpen(false)} className="text-[10px] font-black uppercase text-[var(--color-text-muted)] border-b border-transparent hover:border-[var(--color-primary)] transition-all opacity-50 tracking-widest">Omitir Identidad</button>
                  </div>
                ) : step === 'camera' ? (
                   <div className="space-y-10 text-center py-4 flex flex-col items-center animate-in zoom-in duration-300">
                    <div className="w-64 h-64 bg-black rounded-[4.5rem] border-4 border-[var(--color-primary)] overflow-hidden relative shadow-2xl scale-x-[-1]">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    </div>
                    <button onClick={capture} className="w-16 h-16 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 border-8 border-[var(--color-card)]"><CameraIcon size={24} /></button>
                  </div>
                ) : (
                  <div className="text-center space-y-10 py-6 flex flex-col items-center">
                    <div className="w-56 h-56 rounded-[4rem] border-4 border-[var(--color-primary)] overflow-hidden shadow-2xl relative">
                       {tempFile && <img src={URL.createObjectURL(tempFile)} className="w-full h-full object-cover" alt="Preview" />}
                       {saving && <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm"><Loader2 className="animate-spin text-white" size={32} /></div>}
                    </div>
                    <div className="flex flex-col gap-4 w-full px-10">
                       <motion.button whileTap={{ scale: 0.95 }} onClick={confirmUpload} disabled={saving} className="w-full h-16 bg-[var(--color-text)] text-[var(--color-card)] font-black rounded-[2.5rem] flex items-center justify-center gap-3 shadow-2xl border border-black/10 active:brightness-110">
                          <CheckCircle2 size={24} className="text-[var(--color-primary)]" /> <span className="text-sm uppercase italic tracking-tighter font-black">Actualizar Identidad</span>
                       </motion.button>
                       <button onClick={() => setStep('photo_choice')} disabled={saving} className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-widest opacity-60 flex items-center justify-center gap-2"><RotateCcw size={14}/> Reintentar</button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>

      {/* Modal link inscripción — portal */}
      {createPortal(
        <AnimatePresence>
          {modalLink && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-4"
                onClick={() => setModalLink(false)}>
                <motion.div initial={{opacity:0,scale:0.93}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.93}}
                  transition={{type:'spring',bounce:0.2,duration:0.3}}
                  className="bg-[var(--color-card)] rounded-3xl border border-[var(--color-border)] p-6 w-full max-w-sm shadow-2xl"
                  onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                        <Link2 size={16} className="text-[var(--color-primary)]"/>
                      </div>
                      <h2 className="text-sm font-black text-[var(--color-text)]">Inscribir Alumno</h2>
                    </div>
                    <button onClick={() => setModalLink(false)} className="w-7 h-7 rounded-xl bg-[var(--color-border)]/50 flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-border)] transition-colors">
                      <X size={14}/>
                    </button>
                  </div>
                  <ModalCompartirLink onClose={() => setModalLink(false)}/>
                </motion.div>
              </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── MODAL ASIGNAR PROFESOR ─────────────────────────────── */}
      {modalAsignar.open && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => setModalAsignar({ open: false, alumno: null })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-[2rem] p-6 space-y-5"
              style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}
            >
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-orange-400 mb-1">
                  {modalAsignar.alumno?.idprofesor ? 'Reasignación' : 'Acción requerida'}
                </p>
                <h3 className="text-lg font-black uppercase italic tracking-tighter text-[var(--color-text)]">
                  {modalAsignar.alumno?.idprofesor ? 'Reasignar Profesor' : 'Asignar Profesor'}
                </h3>
                <p className="text-[10px] font-bold text-[var(--color-text-muted)] mt-1">
                  {modalAsignar.alumno?.idprofesor
                    ? `Cambiar el instructor de ${modalAsignar.alumno?.nombres} ${modalAsignar.alumno?.apellidopaterno}. El profesor actual es ${profesores.find(p => p.idprofesor === modalAsignar.alumno?.idprofesor)?.nombrecompleto ?? 'desconocido'}.`
                    : `${modalAsignar.alumno?.nombres} ${modalAsignar.alumno?.apellidopaterno} no tiene instructor. Asígnalo para poder generar pagos e inscribirlo a torneos.`
                  }
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">
                  Selecciona instructor
                </label>
                <select
                  value={profSeleccionado}
                  onChange={e => setProfSeleccionado(e.target.value ? Number(e.target.value) : '')}
                  className="w-full h-12 px-4 rounded-2xl text-[11px] font-black uppercase outline-none appearance-none cursor-pointer"
                  style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                >
                  <option value="">— Elige un profesor —</option>
                  {profesores.filter(p => p.estatus === 1 || p.estatus === undefined).map(p => (
                    <option key={p.idprofesor} value={p.idprofesor}>
                      {p.nombrecompleto}{p.idprofesor === modalAsignar.alumno?.idprofesor ? ' (actual)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setModalAsignar({ open: false, alumno: null })}
                  className="flex-1 h-12 rounded-2xl text-[10px] font-black uppercase tracking-wider"
                  style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                >
                  Cancelar
                </button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAsignarProfesor}
                  disabled={!profSeleccionado || asignandoProf}
                  className="flex-1 h-12 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2"
                  style={{
                    background: profSeleccionado ? 'var(--color-primary)' : 'var(--color-border)',
                    color: '#fff',
                    opacity: asignandoProf ? 0.7 : 1,
                  }}
                >
                  {asignandoProf
                    ? <><Loader2 size={14} className="animate-spin"/> Guardando...</>
                    : <><Briefcase size={14}/> Asignar</>
                  }
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default App;