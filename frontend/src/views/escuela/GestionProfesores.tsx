import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, Plus, User, Camera, Save, X, Loader2, 
  ShieldCheck, Search, ChevronRight, ImagePlus, UserPlus, 
  AlertCircle, Eye, EyeOff, Smartphone, CheckCircle2, 
  RotateCcw, CameraIcon
} from 'lucide-react';

// --- IMPORTACIONES MODULARES (Configuradas para tu estructura de carpetas) ---
import { profesorService } from '../../services/profesor.service';
import { cintasService } from '../../services/cintas.service';
import { themeService } from '../../services/theme.service';
import type { Profesor, RegistroProfesorDTO } from '../../types/profesor.types';

/**
 * VISTA: GESTIÓN DE PROFESORES
 * Permite administrar el staff técnico de la escuela, registros de acceso y fotos de perfil.
 */
export const GestionProfesores: React.FC = () => {
  // Datos
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [catalogoCintas, setCatalogoCintas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal y Control de Pasos
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<'form' | 'photo_choice' | 'camera_live' | 'preview'>('form'); 
  const [selectedProfId, setSelectedProfId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Multimedia (Cámara y Archivos)
  const [tempFile, setTempFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileGalleryRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Formulario vinculado al DTO
  const [formData, setFormData] = useState<RegistroProfesorDTO>({
    nombre_completo: '',
    username: '',
    password: '',
    rol: 'Profesor',
    idgradodan: 11 // Valor inicial: 1er Dan
  });
  const [confirmPassword, setConfirmPassword] = useState('');

  // --- CARGA DE DATOS ---
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [profRes, cintaRes] = await Promise.all([
        profesorService.listarProfesores(),
        cintasService.listarGrados()
      ]);
      setProfesores(profRes);
      setCatalogoCintas(cintaRes);
    } catch (err) {
      console.error("Error al cargar staff técnico:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // --- MANEJADORES DE INTERFAZ ---
  const handleOpenRegistration = () => {
    setFormData({ nombre_completo: '', username: '', password: '', rol: 'Profesor', idgradodan: 11 });
    setConfirmPassword('');
    setFormError(null);
    setStep('form');
    setIsModalOpen(true);
  };

  const handleCreateProfesor = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validaciones de negocio
    if (formData.nombre_completo.length < 5) return setFormError("Ingresa el nombre completo del profesor.");
    if (formData.password.length < 8) return setFormError("La contraseña debe tener mínimo 8 caracteres.");
    if (formData.password !== confirmPassword) return setFormError("Las contraseñas no coinciden.");

    setSaving(true);
    try {
      // 1. Registro en Backend
      await profesorService.registrarProfesor(formData);
      
      // 2. Refrescar lista y buscar el ID del recién creado para el paso de la foto
      const updated = await profesorService.listarProfesores();
      setProfesores(updated);
      
      const nuevo = updated.find(p => p.nombrecompleto === formData.nombre_completo);
      if (nuevo) {
        setSelectedProfId(nuevo.idprofesor);
        setStep('photo_choice');
      } else {
        setIsModalOpen(false);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Error al registrar. El usuario podría ya existir.");
    } finally {
      setSaving(false);
    }
  };

  // --- GESTIÓN DE CÁMARA ---
  const startCamera = async () => {
    setFormError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: 640, height: 640 }, 
        audio: false 
      });
      streamRef.current = stream;
      setStep('camera_live');
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch (err) {
      setFormError("Cámara no detectada o permiso denegado.");
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
    const size = Math.min(videoRef.current.videoWidth, videoRef.current.videoHeight);
    canvas.width = 600; canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const startX = (videoRef.current.videoWidth - size) / 2;
      const startY = (videoRef.current.videoHeight - size) / 2;
      ctx.drawImage(videoRef.current, startX, startY, size, size, 0, 0, 600, 600);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `prof_${Date.now()}.jpg`, { type: 'image/jpeg' });
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
      await profesorService.subirFoto(selectedProfId, tempFile);
      await loadInitialData();
      setIsModalOpen(false);
      setPreviewUrl(null);
      setTempFile(null);
    } catch (err: any) {
      setFormError("Fallo al sincronizar la fotografía con el servidor.");
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
      
      {/* CABECERA: BÚSQUEDA Y ACCIÓN */}
      <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-[var(--color-primary)] border border-[var(--color-primary)]/20 shadow-inner">
              <GraduationCap size={26} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase italic tracking-tighter text-[var(--color-text)] leading-none">Cuerpo Técnico</h2>
              <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.25em] mt-1.5 opacity-70">Staff Institucional</p>
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
            <div className="p-20 text-center opacity-30 italic font-bold uppercase tracking-widest text-xs text-[var(--color-text-muted)]">Sin registros en el staff</div>
        ) : (
          filtered.map((prof) => (
            <motion.div layout key={prof.idprofesor} className="bg-[var(--color-card)]/80 backdrop-blur-xl p-5 rounded-[2.8rem] border border-[var(--color-border)] shadow-lg flex items-center justify-between group hover:border-[var(--color-primary)]/40 transition-all">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-16 h-16 rounded-[1.8rem] bg-[var(--color-background)] border-2 border-[var(--color-border)] overflow-hidden flex items-center justify-center shadow-inner group-hover:rotate-3 transition-transform duration-500">
                    {prof.foto_url ? <img src={prof.foto_url} className="w-full h-full object-cover" alt="" /> : <User size={30} className="text-slate-600 opacity-20" />}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl border-2 border-[var(--color-card)] flex items-center justify-center shadow-xl bg-black overflow-hidden">
                    <div className="absolute inset-0 bg-yellow-500 opacity-20" />
                    <span className="text-[10px] font-black italic text-white relative z-10">{prof.idgradodan >= 11 ? prof.idgradodan - 10 : prof.idgradodan}°</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase italic tracking-tighter text-[var(--color-text)] leading-tight">{prof.nombrecompleto}</h3>
                  <p className="text-[9px] font-bold text-[var(--color-primary)] uppercase tracking-widest mt-1 flex items-center gap-1.5"><ShieldCheck size={10} className="text-emerald-500" /> Instructor Cinturón Negro</p>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={closeAndStop} />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 40 }} className="relative w-full max-w-lg bg-[var(--color-card)] rounded-[3.8rem] border border-[var(--color-border)] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              
              <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] p-9 text-white flex justify-between items-center relative overflow-hidden flex-shrink-0">
                <div className="flex items-center gap-4 relative z-10">
                  <div className="p-3.5 bg-white/15 rounded-2xl backdrop-blur-xl border border-white/10 shadow-inner">
                    {step === 'form' ? <UserPlus size={26} /> : <Smartphone size={26} />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">
                      {step === 'form' ? 'Nuevo Maestro' : 'Identidad Staff'}
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] opacity-60 mt-1.5">Matrícula Técnica</p>
                  </div>
                </div>
                <button onClick={closeAndStop} className="p-2.5 bg-black/20 rounded-full hover:bg-black/30 transition-colors relative z-10"><X size={22} /></button>
              </div>

              <div className="p-9 flex-1 overflow-y-auto custom-scrollbar">
                {step === 'form' ? (
                  <form onSubmit={handleCreateProfesor} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500 ml-3 tracking-widest">Nombre Completo</label>
                      <input required placeholder="Ej: Kaoru Hanayama" className="w-full h-14 px-6 bg-[var(--color-background)] rounded-2xl border border-transparent focus:border-[var(--color-primary)] outline-none font-bold text-sm text-[var(--color-text)] transition-all shadow-inner" value={formData.nombre_completo} onChange={e => setFormData({...formData, nombre_completo: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500 ml-3 tracking-widest">Identificador de Acceso</label>
                      <input required placeholder="maestro.pro" className="w-full h-14 px-6 bg-[var(--color-background)] rounded-2xl border border-transparent focus:border-[var(--color-primary)] outline-none font-bold text-sm text-[var(--color-text)] shadow-inner" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 relative text-left">
                        <label className="text-[10px] font-black uppercase text-slate-500 ml-3 tracking-widest">Contraseña</label>
                        <input required type={showPass ? "text" : "password"} placeholder="••••••••" className="w-full h-14 px-6 bg-[var(--color-background)] rounded-2xl border border-transparent focus:border-[var(--color-primary)] outline-none font-bold text-sm text-[var(--color-text)] shadow-inner" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 bottom-4 text-slate-400">{showPass ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                      </div>
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-500 ml-3 tracking-widest">Confirmar</label>
                        <input required type={showPass ? "text" : "password"} placeholder="••••••••" className="w-full h-14 px-6 bg-[var(--color-background)] rounded-2xl border border-transparent focus:border-[var(--color-primary)] outline-none font-bold text-sm text-[var(--color-text)] shadow-inner" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500 ml-3 tracking-widest">Grado Dan Actual</label>
                      <select className="w-full h-14 px-6 bg-[var(--color-background)] rounded-2xl border border-transparent focus:border-[var(--color-primary)] outline-none font-black text-[11px] uppercase text-[var(--color-text)] appearance-none cursor-pointer shadow-inner" value={formData.idgradodan} onChange={e => setFormData({...formData, idgradodan: parseInt(e.target.value)})}>
                         {catalogoCintas.filter(c => c.idgrado >= 11).map(g => (
                           <option key={g.idgrado} value={g.idgrado}>{g.nivelkupdan} - {g.color}</option>
                         ))}
                      </select>
                    </div>
                    {formError && <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20 flex items-center gap-3 text-red-500 font-bold text-[10px] uppercase tracking-widest"><AlertCircle size={16}/> {formError}</div>}
                    <motion.button whileTap={{ scale: 0.96 }} type="submit" disabled={saving} className="w-full h-20 bg-[var(--color-text)] text-[var(--color-card)] font-black rounded-[2.5rem] mt-4 shadow-2xl flex items-center justify-center gap-3 transition-all active:brightness-125">{saving ? <Loader2 className="animate-spin" size={24} /> : <><Save size={24}/> <span className="text-base uppercase italic tracking-tighter text-white">Completar Registro</span></>}</motion.button>
                  </form>
                ) : step === 'photo_choice' ? (
                  <div className="text-center space-y-10 py-6">
                    <div className="grid grid-cols-2 gap-5">
                       <button onClick={() => fileGalleryRef.current?.click()} className="flex flex-col items-center justify-center gap-4 p-10 bg-slate-50 dark:bg-black/20 rounded-[3rem] border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all group shadow-xl">
                         <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl shadow-lg group-hover:scale-110 transition-transform"><ImagePlus className="text-[var(--color-primary)]" size={32} /></div>
                         <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]">Galería</span>
                       </button>
                       <button onClick={startCamera} className="flex flex-col items-center justify-center gap-4 p-10 bg-slate-50 dark:bg-black/20 rounded-[3rem] border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all group shadow-xl">
                         <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl shadow-lg group-hover:scale-110 transition-transform"><CameraIcon className="text-[var(--color-primary)]" size={32} /></div>
                         <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]">Cámara</span>
                       </button>
                    </div>
                    <input type="file" ref={fileGalleryRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                    <button onClick={closeAndStop} className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 hover:text-[var(--color-primary)] transition-colors">Omitir por ahora</button>
                  </div>
                ) : step === 'camera_live' ? (
                  <div className="space-y-8 text-center py-4 animate-in zoom-in duration-300">
                    <div className="w-80 h-80 mx-auto bg-black rounded-[4.5rem] border-4 border-[var(--color-primary)] overflow-hidden relative shadow-2xl scale-x-[-1]">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    </div>
                    <div className="flex justify-center">
                       <button onClick={takePhoto} className="w-24 h-24 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center shadow-[0_0_40px_-10px_var(--color-primary)] active:scale-90 transition-all border-8 border-[var(--color-card)]">
                          <CameraIcon size={40} />
                       </button>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Encuadra el rostro del maestro</p>
                  </div>
                ) : (
                  <div className="text-center space-y-10 py-6 animate-in fade-in">
                    <div className="w-64 h-64 mx-auto rounded-[4rem] border-4 border-[var(--color-primary)] overflow-hidden shadow-2xl relative">
                       {previewUrl && <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />}
                       {saving && <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm"><Loader2 className="animate-spin text-white" size={48} /></div>}
                    </div>
                    <div className="flex flex-col gap-4 px-10">
                       <motion.button whileTap={{ scale: 0.95 }} onClick={handleUploadConfirmed} disabled={saving} className="w-full h-20 bg-[var(--color-text)] text-[var(--color-card)] font-black rounded-3xl flex items-center justify-center gap-4 shadow-xl active:brightness-125 disabled:opacity-50">
                          <CheckCircle2 size={24} /> <span className="text-lg uppercase italic tracking-tighter text-white">Sincronizar Identidad</span>
                       </motion.button>
                       <button onClick={() => { stopCamera(); setStep('photo_choice'); }} disabled={saving} className="w-full h-14 bg-slate-100 dark:bg-white/5 text-[var(--color-text)] font-black rounded-3xl flex items-center justify-center gap-3 transition-all">
                          <RotateCcw size={18} /> <span className="text-[11px] uppercase opacity-60 tracking-widest font-bold">Repetir captura</span>
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