import React, { useState, useEffect } from 'react';
import { DollarSign, Loader2 } from 'lucide-react';
import axios from 'axios';

// --- DEFINICIONES LOCALES PARA EL CANVAS ---
interface Pago {
  idpago: number;
  idalumno: number;
  monto: string;
  concepto: string;
  estatus: number; // 0: Pendiente, 1: Pagado
  fecha_pago?: string;
}

const API_URL = "https://taekwondo-system-api.onrender.com";
const api = axios.create({ baseURL: API_URL });

// Inyector de token para peticiones seguras
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const schoolService = {
  getPagos: async () => {
    const response = await api.get('/finanzas/');
    return response.data;
  }
};

export const CajaFinanzas = () => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    schoolService.getPagos()
      .then(res => {
        setPagos(res);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error cargando finanzas:", err);
        setLoading(false);
      });
  }, []);

  const pendientes = pagos.filter(p => p.estatus === 0);
  const totalPendiente = pendientes.reduce((acc, curr) => acc + parseFloat(curr.monto), 0);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Resumen de Caja */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
         <DollarSign className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
         <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Total por cobrar</p>
            <h3 className="text-4xl font-black italic mt-2">
              ${totalPendiente.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </h3>
         </div>
      </div>

      {/* Listado de Cargos */}
      <div className="bg-[var(--color-card)] rounded-[3rem] p-6 border border-[var(--color-border)] shadow-2xl">
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="text-xs font-black uppercase italic text-[var(--color-text-muted)]">Cargos Pendientes</h3>
          <span className="text-[10px] font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-3 py-1 rounded-full uppercase">
            {pendientes.length} Registros
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-10 gap-3">
            <Loader2 className="animate-spin text-[var(--color-primary)]" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Consultando caja...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendientes.length > 0 ? pendientes.map((p) => (
              <div key={p.idpago} className="p-5 bg-[var(--color-background)] rounded-[2.5rem] border border-[var(--color-border)] flex justify-between items-center hover:border-[var(--color-primary)]/20 transition-all">
                <div>
                  <p className="text-[9px] font-black uppercase text-[var(--color-primary)] mb-1 tracking-wider">{p.concepto}</p>
                  <p className="text-sm font-black italic text-[var(--color-text)]">Alumno ID: {p.idalumno}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-lg font-black text-[var(--color-text)]">
                    ${parseFloat(p.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                  <button className="bg-white dark:bg-white/5 px-4 py-2 rounded-xl text-[var(--color-success)] font-black text-[10px] uppercase shadow-sm border border-[var(--color-border)] active:scale-95 transition-all">
                    Cobrar
                  </button>
                </div>
              </div>
            )) : (
              <div className="text-center p-10 space-y-2 opacity-40">
                <Check className="mx-auto text-[var(--color-success)]" size={40} />
                <p className="text-xs font-bold uppercase italic">Caja al corriente</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};