// ============================================================
//  src/components/ModalReciboImpresion.tsx
//  Recibo profesional horizontal — colores del tema de la escuela
//  Folio ofuscado seguro · window.print() con ventana dedicada
// ============================================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Loader2 } from 'lucide-react';
import type { ReciboImpresion as ReciboData } from '../../types/finanzas.types';

interface Props {
  open:    boolean;
  onClose: () => void;
  data:    ReciboData | null;
}

// ── Folio seguro: XOR + base36, no expone el idpago real ──────────────────────
function generarFolio(idpago: number | string): string {
  const n = typeof idpago === 'string' ? parseInt(idpago, 10) : idpago;
  if (isNaN(n)) return 'TKW-000000';
  const SAL = 0x4B3A2C1D;
  const ofuscado = (n ^ SAL) >>> 0;
  return 'TKW-' + ofuscado.toString(36).toUpperCase().padStart(6, '0').slice(-6);
}

// ── Leer CSS variables del tema activo ────────────────────────────────────────
function getThemeColor(variable: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const val = getComputedStyle(document.documentElement)
    .getPropertyValue(variable).trim();
  return val || fallback;
}

// ── Imprime usando iframe oculto — evita bloqueo de popups del navegador ───────
function imprimirConIframe(html: string) {
  const old = document.getElementById('__recibo_iframe__');
  if (old) old.remove();

  const iframe = document.createElement('iframe');
  iframe.id = '__recibo_iframe__';
  iframe.style.cssText =
    'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;visibility:hidden;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(html);
  doc.close();

  // Dar tiempo a fuentes e imágenes antes de lanzar print()
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 500);
  };
}

