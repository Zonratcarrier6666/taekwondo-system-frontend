import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Save,
  MapPin,
  Mail,
  School,
  Loader2,
  Palette,
  Check,
  PhoneCall,
  Globe,
  Sparkles,
} from 'lucide-react';

// Servicios y Tipos
import { escuelaService } from '../../services/escuela.service';
import { useAuth } from '../../context/AuthContext';
import type { Escuela, ThemeName } from '../../types/escuela.types';
import { LISTA_TEMAS } from '../../constants/themes';

interface Props {
  initialEscuela?: Escuela;
}

/**
 * COMPONENTE: ThemeBackground
 * Genera el ambiente visual dinámico basado en el tema activo.
 */
const ThemeBackground = ({ theme }: { theme: string }) => {
  const themeObj = LISTA_TEMAS.find(t => t.id === theme) ?? LISTA_TEMAS[0];
  const particles = Array.from({ length: 15 });

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[var(--color-background)] transition-colors duration-1000">
      <AnimatePresence mode="wait">
        <motion.div key={theme} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
          {particles.map((_, i) => (
            <motion.div
              key={i}
              className="absolute flex items-center justify-center opacity-10"
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, color: themeObj.color }}
              animate={{
                y: [0, -200, 0],
                opacity: [0.1, 0.4, 0.1],
                scale: [1, 1.4, 1],
              }}
              transition={{
                duration: 10 + Math.random() * 10,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            >
              <span style={{ fontSize: 18 + Math.random() * 20 }}>{themeObj.icon}</span>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export const PerfilConfiguracion: React.FC<Props> = ({ initialEscuela }) => {
  const { setTheme } = useAuth();
  
  const [formData, setFormData] = useState<Partial<Escuela>>(initialEscuela || {
    nombreescuela: '',
    lema: '',
    direccion: '',
    correo_escuela: '',
    telefono_oficina: '',
    color_paleta: 'blue-ocean'
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await escuelaService.updatePerfil(formData);
      setTheme(formData.color_paleta as ThemeName);
    } catch (err) {
      console.error("Error al guardar perfil:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await escuelaService.uploadLogo(file);
      setFormData(prev => ({ ...prev, logo_url: res.logo_url }));
    } catch (err) {
      console.error("Error subiendo logo:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 pb-44">
      <ThemeBackground theme={formData.color_paleta || 'blue-ocean'} />

      {/* SECCIÓN: CABECERA */}
      <div className="flex flex-col items-center">
        <div className="relative group">
          <motion.div 
            whileTap={{ scale: 0.95 }}
            className="w-32 h-32 rounded-[2.5rem] bg-[var(--color-card)] shadow-2xl border-4 border-[var(--color-background)] overflow-hidden flex items-center justify-center transition-all"
          >
            {uploading ? (
              <Loader2 className="animate-spin text-[var(--color-primary)]" size={40} />
            ) : formData.logo_url ? (
              <img src={formData.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <School size={60} className="text-[var(--color-text-muted)] opacity-20" />
            )}
          </motion.div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 bg-[var(--color-primary)] text-white p-3 rounded-2xl shadow-xl border-4 border-[var(--color-background)] active:scale-90 transition-all hover:brightness-110 disabled:opacity-50"
          >
            <Camera size={20} />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>

        <div className="text-center mt-6">
          <h2 className="text-xl font-black italic uppercase tracking-tighter text-[var(--color-text)] leading-tight">
            {formData.nombreescuela || 'Institución'}
          </h2>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--color-text-muted)] mt-1 opacity-60">
            {formData.lema || 'Disciplina ante todo'}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* BLOQUE: IDENTIDAD */}
        <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-xl">
          <div className="flex items-center gap-2 mb-5 pb-2 border-b border-[var(--color-border)]/30">
            <Sparkles size={16} className="text-[var(--color-primary)]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Identidad Maestra</span>
          </div>
          <div className="space-y-4">
            <input
              name="nombreescuela"
              value={formData.nombreescuela || ''}
              onChange={handleChange}
              placeholder="Nombre Institucional"
              className="w-full h-12 px-5 rounded-2xl bg-[var(--color-background)]/50 border border-transparent focus:border-[var(--color-primary)] outline-none font-bold text-sm text-[var(--color-text)] transition-all"
            />
            <input
              name="lema"
              value={formData.lema || ''}
              onChange={handleChange}
              placeholder="Eslogan o Lema"
              className="w-full h-12 px-5 rounded-2xl bg-[var(--color-background)]/50 border border-transparent focus:border-[var(--color-primary)] outline-none font-bold italic text-sm text-[var(--color-text)] transition-all"
            />
          </div>
        </div>

        {/* BLOQUE: LOCALIZACIÓN (Lista Vertical) */}
        <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-xl">
          <div className="flex items-center gap-2 mb-5 pb-2 border-b border-[var(--color-border)]/30">
            <Globe size={16} className="text-[var(--color-primary)]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Localización y Contacto</span>
          </div>
          <div className="space-y-4">
            {/* Teléfono */}
            <div className="relative">
              <PhoneCall className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" size={16} />
              <input
                name="telefono_oficina"
                value={formData.telefono_oficina || ''}
                onChange={e => setFormData(p => ({ ...p, telefono_oficina: e.target.value.replace(/\D/g, '').slice(0,10) }))}
                placeholder="Teléfono (10 dígitos)"
                className="w-full h-12 pl-11 pr-4 rounded-2xl bg-[var(--color-background)]/50 border border-transparent focus:border-[var(--color-primary)] outline-none font-bold text-sm text-[var(--color-text)] transition-all"
              />
            </div>
            
            {/* Dirección */}
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" size={18} />
              <input
                name="direccion"
                value={formData.direccion || ''}
                onChange={handleChange}
                placeholder="Dirección Física Completa"
                className="w-full h-12 pl-12 pr-5 rounded-2xl bg-[var(--color-background)]/50 border border-transparent focus:border-[var(--color-primary)] outline-none font-bold text-xs text-[var(--color-text)] transition-all"
              />
            </div>

            {/* Correo */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" size={16} />
              <input
                name="correo_escuela"
                value={formData.correo_escuela || ''}
                onChange={handleChange}
                placeholder="E-mail Institucional"
                className="w-full h-12 pl-11 pr-4 rounded-2xl bg-[var(--color-background)]/50 border border-transparent focus:border-[var(--color-primary)] outline-none font-bold text-sm text-[var(--color-text)] transition-all"
              />
            </div>
          </div>
        </div>

        {/* BLOQUE: AMBIENTE VISUAL */}
        <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-xl">
          <div className="flex items-center gap-2 mb-5">
            <Palette size={16} className="text-[var(--color-primary)]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Ambiente Visual</span>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-7 gap-3 h-44 overflow-y-auto pr-2 custom-scrollbar">
            {LISTA_TEMAS.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setFormData(p => ({ ...p, color_paleta: t.id }));
                  setTheme(t.id as ThemeName);
                }}
                className={`aspect-square rounded-xl border-2 transition-all flex items-center justify-center relative ${
                  formData.color_paleta === t.id
                    ? 'border-[var(--color-text)] scale-110 shadow-lg ring-4 ring-[var(--color-primary)]/10'
                    : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                }`}
                style={{ backgroundColor: t.color }}
              >
                {/* ICONO CHECK PERFECTAMENTE CENTRADO */}
                {formData.color_paleta === t.id && (
                  <Check size={20} className="text-white drop-shadow-md" strokeWidth={4} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ACCIÓN PRINCIPAL: Integrada al flujo (no fija) */}
        <div className="pt-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={saving}
            className="w-full h-20 bg-[var(--color-text)] text-[var(--color-card)] font-black rounded-[2rem] shadow-2xl flex items-center justify-center gap-4 transition-all active:brightness-125 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={28} />
            ) : (
              <>
                <Save size={24} />
                <div className="flex flex-col items-start leading-none">
                  <span className="text-lg uppercase italic tracking-tighter">Sincronizar Dojo</span>
                  <span className="text-[8px] opacity-50 uppercase tracking-widest font-bold mt-1">Guardar cambios en Render</span>
                </div>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default PerfilConfiguracion;