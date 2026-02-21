import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Save, MapPin, Mail, School, Loader2, Phone, AlertCircle, RefreshCw, Sparkles, Palette } from 'lucide-react';
import { schoolService } from '../../services/escuela.service';
// USAMOS 'import type' para cumplir con verbatimModuleSyntax
import type { Escuela } from '../../types/escuela.types';

export const PerfilConfiguracion = () => {
  const [escuela, setEscuela] = useState<Escuela | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await schoolService.getMiEscuela();
      setEscuela(data);
    } catch (err: any) {
      console.error("Error al cargar escuela:", err);
      setError(
        err.response?.status === 404 
          ? "La ruta de la API no fue encontrada (404). Verifica los prefijos en FastAPI." 
          : "No se pudieron cargar los datos de la escuela."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleSave = async () => {
    if (!escuela) return;
    setSaving(true);
    try {
      await schoolService.updatePerfil({
        nombreescuela: escuela.nombreescuela,
        direccion: escuela.direccion,
        lema: escuela.lema,
        correo_escuela: escuela.correo_escuela,
        telefono_oficina: escuela.telefono_oficina,
        color_paleta: escuela.color_paleta
      });
    } catch (err) {
      console.error("Error al guardar:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await schoolService.uploadLogo(file);
      setEscuela(prev => prev ? { ...prev, logo_url: res.logo_url } : null);
    } catch (err) {
      console.error("Error al subir logo:", err);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="p-20 text-center flex flex-col items-center gap-4 bg-[var(--color-background)]">
      <Loader2 className="animate-spin text-[var(--color-primary)]" size={40} />
      <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Sincronizando perfil...</p>
    </div>
  );

  if (error) return (
    <div className="p-10 text-center animate-in zoom-in duration-300">
      <div className="bg-[var(--color-danger)]/10 p-8 rounded-[2.5rem] border border-[var(--color-danger)]/20 max-w-sm mx-auto">
        <AlertCircle className="text-[var(--color-danger)] mx-auto mb-4" size={48} />
        <h3 className="text-lg font-black text-[var(--color-danger)] uppercase italic">Error de Conexión</h3>
        <p className="text-sm text-[var(--color-text-muted)] mt-2 font-medium">{error}</p>
        <button 
          onClick={cargarDatos}
          className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-[var(--color-danger)] text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all"
        >
          <RefreshCw size={16} /> REINTENTAR
        </button>
      </div>
    </div>
  );

  if (!escuela) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      {/* Header de Perfil con Logo Dinámico */}
      <div className="text-center">
        <div className="relative inline-block">
          <div className="w-32 h-32 rounded-[2.5rem] bg-[var(--color-card)] shadow-2xl border-4 border-[var(--color-background)] overflow-hidden relative transition-colors">
            {uploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                <Loader2 className="animate-spin text-white" />
              </div>
            )}
            {escuela.logo_url ? (
              <img src={escuela.logo_url} className="w-full h-full object-cover" alt="Logo Escuela" />
            ) : (
              <School size={48} className="text-[var(--color-text-muted)] m-auto mt-8 opacity-30" />
            )}
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="absolute -bottom-2 -right-2 p-3 bg-[var(--color-primary)] text-white rounded-2xl shadow-lg border-2 border-[var(--color-background)] active:scale-90 transition-all"
          >
            <Camera size={18} />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*" />
        </div>
        <h2 className="mt-6 text-2xl font-black italic uppercase text-[var(--color-text)] tracking-tighter">{escuela.nombreescuela}</h2>
        <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.3em] mt-1 italic">{escuela.lema || 'Sin lema configurado'}</p>
      </div>

      {/* Formulario de Configuración Completo */}
      <div className="bg-[var(--color-card)] p-8 rounded-[3rem] shadow-xl space-y-6 border border-[var(--color-border)] transition-colors">
        <div className="space-y-4">
          
          {/* Nombre Comercial */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-[var(--color-text-muted)] ml-2 tracking-widest">Nombre Institucional</label>
            <input 
              value={escuela.nombreescuela} 
              onChange={e => setEscuela({...escuela, nombreescuela: e.target.value})}
              className="w-full p-4 bg-[var(--color-background)] rounded-2xl font-bold outline-none border border-transparent focus:border-[var(--color-primary)] text-[var(--color-text)] transition-all"
            />
          </div>

          {/* Lema de la Escuela */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-[var(--color-text-muted)] ml-2 tracking-widest">Lema o Eslogan</label>
            <div className="flex items-center gap-3 p-4 bg-[var(--color-background)] rounded-2xl border border-transparent focus-within:border-[var(--color-primary)] transition-all">
              <Sparkles size={18} className="text-amber-500" />
              <input 
                value={escuela.lema || ''} 
                onChange={e => setEscuela({...escuela, lema: e.target.value})}
                className="bg-transparent w-full outline-none font-bold text-sm text-[var(--color-text)]"
                placeholder="Ej: Disciplina y Honor"
              />
            </div>
          </div>

          {/* Dirección */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-[var(--color-text-muted)] ml-2 tracking-widest">Dirección Física</label>
            <div className="flex items-center gap-3 p-4 bg-[var(--color-background)] rounded-2xl border border-transparent focus-within:border-[var(--color-primary)] transition-all">
              <MapPin size={18} className="text-[var(--color-primary)]" />
              <input 
                value={escuela.direccion || ''} 
                onChange={e => setEscuela({...escuela, direccion: e.target.value})}
                className="bg-transparent w-full outline-none font-bold text-sm text-[var(--color-text)]"
                placeholder="Calle, Número, Colonia"
              />
            </div>
          </div>

          {/* Correo y Teléfono */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-[var(--color-text-muted)] ml-2 tracking-widest">E-Mail Oficial</label>
              <div className="flex items-center gap-3 p-4 bg-[var(--color-background)] rounded-2xl border border-transparent focus-within:border-[var(--color-primary)] transition-all">
                <Mail size={18} className="text-[var(--color-primary)]" />
                <input 
                  value={escuela.correo_escuela || ''} 
                  onChange={e => setEscuela({...escuela, correo_escuela: e.target.value})}
                  className="bg-transparent w-full outline-none font-bold text-sm text-[var(--color-text)]"
                  placeholder="ejemplo@escuela.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-[var(--color-text-muted)] ml-2 tracking-widest">Teléfono de Oficina</label>
              <div className="flex items-center gap-3 p-4 bg-[var(--color-background)] rounded-2xl border border-transparent focus-within:border-[var(--color-primary)] transition-all">
                <Phone size={18} className="text-[var(--color-primary)]" />
                <input 
                  value={escuela.telefono_oficina || ''} 
                  onChange={e => setEscuela({...escuela, telefono_oficina: e.target.value})}
                  className="bg-transparent w-full outline-none font-bold text-sm text-[var(--color-text)]"
                  placeholder="477 000 0000"
                />
              </div>
            </div>
          </div>

          {/* Selector de Identidad Visual de la Escuela (No confundir con el Tema de la App) */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-[var(--color-text-muted)] ml-2 tracking-widest">Paleta Institucional</label>
            <div className="flex gap-4 px-2">
              {[
                { id: 'red-dragon', class: 'bg-red-600' },
                { id: 'blue-ocean', class: 'bg-blue-600' },
                { id: 'dark-martial', class: 'bg-slate-900' },
                { id: 'forest-dojo', class: 'bg-emerald-600' }
              ].map(color => (
                <button
                  key={color.id}
                  onClick={() => setEscuela({...escuela, color_paleta: color.id})}
                  className={`w-10 h-10 rounded-full ${color.class} border-4 transition-all ${
                    escuela.color_paleta === color.id ? 'border-[var(--color-text)] ring-2 ring-[var(--color-primary)] scale-110 shadow-lg' : 'border-transparent opacity-40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave} disabled={saving}
          className="w-full h-18 bg-[var(--color-text)] text-[var(--color-card)] font-black rounded-3xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> GUARDAR CONFIGURACIÓN</>}
        </button>
      </div>
    </div>
  );
};