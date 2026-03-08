// ============================================================
//  src/components/LinkInscripcion.tsx
//  Bloque para mostrar y copiar el link público de inscripción
//  Se usa dentro de PerfilConfiguracion o donde se quiera
// ============================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Copy, CheckCheck, QrCode, ExternalLink, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; // ajusta el path

// ─── Helpers ─────────────────────────────────────────────────
function slugify(nombre: string): string {
  return nombre
    .toLowerCase().trim()
    .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e')
    .replace(/[íìï]/g,'i').replace(/[óòö]/g,'o')
    .replace(/[úùü]/g,'u').replace(/[ñ]/g,'n')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}

// ─── Componente ───────────────────────────────────────────────
interface LinkInscripcionProps {
  nombreEscuela: string;
}

export const LinkInscripcion: React.FC<LinkInscripcionProps> = ({ nombreEscuela }) => {
  const [copiado, setCopiado] = useState(false);
  const [mostrarQR, setMostrarQR] = useState(false);

  const slug = slugify(nombreEscuela);
  const url  = `${window.location.origin}/registro/${slug}`;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  const abrirLink = () => window.open(url, '_blank');

  return (
    <div className="bg-[var(--color-card)]/80 backdrop-blur-xl rounded-[2rem] border border-[var(--color-border)] shadow-xl p-5 space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <Users size={18} className="text-blue-500"/>
        </div>
        <div>
          <h3 className="text-sm font-black text-[var(--color-text)]">Link de Inscripción</h3>
          <p className="text-[10px] text-[var(--color-text-muted)]">Comparte este link para que los alumnos se registren</p>
        </div>
      </div>

      {/* URL display */}
      <div className="flex items-center gap-2 p-3 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)]">
        <Link2 size={13} className="text-[var(--color-primary)] shrink-0"/>
        <span className="text-[11px] text-[var(--color-text)] font-mono truncate flex-1">{url}</span>
      </div>

      {/* Botones */}
      <div className="flex gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={copiar}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[var(--color-border)] text-[11px] font-bold transition-all"
          style={{
            background: copiado ? 'rgba(34,197,94,0.1)' : 'var(--color-background)',
            color: copiado ? '#22c55e' : 'var(--color-text)',
            borderColor: copiado ? '#22c55e44' : undefined,
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {copiado
              ? <motion.span key="check" initial={{scale:0}} animate={{scale:1}} className="flex items-center gap-1.5"><CheckCheck size={13}/> ¡Copiado!</motion.span>
              : <motion.span key="copy"  initial={{scale:0}} animate={{scale:1}} className="flex items-center gap-1.5"><Copy size={13}/> Copiar link</motion.span>
            }
          </AnimatePresence>
        </motion.button>

        <button
          onClick={abrirLink}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)] text-[11px] font-bold transition-all hover:bg-[var(--color-primary)]/20"
        >
          <ExternalLink size={13}/> Ver
        </button>

        <button
          onClick={() => setMostrarQR(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-[11px] font-bold transition-all ${mostrarQR ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' : 'bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-muted)]'}`}
        >
          <QrCode size={13}/> QR
        </button>
      </div>

      {/* QR Code — usa Google Charts API (sin instalación) */}
      <AnimatePresence>
        {mostrarQR && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col items-center gap-3 pt-2">
              <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}&margin=4`}
                  alt="QR Inscripción"
                  className="w-[160px] h-[160px]"
                />
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)] text-center">
                Imprime este QR y pégalo en el dojo para que los alumnos se registren fácilmente
              </p>
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}&margin=10`;
                  a.download = `qr-inscripcion-${slug}.png`;
                  a.click();
                }}
                className="text-[10px] font-bold text-[var(--color-primary)] flex items-center gap-1"
              >
                Descargar QR
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nota */}
      <p className="text-[9px] text-[var(--color-text-muted)] leading-relaxed">
        Este link es permanente y único para tu escuela. Los alumnos que lo llenen quedan registrados automáticamente en tu lista.
      </p>
    </div>
  );
};