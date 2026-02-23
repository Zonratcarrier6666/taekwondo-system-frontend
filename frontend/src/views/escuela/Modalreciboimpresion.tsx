// ============================================================
//  src/components/ReciboImpresion.tsx
//  Recibo de pago profesional — imprimible con window.print()
// ============================================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Loader2 } from 'lucide-react';
import type { ReciboImpresion as ReciboData } from '../../types/finanzas.types';

interface Props {
  open: boolean;
  onClose: () => void;
  data: ReciboData | null;
}

// ── Genera el HTML completo del recibo en una ventana nueva ──
function imprimirRecibo(data: ReciboData) {
  const folio = String(data.metadata?.folio ?? '000000').padStart(6, '0');
  const esPagado = data.metadata?.status_texto === 'PAGADO';

  const desgloseHTML = data.pago?.desglose?.length
    ? data.pago.desglose.map(d => `
        <tr>
          <td style="padding:2px 0; color:#666; font-size:10px; text-transform:uppercase;">${d.metodo}</td>
          <td style="padding:2px 0; text-align:right; font-weight:700; font-size:10px;">
            $ ${Number(d.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </td>
        </tr>`).join('')
    : '';

  const logoHTML = data.escuela?.logo_url
    ? `<img src="${data.escuela.logo_url}" style="height:52px;width:auto;object-fit:contain;display:block;margin-bottom:6px;" />`
    : `<div style="width:52px;height:52px;border:2px solid #000;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;text-transform:uppercase;text-align:center;margin-bottom:6px;">LOGO</div>`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Recibo de Pago — Folio ${folio}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier Prime', 'Courier New', monospace;
      background: #fff;
      color: #000;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 24px;
    }
    .sheet {
      width: 400px;
      border: 2px solid #111;
    }
    /* CABECERA */
    .header { display: flex; border-bottom: 2px solid #111; }
    .header-left { flex: 1; padding: 14px; border-right: 2px solid #111; }
    .header-right { width: 140px; display: flex; flex-direction: column; }
    .badge {
      background: #111; color: #fff;
      text-align: center; padding: 8px 6px;
      font-size: 9px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.08em;
    }
    .folio-box {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 10px 6px; border-bottom: 1px dashed #bbb;
    }
    .folio-label { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 0.1em; }
    .folio-num { font-size: 18px; font-weight: 700; letter-spacing: -0.02em; margin-top: 2px; }
    .status-box {
      padding: 7px; text-align: center;
      background: ${esPagado ? '#111' : '#eee'};
      color: ${esPagado ? '#fff' : '#555'};
      font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;
    }
    .escuela-nombre { font-size: 13px; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; }
    .escuela-sub { font-size: 10px; color: #555; line-height: 1.4; }
    /* CUERPO */
    .body { padding: 14px; border-bottom: 2px solid #111; }
    .field { display: flex; align-items: baseline; gap: 8px; margin-bottom: 9px; }
    .field:last-child { margin-bottom: 0; }
    .field-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; width: 100px; flex-shrink: 0; }
    .field-value {
      flex: 1; border-bottom: 1px dotted #aaa;
      font-size: 11px; font-weight: 700; padding-bottom: 2px;
      text-transform: uppercase;
    }
    /* DESGLOSE */
    .desglose { padding: 10px 14px; border-bottom: 2px solid #111; }
    .desglose-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin-bottom: 6px; }
    .desglose table { width: 100%; border-collapse: collapse; }
    /* TOTAL */
    .total { padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111; }
    .total-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #666; }
    .total-num { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    /* PIE */
    .footer { padding: 12px 14px; display: flex; justify-content: space-between; align-items: flex-end; }
    .firma-line { width: 90px; border-bottom: 1px solid #111; margin-bottom: 4px; }
    .firma-label { font-size: 8px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; }
    .footer-note { text-align: right; font-size: 8px; color: #aaa; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.5; max-width: 110px; }
    /* TIRA */
    .tira {
      border-top: 2px dashed #bbb; padding: 6px 14px;
      background: #f9f9f9; display: flex; justify-content: space-between;
      font-size: 8px; text-transform: uppercase; letter-spacing: 0.08em; color: #aaa;
    }
    @media print {
      body { padding: 0; }
      .sheet { width: 100%; border: 2px solid #111; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <!-- CABECERA -->
    <div class="header">
      <div class="header-left">
        ${logoHTML}
        <div class="escuela-nombre">${data.escuela?.nombre ?? 'Dojo'}</div>
        ${data.escuela?.direccion ? `<div class="escuela-sub">${data.escuela.direccion}</div>` : ''}
        ${data.escuela?.telefono ? `<div class="escuela-sub">Tel. ${data.escuela.telefono}</div>` : ''}
      </div>
      <div class="header-right">
        <div class="badge">${data.pago?.tipo_label ?? 'Recibo de Pago'}</div>
        <div class="folio-box">
          ${data.escuela?.rfc ? `<div class="folio-label">RFC: ${data.escuela.rfc}</div>` : ''}
          <div class="folio-label" style="margin-top:4px;">Folio</div>
          <div class="folio-num">N° ${folio}</div>
        </div>
        <div class="status-box">${data.metadata?.status_texto ?? 'PENDIENTE'}</div>
      </div>
    </div>

    <!-- CUERPO -->
    <div class="body">
      <div class="field">
        <span class="field-label">Fecha de emisión:</span>
        <span class="field-value">${data.metadata?.fecha_impresion ?? new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
      </div>
      <div class="field">
        <span class="field-label">Recibí de:</span>
        <span class="field-value">${data.alumno?.nombre_completo ?? ''}</span>
      </div>
      <div class="field">
        <span class="field-label">ID Sistema:</span>
        <span class="field-value">#${data.alumno?.id_interno ?? ''}</span>
      </div>
      ${data.pago?.monto_texto ? `
      <div class="field">
        <span class="field-label">La suma de:</span>
        <span class="field-value">${data.pago.monto_texto}</span>
      </div>` : ''}
      <div class="field">
        <span class="field-label">Por concepto de:</span>
        <span class="field-value">${data.pago?.concepto ?? ''}</span>
      </div>
    </div>

    <!-- DESGLOSE MÉTODOS -->
    ${desgloseHTML ? `
    <div class="desglose">
      <div class="desglose-title">Forma de Pago</div>
      <table>${desgloseHTML}</table>
    </div>` : ''}

    <!-- TOTAL -->
    <div class="total">
      <span class="total-label">Total recibido</span>
      <span class="total-num">$ ${Number(data.pago?.monto ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
    </div>

    <!-- PIE -->
    <div class="footer">
      <div>
        <div class="firma-line"></div>
        <div class="firma-label">Firma / Sello</div>
      </div>
      <div class="footer-note">
        Documento válido como comprobante de pago<br/>
        ${new Date().toLocaleDateString('es-MX')}
      </div>
    </div>

    <!-- TIRA PERFORADA -->
    <div class="tira">
      <span>Folio: ${folio}</span>
      <span>✂ ─ ─ ─ ─ ─ ─</span>
      <span>${data.metadata?.status_texto ?? 'PENDIENTE'}</span>
    </div>
  </div>

  <script>
    window.onload = () => { window.print(); }
  </script>
</body>
</html>`;

  const ventana = window.open('', '_blank', 'width=520,height=700');
  if (ventana) {
    ventana.document.write(html);
    ventana.document.close();
  }
}

export const ModalReciboImpresion: React.FC<Props> = ({ open, onClose, data }) => {
  if (!open) return null;

  return (
    <>
      {/* ── Estilos de impresión: oculta todo excepto el recibo ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Special+Elite&display=swap');

        @media print {
          body > *:not(#recibo-print-root) { display: none !important; }
          #recibo-print-root { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: white; }
          .no-print { display: none !important; }
          .recibo-sheet {
            box-shadow: none !important;
            border: 2px solid #000 !important;
            width: 148mm !important;
            max-height: none !important;
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
          className="relative z-10 flex flex-col items-center gap-4 w-full max-w-sm"
        >
          {/* Botones de acción */}
          <div className="no-print flex gap-3 w-full">
            <button
              onClick={() => data && imprimirRecibo(data)}
              className="flex-1 h-11 bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-all shadow-lg"
            >
              <Printer size={16} /> Imprimir
            </button>
            <button
              onClick={onClose}
              className="h-11 w-11 bg-white/10 text-white rounded-2xl flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── HOJA DEL RECIBO ── */}
          <div
            className="recibo-sheet w-full bg-white text-black overflow-hidden shadow-2xl"
            style={{
              fontFamily: "'Courier Prime', 'Courier New', monospace",
              border: '2px solid #1a1a1a',
              borderRadius: '4px',
            }}
          >
            {!data ? (
              <div className="py-20 flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-gray-400" size={32} />
                <p style={{ fontFamily: "'Courier Prime', monospace" }} className="text-xs text-gray-400 uppercase tracking-widest">
                  Generando recibo...
                </p>
              </div>
            ) : (
              <>
                {/* ── CABECERA ── */}
                <div className="flex items-stretch border-b-2 border-black">
                  {/* Logo / Nombre escuela */}
                  <div className="flex-1 p-4 flex flex-col items-start justify-center gap-2 border-r-2 border-black">
                    {data.escuela?.logo_url ? (
                      <img
                        src={data.escuela.logo_url}
                        alt="Logo"
                        className="h-14 w-auto object-contain"
                      />
                    ) : (
                      <div className="w-14 h-14 border-2 border-black flex items-center justify-center text-[8px] font-bold uppercase tracking-widest text-center leading-tight px-1">
                        LOGO
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-sm uppercase leading-tight" style={{ fontFamily: "'Special Elite', serif" }}>
                        {data.escuela?.nombre ?? 'Dragon Negro Dojo'}
                      </p>
                      {data.escuela?.direccion && (
                        <p className="text-[10px] text-gray-600 mt-0.5">{data.escuela.direccion}</p>
                      )}
                      {data.escuela?.telefono && (
                        <p className="text-[10px] text-gray-600">Tel. {data.escuela.telefono}</p>
                      )}
                    </div>
                  </div>

                  {/* Recuadro tipo "RECIBO POR HONORARIOS" */}
                  <div className="w-36 flex flex-col">
                    {/* Badge de tipo */}
                    <div className="bg-black text-white text-center py-2 px-2">
                      <p className="text-[9px] font-black uppercase tracking-wider leading-tight">
                        {data.pago?.tipo_label ?? 'RECIBO DE PAGO'}
                      </p>
                    </div>
                    {/* Folio */}
                    <div className="flex-1 flex flex-col items-center justify-center border-b border-dashed border-gray-400 px-2 py-3">
                      {data.escuela?.rfc && (
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-700">
                          RFC: {data.escuela.rfc}
                        </p>
                      )}
                      <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-wide">Folio</p>
                      <p className="text-lg font-black tracking-tight leading-none mt-0.5">
                        N° {String(data.metadata?.folio ?? '000000').padStart(6, '0')}
                      </p>
                    </div>
                    {/* Estatus */}
                    <div className={`py-2 text-center ${data.metadata?.status_texto === 'PAGADO' ? 'bg-black' : 'bg-gray-200'}`}>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${data.metadata?.status_texto === 'PAGADO' ? 'text-white' : 'text-gray-700'}`}>
                        {data.metadata?.status_texto ?? 'PENDIENTE'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── CUERPO ── */}
                <div className="p-4 space-y-3 border-b-2 border-black">
                  {/* Fecha */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 w-28 flex-shrink-0">Fecha de emisión:</span>
                    <span className="flex-1 border-b border-dotted border-gray-400 text-xs font-bold pb-0.5">
                      {data.metadata?.fecha_impresion ?? new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Alumno */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 w-28 flex-shrink-0">Recibí de:</span>
                    <span className="flex-1 border-b border-dotted border-gray-400 text-xs font-bold pb-0.5 uppercase">
                      {data.alumno?.nombre_completo}
                    </span>
                  </div>

                  {/* ID interno */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 w-28 flex-shrink-0">ID Sistema:</span>
                    <span className="flex-1 border-b border-dotted border-gray-400 text-xs font-bold pb-0.5">
                      #{data.alumno?.id_interno}
                    </span>
                  </div>

                  {/* Monto en texto */}
                  {data.pago?.monto_texto && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] uppercase tracking-widest text-gray-500 w-28 flex-shrink-0">La suma de:</span>
                      <span className="flex-1 border-b border-dotted border-gray-400 text-xs font-bold pb-0.5 uppercase">
                        {data.pago.monto_texto}
                      </span>
                    </div>
                  )}

                  {/* Concepto */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 w-28 flex-shrink-0">Por concepto de:</span>
                    <span className="flex-1 border-b border-dotted border-gray-400 text-xs font-bold pb-0.5">
                      {data.pago?.concepto}
                    </span>
                  </div>
                </div>

                {/* ── DESGLOSE DE MÉTODOS ── */}
                {data.pago?.desglose && data.pago.desglose.length > 0 && (
                  <div className="px-4 py-3 border-b-2 border-black space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Forma de Pago</p>
                    {data.pago.desglose.map((d, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-gray-600 uppercase tracking-wide">{d.metodo}</span>
                        <span className="font-bold">$ {Number(d.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── TOTAL ── */}
                <div className="px-4 py-3 flex justify-between items-center border-b-2 border-black">
                  <span className="text-[10px] uppercase tracking-widest text-gray-600">Total recibido</span>
                  <span className="text-xl font-black tracking-tight">
                    $ {Number(data.pago?.monto ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* ── PIE ── */}
                <div className="px-4 py-4 flex justify-between items-end">
                  {/* Firma */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-24 border-b border-black" />
                    <p className="text-[9px] uppercase tracking-widest text-gray-500">Firma / Sello</p>
                  </div>

                  {/* Nota de validez */}
                  <div className="text-right">
                    <p className="text-[8px] text-gray-400 uppercase tracking-widest leading-tight max-w-[100px]">
                      Documento válido como comprobante de pago
                    </p>
                    <p className="text-[8px] font-bold text-gray-500 mt-1">
                      {new Date().toLocaleDateString('es-MX')}
                    </p>
                  </div>
                </div>

                {/* ── TIRA PERFORADA ── */}
                <div
                  className="border-t-2 border-dashed border-gray-400 px-4 py-2 bg-gray-50 flex justify-between items-center"
                  style={{ fontSize: '9px' }}
                >
                  <span className="uppercase tracking-widest text-gray-400">Folio: {data.metadata?.folio}</span>
                  <span className="text-gray-400">✂ ─ ─ ─ ─ ─ ─ ─ ─ ─</span>
                  <span className="uppercase tracking-widest text-gray-400">{data.metadata?.status_texto}</span>
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