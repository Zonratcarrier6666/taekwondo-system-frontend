import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, Plus, User, Camera, Mail, Phone, 
  Save, X, Loader2, ShieldCheck, Search, 
  ChevronRight, ImagePlus, UserPlus, AlertCircle, Eye, EyeOff,
  Smartphone, CheckCircle2, RotateCcw, CameraIcon
} from 'lucide-react';

/**
 * --- INTERFACES ---
 */
export interface Cinta {
  idgrado: number;
  nivelkupdan: string;
  color: string;
  significado: string;
}

export interface Profesor {
  idprofesor: number;
  idusuario: number;
  idescuela: number;
  nombrecompleto: string;
  email: string | null;
  telefono: string | null;
  idgradodan: number; 
  foto_url: string | null;
  estatus: number;
  fecharegistro: string | null;
}

/**
 * --- SERVICIOS ---
 */
const BASE_URL = 'https://taekwondo-system-api.onrender.com';

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token'); 
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const professorAPI = {
  listar: async (): Promise<Profesor[]> => {
    const res = await fetch(`${BASE_URL}/profesores/`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Sesión no válida');
    return res.json();
  },
  registrar: async (data: any) => {
    const res = await fetch(`${BASE_URL}/usuarios/usuarios/registrar-profesor`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'El nombre de usuario ya existe o los datos son inválidos.');
    }
    return res.json();
  },
  subirFoto: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const headers: any = getAuthHeaders();
    delete headers['Content-Type']; 

    const res = await fetch(`${BASE_URL}/profesores/${id}/upload-foto`, {
      method: 'POST',
      headers: headers,
      body: formData
    });
    return res.json();
  }
};

