import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Save, MapPin, Mail, School, Loader2, 
  Sparkles, Palette, Check, Info, Globe, PhoneCall,
  AlertTriangle
} from 'lucide-react';

// --- IMPORTACIONES MODULARES REALES ---
// Se utiliza 'import type' para los tipos según la configuración de tu proyecto
import { schoolService } from '../../services/escuela.service';
import { useAuth } from '../../context/AuthContext';
import type { Escuela, ThemeName } from '../../types/escuela.types';
import { paletas } from '../../constants/themes';

/**
 * COMPONENTE DE FONDO ANIMADO
 * Ajustado para soportar las paletas definidas en el archivo de constantes.
 */
const ThemeBackground = ({ theme }: { theme: string }) => {
  const particles = Array.from({ length: 22 });
  
  const getThemeConfig = () => {
    const config = paletas.find(p => p.id === theme);
    if (!config) return { color: '#94a3b8', type: 'float', icon: '•' };
    
    // Mapeo de tipos de animación según el tema seleccionado
    switch(theme) {
      case 'sakura-dojo': return { color: config.color, type: 'sakura', icon: '🌸' };
      case 'rojo-dragon': return { color: config.color, type: 'pulse', icon: '⚡' };
      case 'black-gold': return { color: config.color, type: 'stars', icon: '✨' };
      case 'black-red': return { color: config.color, type: 'embers', icon: '🔥' };
      case 'black-green': return { color: config.color, type: 'pulse', icon: '🍃' };
      case 'black-orange': return { color: config.color, type: 'embers', icon: '💥' };
      case 'blue-ocean': return { color: config.color, type: 'bubbles', icon: '🫧' };
      case 'forest-dojo': return { color: config.color, type: 'leaves', icon: '🍃' };
      case 'purple-ninja': return { color: config.color, type: 'spirit', icon: '🔮' };
      case 'midnight-void': return { color: config.color, type: 'fog', icon: '🌌' };
      case 'obsidian-flame': return { color: config.color, type: 'embers', icon: '🏮' };
      default: return { color: config.color, type: 'float', icon: '•' };
    }
  };

  const config = getThemeConfig();

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-[var(--color-background)] transition-colors duration-1000">
      <AnimatePresence mode="wait">
        <motion.div 
          key={theme} 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0"
        >
          {particles.map((_, i) => (
            <motion.div
              key={i}
              className="absolute flex items-center justify-center opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                color: config.color,
              }}
              animate={{
                y: [0, -130, 0],
                opacity: [0.1, 0.4, 0.1],
                scale: [1, 1.4, 1],
                rotate: config.type === 'sakura' || config.type === 'leaves' ? [0, 360] : 0
              }}
              transition={{
                duration: 7 + Math.random() * 12,
                repeat: Infinity,
                delay: Math.random() * 5
              }}
            >
              <span style={{ fontSize: 14 + Math.random() * 12 }}>{config.icon}</span>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export const PerfilConfiguracion = () => {
  const { setTheme } = useAuth();
  const [escuela, setEscuela] = useState<Escuela | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Carga inicial usando el schoolService real
    schoolService.getMiEscuela()
      .then(res => {
        setEscuela(res);
        if (res.color_paleta) setTheme(res.color_paleta as ThemeName);
      })
      .catch(err => console.error("Error al cargar escuela:", err))
      .finally(() => setLoading(false));
  }, [setTheme]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!escuela?.nombreescuela || escuela.nombreescuela.trim().length < 3) {
      newErrors.nombre = "Mín. 3 letras";
    }
    if (!escuela?.direccion || escuela.direccion.trim().length < 5) {
      newErrors.direccion = "Requerida";
    }
    if (escuela?.correo_escuela && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(escuela.correo_escuela)) {
      newErrors.correo = "E-mail inválido";
    }
    if (escuela?.telefono_oficina && !/^\d{10}$/.test(escuela.telefono_oficina)) {
      newErrors.telefono = "10 dígitos";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Maneja la actualización de datos (PUT)
   */
  const handleSave = async () => {
    if (!escuela || !validate()) return;
    setSaving(true);
    try {
      // Llamada al método PUT definido en tu schoolService
      await schoolService.updatePerfil(escuela);
      setTheme(escuela.color_paleta as ThemeName);
    } catch (err) {
      console.error("Error al guardar perfil:", err);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Maneja la subida del logotipo (POST)
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !escuela) return;

    setUploading(true);
    try {
      // Llamada al método POST con FormData definido en tu schoolService
      const res = await schoolService.uploadLogo(file);
      // Actualizamos el estado con la nueva URL del logo devuelta por Render
      setEscuela({ ...escuela, logo_url: res.logo_url });
    } catch (err) {
      console.error("Error al subir logo:", err);
    } finally {
      setUploading(false);
    }
  };

  if (loading || !escuela) return (
    <div className="flex flex-col items-center justify-center p-20 min-h-[60vh]">
      <Loader2 className="animate-spin text-[var(--color-primary)]" size={32} />
    </div>
  );

  return (
    <div className="relative min-h-screen pb-40">
      <ThemeBackground theme={escuela.color_paleta} />

      <div className="max-w-xl mx-auto px-6 pt-4 space-y-6">
        
        {/* CABECERA PERFIL CON SUBIDA DE LOGO (Botón de Cámara) */}
        <div className="flex flex-col items-center">
          <div className="relative group">
            <motion.div 
              whileTap={{ scale: 0.95 }}
              className="w-28 h-28 rounded-[2rem] bg-[var(--color-card)] shadow-xl border-4 border-[var(--color-background)] overflow-hidden relative flex items-center justify-center transition-all"
            >
              {uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                  <Loader2 className="animate-spin text-white" />
                </div>
              )}
              {escuela.logo_url ? (
                <img src={escuela.logo_url} className="w-full h-full object-cover" alt="Logo" />
              ) : (
                <School size={40} className="text-[var(--color-text-muted)] opacity-20" />
              )}
            </motion.div>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()} 
              disabled={uploading}
              className="absolute -bottom-1 -right-1 p-2.5 bg-[var(--color-primary)] text-white rounded-xl shadow-lg border-2 border-[var(--color-background)] active:scale-90 transition-all hover:brightness-110 disabled:opacity-50 z-20"
            >
              <Camera size={14} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange} 
              accept="image/*" 
            />
          </div>
          <h2 className="mt-3 text-xl font-black italic uppercase text-[var(--color-text)] tracking-tighter text-center leading-none">
            {escuela.nombreescuela}
          </h2>
          <p className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mt-1 opacity-60">
            {escuela.lema || 'Disciplina y Honor'}
          </p>
        </div>

        {/* CONTENEDOR DE FORMULARIOS */}
        <div className="space-y-4">
          
          <div className={`bg-[var(--color-card)]/80 backdrop-blur-xl p-5 rounded-[2.5rem] border shadow-lg transition-all ${errors.nombre ? 'border-red-500/50 ring-1 ring-red-500/20' : 'border-[var(--color-border)]'}`}>
            <div className="flex items-center justify-between mb-4 border-b border-[var(--color-border)]/30 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[var(--color-primary)]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Identidad</span>
              </div>
              {errors.nombre && <span className="text-[8px] font-black text-red-500 uppercase flex items-center gap-1"><AlertTriangle size={10} /> {errors.nombre}</span>}
            </div>
            
            <div className="space-y-3">
              <input 
                value={escuela.nombreescuela} 
                onChange={e => setEscuela({...escuela, nombreescuela: e.target.value})}
                placeholder="Nombre Institucional"
                className={`w-full h-10 bg-[var(--color-background)]/50 rounded-xl px-4 font-bold text-xs outline-none border transition-all ${errors.nombre ? 'border-red-500/40 text-red-500' : 'border-transparent focus:border-[var(--color-primary)] text-[var(--color-text)]'}`}
              />
              <input 
                value={escuela.lema || ''} 
                onChange={e => setEscuela({...escuela, lema: e.target.value})}
                placeholder="Lema o Eslogan"
                className="w-full h-10 bg-[var(--color-background)]/50 rounded-xl px-4 font-bold text-xs italic outline-none border border-transparent focus:border-[var(--color-primary)] text-[var(--color-text)] transition-all"
              />
            </div>
          </div>

          <div className={`bg-[var(--color-card)]/80 backdrop-blur-xl p-5 rounded-[2.5rem] border shadow-lg transition-all ${Object.keys(errors).some(k => ['correo', 'telefono', 'direccion'].includes(k)) ? 'border-red-500/50 ring-1 ring-red-500/20' : 'border-[var(--color-border)]'}`}>
            <div className="flex items-center justify-between mb-4 border-b border-[var(--color-border)]/30 pb-2">
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-[var(--color-primary)]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Localización</span>
              </div>
              {Object.keys(errors).length > 0 && <span className="text-[8px] font-black text-red-500 uppercase flex items-center gap-1"><AlertTriangle size={10} /> Revisar datos</span>}
            </div>

            <div className="space-y-3">
              <div className="relative">
                <MapPin size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.direccion ? 'text-red-500' : 'text-[var(--color-primary)]'}`} />
                <input 
                  value={escuela.direccion || ''} 
                  onChange={e => setEscuela({...escuela, direccion: e.target.value})}
                  className={`w-full h-10 bg-[var(--color-background)]/50 rounded-xl pl-10 pr-4 font-bold text-xs outline-none border transition-all ${errors.direccion ? 'border-red-500/40 text-red-500' : 'border-transparent focus:border-[var(--color-primary)] text-[var(--color-text)]'}`}
                  placeholder="Dirección Física"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Mail size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.correo ? 'text-red-500' : 'text-[var(--color-primary)]'}`} />
                  <input 
                    value={escuela.correo_escuela || ''} 
                    onChange={e => setEscuela({...escuela, correo_escuela: e.target.value})}
                    className={`w-full h-10 bg-[var(--color-background)]/50 rounded-xl pl-10 pr-3 font-bold text-[10px] outline-none border transition-all ${errors.correo ? 'border-red-500/40 text-red-500' : 'border-transparent focus:border-[var(--color-primary)] text-[var(--color-text)]'}`}
                    placeholder="E-Mail"
                  />
                </div>
                <div className="relative">
                  <PhoneCall size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.telefono ? 'text-red-500' : 'text-[var(--color-primary)]'}`} />
                  <input 
                    value={escuela.telefono_oficina || ''} 
                    onChange={e => setEscuela({...escuela, telefono_oficina: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                    className={`w-full h-10 bg-[var(--color-background)]/50 rounded-xl pl-10 pr-3 font-bold text-[10px] outline-none border transition-all ${errors.telefono ? 'border-red-500/40 text-red-500' : 'border-transparent focus:border-[var(--color-primary)] text-[var(--color-text)]'}`}
                    placeholder="Teléfono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SELECTOR DE TODAS LAS PALETAS (CONSUME CONSTANTE PALETAS) */}
          <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-5 rounded-[2.5rem] border border-[var(--color-border)] shadow-lg transition-colors">
            <div className="flex items-center gap-2 mb-4 px-1">
              <Palette size={14} className="text-[var(--color-primary)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Identidad Visual</span>
            </div>
            
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 h-48 overflow-y-auto pr-2 custom-scrollbar">
              {paletas.map(p => (
                <button 
                  key={p.id} 
                  type="button"
                  onClick={() => {
                    setEscuela({...escuela, color_paleta: p.id});
                    setTheme(p.id as ThemeName);
                  }}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div 
                    className={`w-10 h-10 rounded-xl border-2 transition-all flex items-center justify-center relative ${
                      escuela.color_paleta === p.id 
                        ? 'border-[var(--color-text)] scale-110 shadow-md ring-4 ring-[var(--color-primary)]/10' 
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`} 
                    style={{ backgroundColor: p.color }}
                  >
                    {escuela.color_paleta === p.id && <Check size={12} className="text-white drop-shadow-md" strokeWidth={5} />}
                  </div>
                  <span className={`text-[6px] font-black uppercase tracking-tighter text-center truncate w-full ${escuela.color_paleta === p.id ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}>
                    {p.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ACCIÓN PRINCIPAL - GUARDADO REAL (PUT) */}
        <button 
          onClick={handleSave} 
          disabled={saving}
          className={`w-full h-14 font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 ${Object.keys(errors).length > 0 ? 'bg-red-500 text-white' : 'bg-[var(--color-text)] text-[var(--color-card)]'}`}
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : (
            <>
              <Save size={18} /> 
              <span className="text-sm italic uppercase tracking-tight">Sincronizar Dojo</span>
            </>
          )}
        </button>

        <p className="flex items-center justify-center gap-2 text-[8px] font-black text-[var(--color-text-muted)] uppercase tracking-widest opacity-40 text-center pb-8">
          <Info size={10} /> Configuración maestra de la academia
        </p>
      </div>
    </div>
  );
};

export default PerfilConfiguracion;