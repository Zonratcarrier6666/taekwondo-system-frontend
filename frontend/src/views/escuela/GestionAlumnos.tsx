import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, Plus, UserPlus, Filter, ChevronRight, 
  Camera, ImagePlus, CheckCircle2, RotateCcw, X, 
  Loader2, Smartphone, ShieldCheck, User,
  Calendar, Phone, MapPin, GraduationCap,
  Activity, Briefcase, CameraIcon, Eye,
  Save
} from 'lucide-react';

// --- IMPORTACIONES MODULARES ---
import { alumnoService } from '../../services/alumno.service';
import { profesorService } from '../../services/profesor.service';
import { cintasService } from '../../services/cintas.service';
import type { Alumno, AlumnoCreateDTO } from '../../types/alumno.types';

/**
 * COMPONENTE VISTA: GESTIÓN DE ALUMNOS
 * Módulo para la administración de la matrícula, registros y fichas técnicas.
 */
export const GestionAlumnos: React.FC = () => {
  // Datos y Estados
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [profesores, setProfesores] = useState<any[]>([]);
  const [cintas, setCintas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI y Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProf, setFilterProf] = useState<number | 'all'>('all');
  const [filterCinta, setFilterCinta] = useState<number | 'all'>('all');

  // Modal y Control de Flujo
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<'form' | 'detail' | 'photo_choice' | 'camera' | 'preview'>('form');
  const [selectedAlumno, setSelectedAlumno] = useState<Alumno | null>(null);
  const [saving, setSaving] = useState(false);

  // Multimedia (Cámara y Archivos)
  const [tempFile, setTempFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Formulario de Datos
  const [formData, setFormData] = useState<AlumnoCreateDTO>({
    nombres: '', apellidopaterno: '', apellidomaterno: '',
    fechanacimiento: '', nombretutor: '', telefonocontacto: '',
    correotutor: '', direcciondomicilio: '', grado_escolar: '',
    escuela_procedencia: '', tipo_sangre: 'O+', alergias: 'Ninguna',
    padecimientos_cronicos: 'Ninguno', seguro_medico: 'No cuenta',
    nss_o_poliza: 'N/A', idgradoactual: 1, idprofesor: null
  });

  // --- CARGA DE DATOS ---
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [aluRes, profRes, cintaRes] = await Promise.all([
        alumnoService.getAlumnos(),
        profesorService.listarProfesores(),
        cintasService.listarGrados()
      ]);
      setAlumnos(aluRes);
      setProfesores(profRes);
      setCintas(cintaRes);
    } catch (err) {
      console.error("Error al sincronizar datos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // --- LÓGICA DE FILTRADO ---
  const filtered = useMemo(() => {
    return alumnos.filter(a => {
      const matchName = `${a.nombres} ${a.apellidopaterno}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchProf = filterProf === 'all' || a.idprofesor === filterProf;
      const matchCinta = filterCinta === 'all' || a.idgradoactual === filterCinta;
      return matchName && matchProf && matchCinta;
    });
  }, [alumnos, searchTerm, filterProf, filterCinta]);

  // --- MANEJADORES DE INTERFAZ ---
  const handleOpenAdd = () => {
    setFormData({
      nombres: '', apellidopaterno: '', apellidomaterno: '',
      fechanacimiento: '', nombretutor: '', telefonocontacto: '',
      correotutor: '', direcciondomicilio: '', grado_escolar: '',
      escuela_procedencia: '', tipo_sangre: 'O+', alergias: 'Ninguna',
      padecimientos_cronicos: 'Ninguno', seguro_medico: 'No cuenta',
      nss_o_poliza: 'N/A', idgradoactual: 1, idprofesor: null
    });
    setStep('form');
    setIsModalOpen(true);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await alumnoService.registrar(formData);
      setSelectedAlumno(res);
      setAlumnos(prev => [...prev, res]);
      setStep('photo_choice');
    } catch (err) { 
      console.error("Fallo en el registro:", err);
    } finally { 
      setSaving(false); 
    }
  };

  // --- GESTIÓN DE CÁMARA ---
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: 640, height: 640 }, 
        audio: false 
      });
      streamRef.current = stream;
      setStep('camera');
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch (err) { 
      console.error("Acceso a cámara denegado:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const capture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 600; canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const size = Math.min(videoRef.current.videoWidth, videoRef.current.videoHeight);
      ctx.drawImage(videoRef.current, (videoRef.current.videoWidth - size) / 2, (videoRef.current.videoHeight - size) / 2, size, size, 0, 0, 600, 600);
      canvas.toBlob(blob => {
        if (blob) {
          const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
          setTempFile(file);
          setPreviewUrl(URL.createObjectURL(file));
          stopCamera();
          setStep('preview');
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const confirmUpload = async () => {
    if (!tempFile || !selectedAlumno) return;
    setSaving(true);
    try {
      await alumnoService.subirFoto(selectedAlumno.idalumno, tempFile);
      await loadData(); // Recargamos lista completa para ver la foto
      setIsModalOpen(false);
    } catch (err) { 
      console.error("Fallo al subir fotografía:", err);
    } finally { 
      setSaving(false); 
    }
  };

  return (
    <div className="space-y-6 pb-40">
      
      {/* SECCIÓN SUPERIOR: BÚSQUEDA Y FILTROS */}
      <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-[var(--color-primary)] border border-[var(--color-primary)]/20 shadow-inner">
              <Users size={26} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase italic tracking-tighter text-[var(--color-text)] leading-none">Matrícula</h2>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1.5 opacity-60">Fuerza Estudiantil</p>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleOpenAdd} className="w-14 h-14 bg-[var(--color-primary)] text-white rounded-[1.8rem] flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/20 active:brightness-110 transition-all">
            <Plus size={28} strokeWidth={3} />
          </motion.button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[var(--color-primary)] transition-colors" size={20} />
            <input type="text" placeholder="Nombre del alumno..." className="w-full h-14 pl-14 pr-6 bg-[var(--color-background)]/50 rounded-2xl border border-transparent focus:border-[var(--color-primary)] outline-none font-bold text-sm text-[var(--color-text)] shadow-inner transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] shadow-sm">
              <Briefcase size={14} className="text-[var(--color-primary)]" />
              <select className="bg-transparent text-[10px] font-black uppercase outline-none text-[var(--color-text)] cursor-pointer" value={filterProf} onChange={e => setFilterProf(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}>
                <option value="all">Cualquier Instructor</option>
                {profesores.map((p: any) => <option key={p.idprofesor} value={p.idprofesor}>{p.nombrecompleto}</option>)}
              </select>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)] shadow-sm">
              <ShieldCheck size={14} className="text-orange-500" />
              <select className="bg-transparent text-[10px] font-black uppercase outline-none text-[var(--color-text)] cursor-pointer" value={filterCinta} onChange={e => setFilterCinta(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}>
                <option value="all">Grado Técnico</option>
                {cintas.map((c: any) => <option key={c.idgrado} value={c.idgrado}>{c.nivelkupdan}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* LISTADO DE ALUMNOS */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-24 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-[var(--color-primary)]" size={40} />
            <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Consultando archivos...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center opacity-20 italic font-black uppercase tracking-[0.3em] text-[10px]">Sin registros encontrados</div>
        ) : (
          filtered.map(alumno => (
            <motion.div layout key={alumno.idalumno} className="bg-[var(--color-card)]/80 backdrop-blur-xl p-5 rounded-[2.8rem] border border-[var(--color-border)] shadow-lg flex items-center justify-between group hover:border-[var(--color-primary)]/40 transition-all">
              <div className="flex items-center gap-5">
                <div className="relative">
                   <div className="w-16 h-16 rounded-[2rem] bg-slate-900 border-2 border-[var(--color-border)] overflow-hidden flex items-center justify-center shadow-inner group-hover:rotate-3 transition-transform duration-500">
                     {alumno.fotoalumno ? <img src={alumno.fotoalumno} className="w-full h-full object-cover" alt="" /> : <User size={30} className="text-slate-600 opacity-20" />}
                   </div>
                   <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl border-2 border-[var(--color-card)] shadow-xl flex items-center justify-center bg-black text-[9px] font-black italic text-white">{alumno.idgradoactual}G</div>
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase italic tracking-tighter text-[var(--color-text)] leading-tight">{alumno.nombres} {alumno.apellidopaterno}</h3>
                  <div className="flex items-center gap-2 mt-1.5 opacity-50">
                     <span className="text-[8px] font-black uppercase tracking-tighter">ID #{alumno.idalumno}</span>
                     <span className="w-1 h-1 bg-slate-500 rounded-full" />
                     <span className="text-[8px] font-black uppercase text-[var(--color-primary)]">{cintas.find((c: any) => c.idgrado === alumno.idgradoactual)?.nivelkupdan}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => { setSelectedAlumno(alumno); setStep('detail'); setIsModalOpen(true); }} className="p-3.5 bg-[var(--color-background)] rounded-2xl border border-[var(--color-border)] text-[var(--color-primary)] active:scale-90 transition-all"><Eye size={18} strokeWidth={2.5} /></button>
                 <button onClick={() => { setSelectedAlumno(alumno); setStep('photo_choice'); setIsModalOpen(true); }} className="p-3.5 bg-[var(--color-background)] rounded-2xl border border-[var(--color-border)] text-orange-500 active:scale-90 transition-all"><Camera size={18} strokeWidth={2.5} /></button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* MODAL MAESTRO DINÁMICO */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => { stopCamera(); setIsModalOpen(false); }} />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="relative w-full max-w-2xl bg-[var(--color-card)] rounded-[4rem] border border-[var(--color-border)] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col transition-all duration-500">
              
              <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] p-9 text-white flex justify-between items-center relative overflow-hidden flex-shrink-0 transition-colors duration-1000">
                 <div className="flex items-center gap-5 relative z-10">
                    <div className="p-4 bg-white/15 rounded-[1.8rem] backdrop-blur-xl border border-white/10 shadow-inner">
                      {step === 'form' ? <UserPlus size={28} /> : step === 'detail' ? <GraduationCap size={28} /> : <Smartphone size={28} />}
                    </div>
                    <div>
                       <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">
                         {step === 'form' ? 'Nueva Inscripción' : step === 'detail' ? 'Expediente' : 'Cámara'}
                       </h3>
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mt-1.5">Matrícula Institucional</p>
                    </div>
                 </div>
                 <button onClick={() => { stopCamera(); setIsModalOpen(false); }} className="p-3 bg-black/20 rounded-full hover:bg-black/30 transition-colors"><X size={22} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                {step === 'form' ? (
                  <form onSubmit={handleRegister} className="space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black uppercase ml-3 opacity-60">Nombres</label>
                           <input required className="w-full h-14 px-6 bg-black/10 dark:bg-[var(--color-background)] rounded-2xl border border-transparent focus:border-[var(--color-primary)] outline-none font-bold text-sm text-[var(--color-text)] shadow-inner" value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-black uppercase ml-3 opacity-60">Paterno</label>
                              <input required className="w-full h-14 px-6 bg-black/10 dark:bg-[var(--color-background)] rounded-2xl border border-transparent focus:border-[var(--color-primary)] outline-none font-bold text-sm text-[var(--color-text)] shadow-inner" value={formData.apellidopaterno} onChange={e => setFormData({...formData, apellidopaterno: e.target.value})} />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-black uppercase ml-3 opacity-60">Materno</label>
                              <input className="w-full h-14 px-6 bg-black/10 dark:bg-[var(--color-background)] rounded-2xl border border-transparent focus:border-[var(--color-primary)] outline-none font-bold text-sm text-[var(--color-text)] shadow-inner" value={formData.apellidomaterno} onChange={e => setFormData({...formData, apellidomaterno: e.target.value})} />
                           </div>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black uppercase ml-3 opacity-60">Instructor Responsable</label>
                           <select required className="w-full h-14 px-6 bg-black/10 dark:bg-[var(--color-background)] rounded-2xl border border-transparent focus:border-[var(--color-primary)] outline-none font-black text-[11px] uppercase text-[var(--color-text)] shadow-inner" value={formData.idprofesor || ''} onChange={e => setFormData({...formData, idprofesor: parseInt(e.target.value)})}>
                              <option value="">-- Seleccionar --</option>
                              {profesores.map((p: any) => <option key={p.idprofesor} value={p.idprofesor}>{p.nombrecompleto}</option>)}
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black uppercase ml-3 opacity-60">Grado Kup/Dan</label>
                           <select required className="w-full h-14 px-6 bg-black/10 dark:bg-[var(--color-background)] rounded-2xl border border-transparent focus:border-[var(--color-primary)] outline-none font-black text-[11px] uppercase text-[var(--color-text)] shadow-inner" value={formData.idgradoactual} onChange={e => setFormData({...formData, idgradoactual: parseInt(e.target.value)})}>
                              {cintas.map((c: any) => <option key={c.idgrado} value={c.idgrado}>{c.nivelkupdan} - {c.color}</option>)}
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black uppercase ml-3 opacity-60">Nombre Tutor</label>
                           <input required className="w-full h-14 px-6 bg-black/10 dark:bg-[var(--color-background)] rounded-2xl border border-transparent focus:border-[var(--color-primary)] outline-none font-bold text-sm text-[var(--color-text)] shadow-inner" value={formData.nombretutor} onChange={e => setFormData({...formData, nombretutor: e.target.value})} />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black uppercase ml-3 opacity-60">Teléfono Contacto</label>
                           <input required className="w-full h-14 px-6 bg-black/10 dark:bg-[var(--color-background)] rounded-2xl border border-transparent focus:border-[var(--color-primary)] outline-none font-bold text-sm text-[var(--color-text)] shadow-inner" value={formData.telefonocontacto} onChange={e => setFormData({...formData, telefonocontacto: e.target.value})} />
                        </div>
                     </div>
                     <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={saving} className="w-full h-20 bg-[var(--color-text)] text-[var(--color-card)] font-black rounded-[2.5rem] shadow-2xl flex items-center justify-center gap-4 transition-all active:brightness-125">
                        {saving ? <Loader2 className="animate-spin" /> : <><Save size={24}/> <span className="text-base uppercase italic tracking-tighter text-white">Registrar e ir a foto</span></>}
                     </motion.button>
                  </form>
                ) : step === 'detail' && selectedAlumno ? (
                  <div className="space-y-10 pb-10">
                     <div className="flex flex-col md:flex-row gap-10 items-center border-b border-[var(--color-border)] pb-10">
                        <div className="w-48 h-48 rounded-[3.5rem] bg-slate-900 border-4 border-[var(--color-primary)] overflow-hidden shadow-2xl">
                           {selectedAlumno.fotoalumno ? <img src={selectedAlumno.fotoalumno} className="w-full h-full object-cover" alt="" /> : <User size={60} className="w-full h-full p-12 text-slate-800 opacity-30" />}
                        </div>
                        <div className="text-center md:text-left flex-1 space-y-3">
                           <span className="text-[10px] font-black uppercase text-[var(--color-primary)] tracking-[0.4em]">{cintas.find((c: any) => c.idgrado === selectedAlumno.idgradoactual)?.nivelkupdan}</span>
                           <h2 className="text-4xl font-black italic uppercase tracking-tighter text-[var(--color-text)] leading-none">{selectedAlumno.nombres}</h2>
                           <h3 className="text-2xl font-bold text-slate-500 uppercase tracking-tighter">{selectedAlumno.apellidopaterno} {selectedAlumno.apellidomaterno}</h3>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[var(--color-background)] p-6 rounded-[2.5rem] border border-[var(--color-border)] space-y-4 shadow-inner">
                           <h4 className="text-[11px] font-black uppercase tracking-widest opacity-30 border-b border-[var(--color-border)] pb-2 flex items-center gap-2"><Activity size={14} /> Información Técnica</h4>
                           <div className="grid grid-cols-2 gap-4">
                              <div><p className="text-[8px] font-black uppercase text-slate-500">Sangre</p><p className="text-sm font-black text-red-500">{selectedAlumno.tipo_sangre}</p></div>
                              <div><p className="text-[8px] font-black uppercase text-slate-500">Alergias</p><p className="text-sm font-bold text-[var(--color-text)]">{selectedAlumno.alergias}</p></div>
                           </div>
                        </div>
                        <div className="bg-[var(--color-background)] p-6 rounded-[2.5rem] border border-[var(--color-border)] space-y-4 shadow-inner">
                           <h4 className="text-[11px] font-black uppercase tracking-widest opacity-30 border-b border-[var(--color-border)] pb-2 flex items-center gap-2"><Phone size={14} /> Contacto</h4>
                           <p className="text-[8px] font-black uppercase text-slate-500">Tutor Responsable</p>
                           <p className="text-sm font-black text-[var(--color-text)]">{selectedAlumno.nombretutor}</p>
                           <p className="text-sm font-bold text-[var(--color-primary)]">{selectedAlumno.telefonocontacto}</p>
                        </div>
                     </div>
                  </div>
                ) : step === 'photo_choice' ? (
                  <div className="py-12 text-center space-y-10">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <button onClick={() => fileRef.current?.click()} className="flex flex-col items-center justify-center gap-5 p-12 bg-black/10 dark:bg-black/40 rounded-[3.5rem] border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all group shadow-xl">
                          <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-lg group-hover:scale-110 transition-transform"><ImagePlus className="text-[var(--color-primary)]" size={40} /></div>
                          <span className="text-xs font-black uppercase tracking-widest text-[var(--color-text)]">Desde Galería</span>
                        </button>
                        <button onClick={startCamera} className="flex flex-col items-center justify-center gap-5 p-12 bg-black/10 dark:bg-black/40 rounded-[3.5rem] border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all group shadow-xl">
                          <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-lg group-hover:scale-110 transition-transform"><CameraIcon className="text-[var(--color-primary)]" size={40} /></div>
                          <span className="text-xs font-black uppercase tracking-widest text-[var(--color-text)]">Cámara en Vivo</span>
                        </button>
                     </div>
                     <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={e => {
                       const file = e.target.files?.[0];
                       if(file) { setTempFile(file); setPreviewUrl(URL.createObjectURL(file)); setStep('preview'); }
                     }} />
                     <button onClick={() => setIsModalOpen(false)} className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 border-b border-transparent hover:border-current pb-1">Omitir por ahora</button>
                  </div>
                ) : step === 'camera' ? (
                  <div className="space-y-10 text-center py-6">
                    <div className="w-80 h-80 mx-auto bg-black rounded-[5rem] border-4 border-[var(--color-primary)] overflow-hidden relative shadow-2xl scale-x-[-1]">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    </div>
                    <div className="flex justify-center">
                       <button onClick={capture} className="w-24 h-24 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center shadow-[0_0_40px_-10px_var(--color-primary)] active:scale-90 transition-all border-8 border-[var(--color-card)]"><CameraIcon size={40} /></button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-12 py-8 animate-in fade-in duration-500">
                    <div className="w-72 h-72 mx-auto rounded-[5rem] border-4 border-[var(--color-primary)] overflow-hidden shadow-2xl relative">
                       {previewUrl && <img src={previewUrl} className="w-full h-full object-cover" alt="" />}
                       {saving && <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm"><Loader2 className="animate-spin text-white" size={54} /></div>}
                    </div>
                    <div className="flex flex-col gap-5 px-12 max-w-sm mx-auto">
                       <motion.button whileTap={{ scale: 0.95 }} onClick={confirmUpload} disabled={saving} className="w-full h-20 bg-[var(--color-text)] text-[var(--color-card)] font-black rounded-3xl flex items-center justify-center gap-4 shadow-xl active:brightness-125">
                          <CheckCircle2 size={24} /> <span className="text-lg uppercase italic tracking-tighter text-white">Guardar Foto</span>
                       </motion.button>
                       <button onClick={() => setStep('photo_choice')} disabled={saving} className="text-[11px] font-black uppercase text-slate-500 tracking-widest font-bold">Capturar otra</button>
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

export default GestionAlumnos;