// ── Genera HTML e imprime 2 recibos por hoja ──────────────────────────────────
function imprimirRecibo(data: ReciboData, accent: string, escuelaNombre = 'Dojo') {
  const rawFolio = data.metadata?.folio ?? data.idpago ?? '0';
  const folio    = generarFolio(typeof rawFolio === 'number' ? rawFolio : parseInt(String(rawFolio), 10));
  const esPagado = data.metadata?.status_texto === 'PAGADO';

  const logoHTML = data.escuela?.logo_url
    ? `<img src="${data.escuela.logo_url}"
         style="height:40px;width:auto;object-fit:contain;display:block;
                border:2px solid ${accent};border-radius:5px;padding:2px;"/>`
    : `<div style="width:40px;height:40px;border:2px solid ${accent};border-radius:5px;
                   display:flex;align-items:center;justify-content:center;
                   font-size:7px;font-weight:900;text-transform:uppercase;
                   color:${accent};text-align:center;">LOGO</div>`;

  const desgloseHTML = (data.pago?.desglose ?? []).map(d => `
    <tr>
      <td style="padding:2px 0;color:#666;font-size:9px;text-transform:uppercase;letter-spacing:.04em;">${d.metodo}</td>
      <td style="padding:2px 0;text-align:right;font-weight:700;font-size:9px;">
        $\u00a0${Number(d.monto).toLocaleString('es-MX',{minimumFractionDigits:2})}
      </td>
    </tr>`).join('');

  const recargo    = (data.pago as any)?.recargo ?? 0;
  const montoBase  = Number(data.pago?.monto ?? 0) - recargo;
  const totalFinal = Number(data.pago?.monto ?? 0);
  const fechaStr   = data.metadata?.fecha_impresion
    ?? new Date().toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'});

  const recargoHTML = recargo > 0 ? `
    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
      <span style="font-size:8px;color:#888;">Base</span>
      <span style="font-size:9px;font-weight:700;">$\u00a0${montoBase.toLocaleString('es-MX',{minimumFractionDigits:2})}</span>
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:6px;padding-bottom:5px;border-bottom:1px solid #eee;">
      <span style="font-size:8px;color:#c0392b;">Recargo</span>
      <span style="font-size:9px;font-weight:700;color:#c0392b;">+$\u00a0${recargo.toLocaleString('es-MX',{minimumFractionDigits:2})}</span>
    </div>` : '';

  // ── Bloque reutilizable para cada copia ──────────────────────────────────────
  const bloqueRecibo = (etiqueta: string) => `
  <div class="recibo">
    <div class="top-band">
      <div style="display:flex;align-items:center;gap:10px;">
        ${logoHTML}
        <div>
          <div class="dojo-name">${data.escuela?.nombre ?? 'Dragon Negro Dojo'}</div>
          <div class="dojo-sub">${[data.escuela?.direccion, data.escuela?.telefono ? `Tel.\u00a0${data.escuela.telefono}` : ''].filter(Boolean).join('\u00a0·\u00a0')}</div>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:7px;color:#777;letter-spacing:.1em;text-transform:uppercase;">Comprobante de Pago</div>
        <div style="font-size:15px;font-weight:900;color:#fff;margin:2px 0;">${folio}</div>
        <span style="display:inline-block;font-size:7px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;padding:2px 8px;border-radius:3px;background:${esPagado ? '#059669' : accent};color:#fff;">${data.metadata?.status_texto ?? 'PENDIENTE'}</span>
        <div style="font-size:7px;color:#555;margin-top:3px;text-transform:uppercase;letter-spacing:.06em;">${etiqueta}</div>
      </div>
    </div>

    <div class="body">
      <div class="col-left">
        <div class="sec-label">Datos del Alumno</div>
        <div class="field"><span class="fl">Alumno</span><span class="fv">${data.alumno?.nombre_completo ?? '—'}</span></div>
        <div class="field"><span class="fl">Concepto</span><span class="fv">${data.pago?.concepto ?? '—'}</span></div>
        <div class="field"><span class="fl">Fecha</span><span class="fv">${fechaStr}</span></div>
        ${data.pago?.monto_texto ? `<div class="field"><span class="fl">En letra</span><span class="fv" style="font-style:italic;font-size:8px;">${data.pago.monto_texto}</span></div>` : ''}
        ${(data.pago?.desglose ?? []).length > 0 ? `
        <div style="margin-top:8px;padding-top:6px;border-top:1px solid #eee;">
          <div class="sec-label">Forma de Pago</div>
          <table style="width:100%;border-collapse:collapse;">${desgloseHTML}</table>
        </div>` : ''}
      </div>

      <div class="col-right">
        <div class="sec-label">Resumen</div>
        ${recargoHTML}
        <hr style="border:none;border-top:2px solid #111;margin:5px 0;"/>
        <div class="sec-label">Total</div>
        <div style="font-size:22px;font-weight:900;color:${accent};letter-spacing:-.02em;line-height:1;">
          $\u00a0${totalFinal.toLocaleString('es-MX',{minimumFractionDigits:2})}
        </div>
        <div style="margin-top:6px;font-size:7px;color:#aaa;">Recibido por: ${escuelaNombre}</div>
      </div>
    </div>

    <div class="footer">
      <div>
        <div style="width:100px;border-bottom:1px solid #111;margin-bottom:3px;"></div>
        <div style="font-size:7px;color:#aaa;text-transform:uppercase;letter-spacing:.1em;">Firma / Sello</div>
      </div>
      <div style="text-align:right;font-size:7px;color:#bbb;text-transform:uppercase;letter-spacing:.04em;line-height:1.6;">
        Documento válido como comprobante de pago<br/>
        ${new Date().toLocaleDateString('es-MX')}
      </div>
    </div>

    <div class="tira">
      <span style="color:${accent};font-weight:900;">${folio}</span>
      <span>✂\u00a0─\u00a0─\u00a0─\u00a0─\u00a0─</span>
      <span>${data.alumno?.nombre_completo ?? ''}\u00a0·\u00a0$${totalFinal.toLocaleString('es-MX',{minimumFractionDigits:2})}</span>
    </div>
  </div>`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Recibo ${folio}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    html,body{width:100%;height:100%;}
    body{
      font-family:'Inter',Arial,sans-serif;
      background:#e8e8e8;
      display:flex;
      flex-direction:column;
      align-items:center;
      padding:16px;
      gap:0;
    }
    .page{
      width:190mm;
      background:#fff;
      overflow:hidden;
    }
    .recibo{width:100%;}
    .top-band{background:#111;padding:11px 15px;display:flex;align-items:center;justify-content:space-between;}
    .dojo-name{font-size:11px;font-weight:900;color:#fff;letter-spacing:.04em;text-transform:uppercase;margin-bottom:2px;}
    .dojo-sub{font-size:7.5px;color:#888;}
    .body{display:flex;border-bottom:1px solid #e8e8e8;}
    .col-left{flex:1;padding:11px 15px;border-right:1px solid #e8e8e8;}
    .col-right{width:150px;padding:11px 13px;background:#f9f9f9;display:flex;flex-direction:column;justify-content:center;}
    .sec-label{font-size:6.5px;font-weight:900;color:#aaa;text-transform:uppercase;letter-spacing:.14em;margin-bottom:7px;}
    .field{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px;gap:8px;}
    .fl{font-size:7px;color:#999;text-transform:uppercase;letter-spacing:.05em;flex-shrink:0;}
    .fv{font-size:9px;font-weight:700;color:#111;text-align:right;max-width:60%;}
    .footer{padding:9px 15px;display:flex;justify-content:space-between;align-items:flex-end;}
    .tira{border-top:2px dashed #ddd;padding:5px 15px;background:#f7f7f7;display:flex;justify-content:space-between;align-items:center;font-size:7.5px;text-transform:uppercase;letter-spacing:.07em;color:#bbb;}

    /* Línea de corte */
    .corte{
      display:flex;align-items:center;gap:8px;padding:5px 15px;
      background:#efefef;border-top:2px dashed #bbb;border-bottom:2px dashed #bbb;
      font-size:7.5px;font-weight:900;color:#aaa;text-transform:uppercase;letter-spacing:.14em;
    }
    .corte-line{flex:1;border-top:1px dashed #ccc;}

    @media print{
      html,body{background:#fff;padding:0;margin:0;}
      .page{width:100%;box-shadow:none;}
      @page{size:A4 portrait;margin:8mm 10mm;}
    }
  </style>
</head>
<body>
<div class="page">
  ${bloqueRecibo('Copia Escuela')}
  <div class="corte">
    <div class="corte-line"></div>
    <span>✂&nbsp;&nbsp;Cortar aquí</span>
    <div class="corte-line"></div>
  </div>
  ${bloqueRecibo('Copia Alumno')}
</div>
</body>
</html>`;

  imprimirConIframe(html);
}

// ── Componente React ───────────────────────────────────────────────────────────
export const ModalReciboImpresion: React.FC<Props> = ({ open, onClose, data }) => {
  if (!open) return null;

  // Leer color del tema en tiempo de render
  const accent = getThemeColor('--color-primary', '#1A3A6C');

  const rawFolio   = data?.metadata?.folio ?? (data as any)?.idpago ?? '0';
  const folio      = data ? generarFolio(typeof rawFolio === 'number' ? rawFolio : parseInt(String(rawFolio), 10)) : '—';
  const esPagado   = data?.metadata?.status_texto === 'PAGADO';
  const totalFinal = Number(data?.pago?.monto ?? 0);
  const recargo    = (data?.pago as any)?.recargo ?? 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
        @media print {
          body > *:not(#recibo-print-root) { display: none !important; }
          #recibo-print-root {
            position: fixed; inset: 0;
            display: flex; align-items: center; justify-content: center;
            background: white;
          }
          .no-print { display: none !important; }
          .recibo-sheet {
            box-shadow: none !important;
            border: 1.5px solid #ddd !important;
            width: 148mm !important;
            border-radius: 4px !important;
          }
        }
      `}</style>

      <div id="recibo-print-root" className="fixed inset-0 z-[130] flex items-center justify-center p-4">

        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-sm no-print"
          onClick={onClose}
        />

        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="relative z-10 flex flex-col items-center gap-3 w-full max-w-md"
        >
          {/* Botones */}
          <div className="no-print flex gap-3 w-full">
            <button
              onClick={() => data && imprimirRecibo(data, accent, data.escuela?.nombre ?? 'Dojo')}
              className="flex-1 h-11 text-white font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all hover:brightness-110 shadow-lg"
              style={{ background: accent, boxShadow: `0 4px 16px -4px ${accent}60` }}
            >
              <Printer size={15} /> Imprimir
            </button>
            <button
              onClick={onClose}
              className="h-11 w-11 rounded-2xl flex items-center justify-center border border-white/20 text-white hover:bg-white/20 transition-all"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              <X size={17} />
            </button>
          </div>

          {/* ── HOJA DEL RECIBO ── */}
          <div
            className="recibo-sheet w-full bg-white text-black overflow-hidden shadow-2xl"
            style={{ fontFamily: "'Inter', Arial, sans-serif", border: '1.5px solid #ddd', borderRadius: 8 }}
          >
            {!data ? (
              <div className="py-20 flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-gray-300" size={32} />
                <p className="text-xs text-gray-400 uppercase tracking-widest">Generando recibo...</p>
              </div>
            ) : (
              <>
                {/* ── BANDA SUPERIOR ── */}
                <div className="flex items-center justify-between px-5 py-3"
                  style={{ background: '#111' }}>
                  <div className="flex items-center gap-3">
                    {data.escuela?.logo_url ? (
                      <img src={data.escuela.logo_url} alt="Logo"
                        className="h-10 w-auto object-contain rounded-md"
                        style={{ border: `2px solid ${accent}`, padding: 2 }}
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-md flex items-center justify-center text-[7px] font-black uppercase"
                        style={{ border: `2px solid ${accent}`, color: accent, background: '#222' }}>
                        LOGO
                      </div>
                    )}
                    <div>
                      <p className="text-[12px] font-black uppercase tracking-wide text-white leading-tight">
                        {data.escuela?.nombre ?? 'Dragon Negro Dojo'}
                      </p>
                      <p className="text-[9px] mt-0.5" style={{ color: '#888' }}>
                        {[data.escuela?.direccion, data.escuela?.telefono ? `Tel. ${data.escuela.telefono}` : ''].filter(Boolean).join('  ·  ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: '#666' }}>Comprobante de Pago</p>
                    <p className="text-[16px] font-black tracking-tight text-white mt-0.5">{folio}</p>
                    <span className="text-[7px] font-black uppercase px-2 py-0.5 rounded mt-1 inline-block"
                      style={{ background: esPagado ? '#059669' : accent, color: '#fff', letterSpacing: '0.1em' }}>
                      {data.metadata?.status_texto ?? 'PENDIENTE'}
                    </span>
                  </div>
                </div>

                {/* ── CUERPO 2 COLUMNAS ── */}
                <div className="flex" style={{ borderBottom: '1px solid #e8e8e8' }}>

                  {/* Columna izquierda — datos */}
                  <div className="flex-1 p-4" style={{ borderRight: '1px solid #e8e8e8' }}>
                    <p className="text-[7px] font-black uppercase tracking-widest mb-3" style={{ color: '#bbb' }}>
                      Datos del Alumno
                    </p>
                    {[
                      { label: 'Alumno',   value: data.alumno?.nombre_completo ?? '—' },
                      { label: 'Concepto', value: data.pago?.concepto ?? '—' },
                      { label: 'Fecha',    value: data.metadata?.fecha_impresion ?? new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }) },
                      ...(data.pago?.monto_texto ? [{ label: 'En letra', value: data.pago.monto_texto }] : []),
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-baseline gap-2 mb-2">
                        <span className="text-[8px] font-bold uppercase tracking-wide flex-shrink-0" style={{ color: '#aaa' }}>{label}:</span>
                        <span className="text-[9px] font-bold text-right" style={{ color: '#111', maxWidth: '58%' }}>{value}</span>
                      </div>
                    ))}

                    {/* Desglose métodos */}
                    {data.pago?.desglose && data.pago.desglose.length > 0 && (
                      <div className="mt-3 pt-3" style={{ borderTop: '1px solid #eee' }}>
                        <p className="text-[7px] font-black uppercase tracking-widest mb-2" style={{ color: '#bbb' }}>Forma de Pago</p>
                        {data.pago.desglose.map((d, i) => (
                          <div key={i} className="flex justify-between text-[9px] mb-1">
                            <span className="uppercase tracking-wide" style={{ color: '#888' }}>{d.metodo}</span>
                            <span className="font-bold" style={{ color: '#111' }}>
                              $ {Number(d.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Columna derecha — total */}
                  <div className="flex flex-col justify-center p-4" style={{ width: 155, background: '#f9f9f9' }}>
                    <p className="text-[7px] font-black uppercase tracking-widest mb-3" style={{ color: '#bbb' }}>Resumen</p>

                    {recargo > 0 && (
                      <>
                        <div className="flex justify-between mb-1.5">
                          <span className="text-[8px]" style={{ color: '#888' }}>Base</span>
                          <span className="text-[9px] font-bold" style={{ color: '#333' }}>
                            ${(totalFinal - recargo).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between mb-3 pb-2" style={{ borderBottom: '1px solid #eee' }}>
                          <span className="text-[8px]" style={{ color: '#c0392b' }}>Recargo</span>
                          <span className="text-[9px] font-bold" style={{ color: '#c0392b' }}>
                            +${recargo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </>
                    )}

                    <div style={{ borderTop: '2px solid #111', paddingTop: 8 }}>
                      <p className="text-[7px] font-black uppercase tracking-widest mb-1" style={{ color: '#aaa' }}>Total</p>
                      <p className="text-[24px] font-black leading-none" style={{ color: accent, letterSpacing: '-0.02em' }}>
                        ${totalFinal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── PIE ── */}
                <div className="flex items-end justify-between px-4 py-3">
                  <div>
                    <div className="mb-1" style={{ width: 110, borderBottom: '1px solid #111' }} />
                    <p className="text-[8px] uppercase tracking-widest" style={{ color: '#aaa' }}>Firma / Sello</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[7px] uppercase tracking-widest leading-relaxed" style={{ color: '#bbb', maxWidth: 120 }}>
                      Documento válido como comprobante de pago
                    </p>
                    <p className="text-[8px] font-bold mt-0.5" style={{ color: '#999' }}>
                      {new Date().toLocaleDateString('es-MX')}
                    </p>
                  </div>
                </div>

                {/* ── TALÓN DESPRENDIBLE ── */}
                <div className="flex items-center justify-between px-4 py-1.5"
                  style={{ borderTop: '2px dashed #ddd', background: '#f7f7f7', fontSize: 8 }}>
                  <span className="font-black uppercase tracking-widest" style={{ color: accent }}>
                    {folio}
                  </span>
                  <span style={{ color: '#ccc' }}>✂ ─ ─ ─ ─ ─</span>
                  <span className="uppercase tracking-wide" style={{ color: '#bbb' }}>
                    {data.alumno?.nombre_completo ?? ''}
                    {' · '}
                    ${totalFinal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default ModalReciboImpresion;