export const GestionProfesores: React.FC = () => {
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [catalogoCintas, setCatalogoCintas] = useState<Cinta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estados del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<'form' | 'photo_choice' | 'camera_live' | 'preview'>('form'); 
  const [selectedProfId, setSelectedProfId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Gestión de cámara y archivos
  const [tempFile, setTempFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileGalleryRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [formData, setFormData] = useState({
    nombre_completo: '',
    username: '',
    password: '',
    confirmPassword: '',
    idgradodan: 11 
  });

  useEffect(() => {
    loadData();
    fetch(`${BASE_URL}/grados/`).then(r => r.json()).then(setCatalogoCintas);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await professorAPI.listar();
      setProfesores(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRegistration = () => {
    setFormData({ nombre_completo: '', username: '', password: '', confirmPassword: '', idgradodan: 11 });
    setFormError(null);
    setStep('form');
    setIsModalOpen(true);
  };

  const handleCreateProfesor = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // VALIDACIONES DE SEGURIDAD
    if (formData.nombre_completo.length < 5) return setFormError("Ingresa el nombre completo del profesor.");
    if (formData.username.length < 4) return setFormError("El usuario es muy corto.");
    if (formData.password.length < 8) return setFormError("La contraseña debe tener al menos 8 caracteres.");
    if (formData.password !== formData.confirmPassword) return setFormError("Las contraseñas no coinciden.");

    setSaving(true);
    try {
      await professorAPI.registrar({
        username: formData.username,
        password: formData.password,
        rol: 'Profesor',
        nombre_completo: formData.nombre_completo,
        idgradodan: formData.idgradodan
      });
      
      const updated = await professorAPI.listar();
      setProfesores(updated);
      const nuevo = updated.find(p => p.nombrecompleto === formData.nombre_completo);
      if (nuevo) {
        setSelectedProfId(nuevo.idprofesor);
        setStep('photo_choice');
      } else {
        setIsModalOpen(false);
      }
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // --- LÓGICA DE VISOR DE CÁMARA (Laptop/Smartphone) ---
  const startCamera = async () => {
    setFormError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, 
        audio: false 
      });
      streamRef.current = stream;
      setStep('camera_live');
      // Esperamos un tick para que el ref del video esté disponible en el nuevo paso
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch (err) {
      setFormError("No se detectó una cámara o el permiso fue denegado.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    // Capturamos en alta resolución basada en el flujo de video
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Dibujamos el frame actual
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `profesor_selfie_${Date.now()}.jpg`, { type: 'image/jpeg' });
          setTempFile(file);
          setPreviewUrl(URL.createObjectURL(file));
          stopCamera();
          setStep('preview');
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTempFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStep('preview');
  };

  const handleUploadConfirmed = async () => {
    if (!tempFile || !selectedProfId) return;
    setSaving(true);
    try {
      await professorAPI.subirFoto(selectedProfId, tempFile);
      await loadData();
      setIsModalOpen(false);
      setPreviewUrl(null);
      setTempFile(null);
    } catch (err: any) {
      setFormError("Error al subir la imagen al servidor.");
    } finally {
      setSaving(false);
    }
  };

  const closeAndStop = () => {
    stopCamera();
    setIsModalOpen(false);
  };

  const filtered = profesores.filter(p => 
    p.nombrecompleto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-40">
      
      {/* CABECERA DE FILTRADO */}
      <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-inner">
              <GraduationCap size={26} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase italic tracking-tighter text-[var(--color-text)] leading-none">Cuerpo Técnico</h2>
              <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.25em] mt-1.5 opacity-70">Directorio de Maestros</p>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleOpenRegistration} className="w-12 h-12 bg-[var(--color-primary)] text-white rounded-2xl flex items-center justify-center shadow-lg active:brightness-110 transition-all">
            <Plus size={24} strokeWidth={3} />
          </motion.button>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input type="text" placeholder="Buscar por nombre..." className="w-full h-14 pl-12 pr-6 bg-[var(--color-background)]/50 rounded-2xl border border-transparent focus:border-[var(--color-primary)] outline-none font-bold text-sm text-[var(--color-text)] transition-all shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* LISTADO DE MAESTROS */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-3"><Loader2 className="animate-spin text-[var(--color-primary)]" size={32} /></div>
        ) : filtered.length === 0 ? (
            <div className="p-20 text-center opacity-30 italic font-bold uppercase tracking-widest text-xs">Sin registros</div>
        ) : (
          filtered.map((prof) => (
            <motion.div layout key={prof.idprofesor} className="bg-[var(--color-card)]/80 backdrop-blur-xl p-5 rounded-[2.8rem] border border-[var(--color-border)] shadow-lg flex items-center justify-between group hover:border-[var(--color-primary)]/40 transition-all">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-16 h-16 rounded-[1.8rem] bg-[var(--color-background)] border-2 border-[var(--color-border)] overflow-hidden flex items-center justify-center shadow-inner">
                    {prof.foto_url ? <img src={prof.foto_url} className="w-full h-full object-cover" alt="" /> : <User size={30} className="text-slate-600 opacity-20" />}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl border-2 border-[var(--color-card)] flex items-center justify-center shadow-xl bg-black">
                    <span className="text-[10px] font-black italic text-white">{prof.idgradodan >= 11 ? prof.idgradodan - 10 : prof.idgradodan}°</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase italic tracking-tighter text-[var(--color-text)] leading-tight">{prof.nombrecompleto}</h3>
                  <p className="text-[9px] font-bold text-[var(--color-primary)] uppercase tracking-widest mt-1 flex items-center gap-1.5"><ShieldCheck size={10} className="text-emerald-500" /> Instructor Dan</p>
                </div>
              </div>
              <button onClick={() => { setSelectedProfId(prof.idprofesor); setStep('photo_choice'); setIsModalOpen(true); }} className="p-3.5 bg-[var(--color-background)] rounded-2xl border border-[var(--color-border)] text-[var(--color-primary)] active:scale-90 transition-all hover:bg-[var(--color-primary)] hover:text-white shadow-sm"><Camera size={20} /></button>
            </motion.div>
          ))
        )}
      </div>

      {/* MODAL DE FLUJO DINÁMICO */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={closeAndStop} />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 40 }} className="relative w-full max-w-lg bg-[var(--color-card)] rounded-[3.8rem] border border-[var(--color-border)] shadow-2xl overflow-hidden">
              
              <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary)]/70 p-9 text-white flex justify-between items-center relative overflow-hidden">
                <div className="flex items-center gap-4 relative z-10">
                  <div className="p-3.5 bg-white/15 rounded-2xl backdrop-blur-xl border border-white/10">
                    {step === 'form' ? <UserPlus size={26} /> : <Smartphone size={26} />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">
                      {step === 'form' ? 'Nuevo Maestro' : step === 'camera_live' ? 'En Vivo' : 'Captura Técnica'}
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] opacity-60 mt-1.5">Identidad del Dojo</p>
                  </div>
                </div>
                <button onClick={closeAndStop} className="p-2.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors relative z-10"><X size={22} /></button>
              </div>

              <div className="p-9">
                {step === 'form' ? (
                  <form onSubmit={handleCreateProfesor} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-[var(--color-text-muted)] ml-3 tracking-widest opacity-70">Nombre Institucional</label>
                      <input required placeholder="Nombre Completo" className="w-full h-14 px-6 bg-[var(--color-background)]/50 rounded-2xl border border-transparent focus:border-[var(--color-primary)] outline-none font-bold text-sm text-[var(--color-text)] transition-all shadow-inner" value={formData.nombre_completo} onChange={e => setFormData({...formData, nombre_completo: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-[var(--color-text-muted)] ml-3 tracking-widest opacity-70">Usuario (Login)</label>
                      <input required placeholder="usuario.acceso" className="w-full h-14 px-6 bg-[var(--color-background)]/50 rounded-2xl border border-transparent focus:border-[var(--color-primary)] outline-none font-bold text-sm text-[var(--color-text)] shadow-inner" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 relative">
                        <label className="text-[10px] font-black uppercase text-[var(--color-text-muted)] ml-3 tracking-widest opacity-70">Contraseña</label>
                        <input required type={showPass ? "text" : "password"} placeholder="••••••••" className="w-full h-14 px-6 bg-[var(--color-background)]/50 rounded-2xl border border-transparent focus:border-[var(--color-primary)] outline-none font-bold text-sm text-[var(--color-text)] shadow-inner" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 bottom-4 text-slate-400">{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-[var(--color-text-muted)] ml-3 tracking-widest opacity-70">Confirmar</label>
                        <input required type={showPass ? "text" : "password"} placeholder="••••••••" className="w-full h-14 px-6 bg-[var(--color-background)]/50 rounded-2xl border border-transparent focus:border-[var(--color-primary)] outline-none font-bold text-sm text-[var(--color-text)] shadow-inner" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-[var(--color-text-muted)] ml-3 tracking-widest opacity-70">Grado Técnico (Por Defecto 11)</label>
                      <div className="relative">
                        <select className="w-full h-14 px-6 bg-[var(--color-background)]/50 rounded-2xl border border-transparent focus:border-[var(--color-primary)] outline-none font-black text-[11px] uppercase tracking-[0.15em] text-[var(--color-text)] appearance-none cursor-pointer shadow-inner" value={formData.idgradodan} onChange={e => setFormData({...formData, idgradodan: parseInt(e.target.value)})}>
                           {catalogoCintas.filter(c => c.idgrado >= 11).map(g => (
                             <option key={g.idgrado} value={g.idgrado}>{g.nivelkupdan} - {g.color}</option>
                           ))}
                        </select>
                        <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 rotate-90 text-slate-500 pointer-events-none" size={18} />
                      </div>
                    </div>
                    {formError && <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20 flex items-center gap-2"><AlertCircle size={14} className="text-red-500" /><span className="text-[9px] font-black uppercase text-red-500 tracking-tighter">{formError}</span></div>}
                    <motion.button whileTap={{ scale: 0.96 }} type="submit" disabled={saving} className="w-full h-20 bg-[var(--color-text)] text-[var(--color-card)] font-black rounded-[2.5rem] mt-6 shadow-2xl flex items-center justify-center gap-3 transition-all">{saving ? <Loader2 className="animate-spin" size={24} /> : <><Save size={24}/> <span className="text-base uppercase italic tracking-tighter">Registrar e ir a foto</span></>}</motion.button>
                  </form>
                ) : step === 'photo_choice' ? (
                  <div className="text-center space-y-8 py-4">
                    <div className="grid grid-cols-2 gap-4">
                       <button onClick={() => fileGalleryRef.current?.click()} className="flex flex-col items-center justify-center gap-3 p-8 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all group">
                         <div className="p-4 bg-white dark:bg-black/20 rounded-2xl shadow-sm group-hover:scale-110 transition-transform"><ImagePlus className="text-[var(--color-primary)]" size={28} /></div>
                         <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]">Galería</span>
                       </button>
                       <button onClick={startCamera} className="flex flex-col items-center justify-center gap-3 p-8 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all group">
                         <div className="p-4 bg-white dark:bg-black/20 rounded-2xl shadow-sm group-hover:scale-110 transition-transform"><CameraIcon className="text-[var(--color-primary)]" size={28} /></div>
                         <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]">Cámara</span>
                       </button>
                    </div>
                    {formError && <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest">{formError}</p>}
                    <input type="file" ref={fileGalleryRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                    <button onClick={closeAndStop} className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-[var(--color-primary)] transition-colors border-b border-transparent hover:border-[var(--color-primary)] pb-1">Saltar por ahora</button>
                  </div>
                ) : step === 'camera_live' ? (
                  <div className="space-y-6 text-center animate-in zoom-in duration-300">
                    <div className="w-64 h-64 mx-auto bg-black rounded-[3.5rem] border-4 border-[var(--color-primary)] overflow-hidden relative shadow-2xl scale-x-[-1]">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    </div>
                    <div className="flex justify-center gap-4">
                       <button onClick={takePhoto} className="w-20 h-20 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all border-8 border-[var(--color-card)]">
                          <CameraIcon size={32} />
                       </button>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Captura la identidad técnica del maestro</p>
                  </div>
                ) : (
                  <div className="text-center space-y-8 py-4 animate-in fade-in">
                    <div className="w-56 h-56 mx-auto rounded-[3.8rem] border-4 border-[var(--color-primary)] overflow-hidden shadow-2xl relative">
                       {previewUrl && <img src={previewUrl} className="w-full h-full object-cover" alt="" />}
                       {saving && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="animate-spin text-white" size={40} /></div>}
                    </div>
                    <div className="flex flex-col gap-3 px-4">
                       <button onClick={handleUploadConfirmed} disabled={saving} className="w-full h-16 bg-[var(--color-text)] text-[var(--color-card)] font-black rounded-3xl flex items-center justify-center gap-3 shadow-xl disabled:opacity-50">
                          <CheckCircle2 size={20} /> <span className="text-sm font-black uppercase italic tracking-tighter">Sincronizar Foto</span>
                       </button>
                       <button onClick={() => { stopCamera(); setStep('photo_choice'); }} disabled={saving} className="w-full h-14 bg-slate-100 dark:bg-white/5 text-[var(--color-text)] font-black rounded-3xl flex items-center justify-center gap-3 transition-all">
                          <RotateCcw size={18} /> <span className="text-xs uppercase opacity-70 tracking-widest font-bold">Repetir captura</span>
                       </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GestionProfesores;