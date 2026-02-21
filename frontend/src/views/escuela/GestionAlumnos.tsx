import React, { useState, useEffect } from 'react';
import { Search, Plus, Loader2, ChevronRight } from 'lucide-react';
import axios from 'axios';

// --- DEFINICIONES LOCALES (Para asegurar funcionamiento en el Canvas) ---
interface Alumno {
  idalumno: number;
  nombres: string;
  apellidopaterno: string;
  idgradoactual: number;
  fotoalumno?: string;
}

const API_URL = "https://taekwondo-system-api.onrender.com";
const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const schoolService = {
  getAlumnos: async () => {
    const response = await api.get('/alumnos/');
    return response.data;
  }
};

export const GestionAlumnos = () => {
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    schoolService.getAlumnos()
      .then(res => {
        setAlumnos(res);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error cargando alumnos:", err);
        setLoading(false);
      });
  }, []);

  const filtered = alumnos.filter(a => 
    (a.nombres + " " + a.apellidopaterno).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <input 
            type="text" placeholder="Buscar alumno..." 
            className="w-full h-16 bg-[var(--color-card)] rounded-[2rem] px-12 font-bold shadow-lg border-none outline-none text-[var(--color-text)]" 
            onChange={e => setSearch(e.target.value)} 
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={20} />
        </div>
        <button className="w-16 h-16 bg-[var(--color-primary)] text-white rounded-[2rem] flex items-center justify-center shadow-lg active:scale-90 transition-all">
          <Plus size={28} />
        </button>
      </div>
      
      <div className="bg-[var(--color-card)] rounded-[3rem] p-6 border border-[var(--color-border)] shadow-2xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-10 gap-3">
            <Loader2 className="animate-spin text-[var(--color-primary)]" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Cargando alumnos...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.length > 0 ? filtered.map((a) => (
              <div key={a.idalumno} className="flex items-center justify-between p-4 bg-[var(--color-background)] rounded-3xl border border-transparent hover:border-[var(--color-primary)]/20 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center font-black text-[var(--color-primary)] overflow-hidden border border-[var(--color-border)]">
                    {a.fotoalumno ? (
                      <img src={a.fotoalumno} alt={a.nombres} className="w-full h-full object-cover" />
                    ) : (
                      <span>{a.nombres[0]}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-black italic text-[var(--color-text)]">{a.nombres} {a.apellidopaterno}</p>
                    <p className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                      ID #{a.idalumno} • Grado {a.idgradoactual}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
              </div>
            )) : (
              <div className="text-center p-10">
                <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase italic">No se encontraron alumnos</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};