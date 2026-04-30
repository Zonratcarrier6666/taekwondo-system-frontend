import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, Plus, User, Camera, Save, X, Loader2, 
  ShieldCheck, Search, ChevronRight, ImagePlus, UserPlus, 
  AlertCircle, Smartphone, CheckCircle2, 
  RotateCcw, CameraIcon, Pencil, PowerOff, Trash2, Power
} from 'lucide-react';

// --- IMPORTACIONES MODULARES (Configuradas para tu estructura de carpetas) ---
import { profesorService } from '../../services/profesor.service';
import { usuarioService } from '../../services/usuarios.service';
import { escuelaService } from '../../services/escuela.service';
import { cintasService } from '../../services/cintas.service';
import { themeService } from '../../services/theme.service';
import type { Profesor } from '../../types/profesor.types';
import type { RegistroProfesorDTO } from '../../types/usuarios.types';

/**
 * VISTA: GESTIÓN DE PROFESORES
 * Permite administrar el staff técnico de la escuela, registros de acceso y fotos de perfil.
 */
export const GestionProfesores: React.FC = () => {
  // Datos
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [catalogoCintas, setCatalogoCintas] = useState<any[]>([]);
  const [idescuela, setIdescuela] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Acciones de tarjeta
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [editProfesor, setEditProfesor] = useState<Profesor | null>(null);
  const [editForm, setEditForm] = useState<{ nombrecompleto: string; idgradodan: number }>({ nombrecompleto: '', idgradodan: 11 });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  // Modal y Control de Pasos
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<'form' | 'photo_choice' | 'camera_live' | 'preview'>('form'); 
  const [selectedProfId, setSelectedProfId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  /** Safely extract a human-readable message from any API error shape.
   *  FastAPI can return `detail` as a string OR as an array of validation
   *  objects like [{ type, loc, msg, input }]. Both cases are handled here. */
  const extractErrorMessage = (err: any, fallback: string): string => {
    const detail = err?.response?.data?.detail;
    if (!detail) return fallback;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      // Each item has a `msg` string; join them for a readable error.
      return detail.map((d: any) => (typeof d?.msg === 'string' ? d.msg : JSON.stringify(d))).join(' · ');
    }
    // Unexpected shape — don't let an object reach the renderer.
    return fallback;
  };
  
  // Multimedia (Cámara y Archivos)
  const [tempFile, setTempFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileGalleryRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Password temporal recibida del backend tras crear profesor
  const [passwordTemporal, setPasswordTemporal] = useState<string | null>(null);

  // Formulario vinculado al nuevo DTO de usuario/profesor
  const [formData, setFormData] = useState<{
    nombre_completo: string;
    username: string;
    password: string;
    idgradodan: number;
  }>({
    nombre_completo: '',
    username: '',
    password: '',
    idgradodan: 11,
  });

  // --- CARGA DE DATOS ---
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [profRes, cintaRes, escuelaRes] = await Promise.all([
        profesorService.listarProfesores(),
        cintasService.listarGrados(),
        escuelaService.getMiEscuela(),
      ]);
      setProfesores(profRes);
      setCatalogoCintas(cintaRes);
      setIdescuela(escuelaRes.id);
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
    setFormData({ nombre_completo: '', username: '', password: '', idgradodan: 11 });
    setConfirmPassword('');
    setPasswordTemporal(null);
    setFormError(null);
    setShowPass(false);
    setShowConfirmPass(false);
    setStep('form');
    setIsModalOpen(true);
  };

  const handleCreateProfesor = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (formData.nombre_completo.trim().length < 5) return setFormError("Ingresa el nombre completo del profesor.");
    if (!formData.username.trim()) return setFormError("El identificador de acceso es obligatorio.");
    if (formData.password.length < 12) return setFormError("La contraseña debe tener al menos 12 caracteres.");
    if (!/[A-Z]/.test(formData.password)) return setFormError("La contraseña debe incluir al menos una mayúscula.");
    if (!/[a-z]/.test(formData.password)) return setFormError("La contraseña debe incluir al menos una minúscula.");
    if (!/[0-9]/.test(formData.password)) return setFormError("La contraseña debe incluir al menos un número.");
    if (!/[^A-Za-z0-9]/.test(formData.password)) return setFormError("La contraseña debe incluir al menos un carácter especial (!@#$%...).");
    if (formData.password !== confirmPassword) return setFormError("Las contraseñas no coinciden.");

    if (!idescuela) return setFormError("No se encontró la escuela. Recarga la app.");

    const dto: RegistroProfesorDTO = {
      username: formData.username.trim(),
      password: formData.password,
      rol: 'Profesor',
      nombre_completo: formData.nombre_completo.trim(),
      idescuela,
      idgradodan: formData.idgradodan,
    };

    setSaving(true);
    try {
      const nuevo = await usuarioService.registrarProfesor(dto);
      // Después de crear el usuario, refrescamos la lista de profesores
      const profList = await profesorService.listarProfesores();
      setProfesores(profList);
      // El profe recién creado debería ser el último — buscamos por username
      const recien = profList.find(p => p.email === formData.username || p.nombrecompleto === formData.nombre_completo.trim());
      setSelectedProfId(recien?.idprofesor ?? null);
      setPasswordTemporal(formData.password); // mostramos la pass que el admin eligió
      setStep('photo_choice');
    } catch (err: any) {
      setFormError(extractErrorMessage(err, "Error al registrar. El usuario podría ya existir."));
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
      setFormError(extractErrorMessage(err, "Fallo al sincronizar la fotografía con el servidor."));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEstatus = async (prof: Profesor) => {
    setActionLoading(prof.idprofesor);
    try {
      const updated = await profesorService.cambiarEstatus(prof.idprofesor, prof.estatus === 1 ? 0 : 1);
      setProfesores(prev => prev.map(p => p.idprofesor === prof.idprofesor ? updated : p));
    } catch (err: any) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenEdit = (prof: Profesor) => {
    setEditProfesor(prof);
    setEditForm({
      nombrecompleto: prof.nombrecompleto,
      idgradodan: prof.idgradodan,
    });
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!editProfesor) return;
    if (editForm.nombrecompleto.trim().length < 3) {
      setEditError('El nombre debe tener al menos 3 caracteres.');
      return;
    }
    setEditSaving(true);
    setEditError(null);
    try {
      const updated = await profesorService.actualizarProfesor(editProfesor.idprofesor, {
        nombrecompleto: editForm.nombrecompleto.trim(),
        idgradodan: editForm.idgradodan,
      });
      setProfesores(prev => prev.map(p => p.idprofesor === updated.idprofesor ? updated : p));
      setEditProfesor(null);
    } catch (err: any) {
      setEditError(extractErrorMessage(err, 'Error al guardar los cambios.'));
    } finally {
      setEditSaving(false);
    }
  };

  const handleEliminar = async (id: number) => {
    setActionLoading(id);
    try {
      await profesorService.eliminarProfesor(id);
      setProfesores(prev => prev.filter(p => p.idprofesor !== id));
      setConfirmDelete(null);
    } catch (err: any) {
      alert(extractErrorMessage(err, 'No se puede eliminar: el profesor tiene alumnos asignados.'));
    } finally {
      setActionLoading(null);
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
            <motion.div layout key={prof.idprofesor} className="bg-[var(--color-card)]/80 backdrop-blur-xl p-5 rounded-[2.8rem] border border-[var(--color-border)] shadow-lg flex flex-col gap-4 group hover:border-[var(--color-primary)]/40 transition-all">
              {/* Fila superior: avatar + nombre */}
              <div className="flex items-center gap-5">
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-[1.8rem] bg-[var(--color-background)] border-2 border-[var(--color-border)] overflow-hidden flex items-center justify-center shadow-inner group-hover:rotate-3 transition-transform duration-500">
                    {prof.foto_url ? <img src={prof.foto_url} className="w-full h-full object-cover" alt="" /> : <User size={30} className="text-slate-600 opacity-20" />}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl border-2 border-[var(--color-card)] flex items-center justify-center shadow-xl bg-black overflow-hidden">
                    <div className="absolute inset-0 bg-yellow-500 opacity-20" />
                    <span className="text-[10px] font-black italic text-white relative z-10">{prof.idgradodan >= 11 ? prof.idgradodan - 10 : prof.idgradodan}°</span>
                  </div>
                  {prof.estatus === 0 && (
                    <div className="absolute -top-1 -left-1 bg-red-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-lg leading-none">OFF</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-black uppercase italic tracking-tighter text-[var(--color-text)] leading-tight truncate">{prof.nombrecompleto}</h3>
                  <p className="text-[9px] font-bold text-[var(--color-primary)] uppercase tracking-widest mt-1 flex items-center gap-1.5"><ShieldCheck size={10} className="text-emerald-500" /> Instructor Cinturón Negro</p>
                </div>
              </div>

              {/* Fila inferior: botones de acción a ancho completo */}
              <div className="flex items-center gap-2 w-full">
                {/* Foto */}
                <button title="Cambiar foto" onClick={() => { setSelectedProfId(prof.idprofesor); setPasswordTemporal(null); setStep('photo_choice'); setIsModalOpen(true); }} className="flex-1 flex items-center justify-center p-2.5 bg-[var(--color-background)] rounded-2xl border border-[var(--color-border)] text-[var(--color-primary)] active:scale-90 transition-all hover:bg-[var(--color-primary)] hover:text-white shadow-sm">
                  <Camera size={17} />
                </button>
                {/* Editar */}
                <button title="Editar profesor" onClick={() => handleOpenEdit(prof)} className="flex-1 flex items-center justify-center p-2.5 bg-[var(--color-background)] rounded-2xl border border-[var(--color-border)] text-indigo-500 active:scale-90 transition-all hover:bg-indigo-500 hover:text-white shadow-sm">
                  <Pencil size={17} />
                </button>
                {/* Activar/Desactivar */}
                <button title={prof.estatus === 1 ? 'Desactivar' : 'Activar'} onClick={() => handleToggleEstatus(prof)} disabled={actionLoading === prof.idprofesor} className={`flex-1 flex items-center justify-center p-2.5 rounded-2xl border active:scale-90 transition-all shadow-sm disabled:opacity-40 ${prof.estatus === 1 ? 'bg-[var(--color-background)] border-[var(--color-border)] text-red-500 hover:bg-red-500 hover:text-white' : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-500 hover:text-white'}`}>
                  {prof.estatus === 1 ? <PowerOff size={17} /> : <Power size={17} />}
                </button>
                {/* Eliminar */}
                {confirmDelete === prof.idprofesor ? (
                  <div className="flex gap-1.5 flex-1">
                    <button onClick={() => handleEliminar(prof.idprofesor)} disabled={actionLoading === prof.idprofesor} className="flex-1 flex items-center justify-center p-2.5 bg-red-500 rounded-2xl text-white active:scale-90 shadow-sm disabled:opacity-40">
                      {actionLoading === prof.idprofesor ? <Loader2 size={17} className="animate-spin" /> : <Trash2 size={17} />}
                    </button>
                    <button onClick={() => setConfirmDelete(null)} className="flex-1 flex items-center justify-center p-2.5 bg-[var(--color-background)] rounded-2xl border border-[var(--color-border)] text-[var(--color-text)] active:scale-90">
                      <X size={17} />
                    </button>
                  </div>
                ) : (
                  <button title="Eliminar profesor" onClick={() => setConfirmDelete(prof.idprofesor)} className="flex-1 flex items-center justify-center p-2.5 bg-[var(--color-background)] rounded-2xl border border-[var(--color-border)] text-red-400 active:scale-90 transition-all hover:bg-red-500 hover:text-white shadow-sm">
                    <Trash2 size={17} />
                  </button>
                )}
              </div>
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
                      <label className="text-[10px] font-black uppercase text-slate-500 ml-3 tracking-widest">Usuario de acceso</label>
                      <input required placeholder="maestro.pro" className="w-full h-14 px-6 bg-[var(--color-background)] rounded-2xl border border-transparent focus:border-[var(--color-primary)] outline-none font-bold text-sm text-[var(--color-text)] shadow-inner" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500 ml-3 tracking-widest">Contraseña</label>
                      <div className="relative">
                        <input
                          required
                          type={showPass ? 'text' : 'password'}
                          placeholder="Mín. 12 · Mayús · Núm · Especial"
                          className="w-full h-14 px-6 pr-14 bg-[var(--color-background)] rounded-2xl border border-transparent focus:border-[var(--color-primary)] outline-none font-bold text-sm text-[var(--color-text)] shadow-inner transition-all"
                          value={formData.password}
                          onChange={e => setFormData({...formData, password: e.target.value})}
                        />
                        <button type="button" onClick={() => setShowPass(p => !p)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-widest text-[var(--color-primary)] opacity-60 hover:opacity-100">
                          {showPass ? 'Ocultar' : 'Ver'}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500 ml-3 tracking-widest">Confirmar Contraseña</label>
                      <div className="relative">
                        <input
                          required
                          type={showConfirmPass ? 'text' : 'password'}
                          placeholder="Repite la contraseña"
                          className="w-full h-14 px-6 pr-14 bg-[var(--color-background)] rounded-2xl border border-transparent focus:border-[var(--color-primary)] outline-none font-bold text-sm text-[var(--color-text)] shadow-inner transition-all"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                        />
                        <button type="button" onClick={() => setShowConfirmPass(p => !p)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-widest text-[var(--color-primary)] opacity-60 hover:opacity-100">
                          {showConfirmPass ? 'Ocultar' : 'Ver'}
                        </button>
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
                    {passwordTemporal && (
                      <div className="p-5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-3xl text-left space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">✓ Profesor registrado — Contraseña asignada</p>
                        <div className="flex items-center gap-3 bg-white dark:bg-black/20 rounded-2xl px-4 py-3 border border-emerald-200 dark:border-emerald-500/20">
                          <code className="text-lg font-black tracking-widest text-[var(--color-text)] flex-1">{passwordTemporal}</code>
                          <button type="button" onClick={() => navigator.clipboard.writeText(passwordTemporal)} className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-colors">Copiar</button>
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold">Entrega esta contraseña al profesor de forma segura.</p>
                      </div>
                    )}
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

      {/* MODAL: Editar Profesor */}
      <AnimatePresence>
        {editProfesor && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => !editSaving && setEditProfesor(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} className="relative w-full max-w-sm bg-[var(--color-card)] rounded-[3rem] border border-[var(--color-border)] shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-7 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/15 rounded-2xl"><Pencil size={20} /></div>
                  <div>
                    <h3 className="text-lg font-black uppercase italic tracking-tighter leading-none">Editar Maestro</h3>
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">Actualizar datos del staff</p>
                  </div>
                </div>
                <button onClick={() => !editSaving && setEditProfesor(null)} className="p-2 bg-black/20 rounded-full hover:bg-black/30 transition-colors"><X size={18} /></button>
              </div>

              {/* Form */}
              <div className="p-7 space-y-4">
                {/* Avatar preview */}
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--color-background)] border-2 border-[var(--color-border)] overflow-hidden flex items-center justify-center flex-shrink-0">
                    {editProfesor.foto_url ? <img src={editProfesor.foto_url} className="w-full h-full object-cover" alt="" /> : <User size={24} className="text-slate-400 opacity-40" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Editando perfil</p>
                    <p className="text-xs font-black italic uppercase tracking-tight text-[var(--color-text)] opacity-60 truncate max-w-[160px]">{editProfesor.nombrecompleto}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-3 tracking-widest">Nombre Completo</label>
                  <input
                    className="w-full h-12 px-5 bg-[var(--color-background)] rounded-2xl border border-transparent focus:border-indigo-500 outline-none font-bold text-sm text-[var(--color-text)] transition-all shadow-inner"
                    value={editForm.nombrecompleto}
                    onChange={e => setEditForm(f => ({ ...f, nombrecompleto: e.target.value }))}
                    placeholder="Nombre completo"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-3 tracking-widest">Grado Dan</label>
                  <select
                    className="w-full h-12 px-5 bg-[var(--color-background)] rounded-2xl border border-transparent focus:border-indigo-500 outline-none font-black text-[11px] uppercase text-[var(--color-text)] appearance-none cursor-pointer shadow-inner"
                    value={editForm.idgradodan}
                    onChange={e => setEditForm(f => ({ ...f, idgradodan: parseInt(e.target.value) }))}
                  >
                    {catalogoCintas.filter(c => c.idgrado >= 11).map(g => (
                      <option key={g.idgrado} value={g.idgrado}>{g.nivelkupdan} - {g.color}</option>
                    ))}
                  </select>
                </div>

                {editError && (
                  <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 flex items-center gap-2 text-red-500 font-bold text-[10px] uppercase tracking-widest">
                    <AlertCircle size={14} /> {editError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => !editSaving && setEditProfesor(null)} disabled={editSaving}
                    className="flex-1 h-12 bg-[var(--color-background)] text-[var(--color-text)] font-black rounded-2xl text-[10px] uppercase tracking-widest border border-[var(--color-border)] disabled:opacity-40 active:scale-95 transition-transform">
                    Cancelar
                  </button>
                  <button onClick={handleSaveEdit} disabled={editSaving}
                    className="flex-[2] h-12 bg-indigo-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 active:scale-95 transition-transform hover:bg-indigo-600">
                    {editSaving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={15} /> Guardar cambios</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GestionProfesores;