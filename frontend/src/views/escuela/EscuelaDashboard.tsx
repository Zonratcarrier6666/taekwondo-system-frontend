import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  LogOut,
  School,
  Loader2,
  Users,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  Target,
  Clock,
  GraduationCap,
  LayoutDashboard
} from 'lucide-react';

// --- IMPORTACIONES MODULARES ---
// Usamos @ts-ignore para evitar que el entorno de previsualización bloquee la compilación
// @ts-ignore
import { dashboardService } from '../../services/dashboard.service';
// @ts-ignore
import { escuelaService } from '../../services/escuela.service';
// @ts-ignore
import { themeService } from '../../services/theme.service';
// @ts-ignore
import type { Escuela } from '../../types/escuela.types';

// Vistas y Componentes
// @ts-ignore
import GlobalNavbar from '../../components/common/GlobalNavbar';
// @ts-ignore
import PerfilConfiguracion from './PerfilConfiguracion';
// @ts-ignore
import GestionProfesores from './GestionProfesores';
// @ts-ignore
import GestionAlumnos from './GestionAlumnos';
// @ts-ignore
import CajaFinanzas from './CajaFinanzas';

/**
 * Mapeo de colores para cintas (Utilizado en las gráficas de Inicio)
 */
const BELT_COLORS: Record<string, string> = {
  "Blanca": "#f8fafc", "Amarilla": "#fbbf24", "Naranja": "#fb923c",
  "Verde": "#22c55e", "Azul": "#3b82f6", "Roja": "#ef4444",
  "Marrón": "#78350f", "Negra": "#1e293b"
};

/**
 * Componente interno: Anillo de distribución de cintas
 */
const BeltRingChart = ({ data }: { data: { color: string, count: number }[] }) => {
  const total = data.reduce((acc, curr) => acc + curr.count, 0);
  let accumulatedPercent = 0;
  if (total === 0) return <div className="w-32 h-32 rounded-full border-4 border-dashed border-[var(--color-border)] flex items-center justify-center opacity-20"><PieIcon size={20} /></div>;

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
        {data.map((item, idx) => {
          const percent = (item.count / total) * 100;
          const strokeColor = BELT_COLORS[item.color] || "#94a3b8";
          const offset = accumulatedPercent;
          accumulatedPercent += percent;
          return (
            <motion.circle
              key={idx} cx="50" cy="50" r="40" fill="transparent" stroke={strokeColor} strokeWidth="14"
              initial={{ strokeDasharray: "0 251" }} animate={{ strokeDasharray: `${percent * 2.51} 251` }}
              strokeDashoffset={-offset * 2.51} transition={{ duration: 1.5, ease: "circOut" }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-black italic tracking-tighter leading-none text-[var(--color-text)]">{total}</span>
        <span className="text-[6px] font-black uppercase text-[var(--color-text-muted)] tracking-widest mt-0.5">Alumnos</span>
      </div>
    </div>
  );
};

/**
 * Componente interno: Gráfica de barras de finanzas
 */
const WeeklyFinancesChart = ({ data }: { data: any[] }) => {
  const chartData = data?.length > 0 ? data : [
    { label: 'L', value: 0 }, { label: 'M', value: 0 }, { label: 'M', value: 0 },
    { label: 'J', value: 0 }, { label: 'V', value: 0 }, { label: 'S', value: 0 }, { label: 'D', value: 0 }
  ];
  const maxValue = Math.max(...chartData.map(d => d.value)) || 100;
  return (
    <div className="flex items-end justify-between h-24 gap-1.5 mt-3 px-1">
      {chartData.map((day, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
          <div className="w-full bg-[var(--color-background)]/40 rounded-lg h-full relative overflow-hidden border border-[var(--color-border)]/10">
            <motion.div initial={{ height: 0 }} animate={{ height: `${(day.value / maxValue) * 100}%` }} className="absolute bottom-0 w-full bg-gradient-to-t from-[var(--color-primary)] to-blue-400 rounded-t-md" />
          </div>
          <span className="text-[7px] font-black uppercase text-[var(--color-text-muted)] opacity-50">{day.label}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * --- COMPONENTE PRINCIPAL: ESCUELA DASHBOARD ---
 */
export const EscuelaDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('inicio');
  const [escuela, setEscuela] = useState<Escuela | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const [escuelaRes, statsRes] = await Promise.all([
        escuelaService.getMiEscuela(),
        dashboardService.getEscuelaStats()
      ]);
      setEscuela(escuelaRes);
      setStats(statsRes);

      if (escuelaRes && escuelaRes.color_paleta) {
        const themeId = escuelaRes.color_paleta;
        themeService.applyTheme(themeId);
        const sessionData = localStorage.getItem('user_session');
        if (sessionData) {
          try {
            const parsedSession = JSON.parse(sessionData);
            parsedSession.tema = themeId;
            localStorage.setItem('user_session', JSON.stringify(parsedSession));
          } catch (e) { console.error(e); }
        }
        localStorage.setItem('theme_preference', themeId);
      }
    } catch (err) {
      console.error('Error Sync:', err);
    } finally {
      if (!isRefresh) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/auth/login';
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)]">
      <Loader2 className="animate-spin text-[var(--color-primary)] mb-4" size={48} />
      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--color-text-muted)] animate-pulse">Sincronizando Dojo...</p>
    </div>
  );

  return (
    <div className="min-h-screen relative flex flex-col bg-[var(--color-background)] text-[var(--color-text)] transition-colors duration-700">
      
      {/* HEADER ULTRA DELGADO (Optimizado) */}
      <header className="sticky top-0 z-40 bg-[var(--color-background)]/80 backdrop-blur-xl border-b border-[var(--color-border)]/30 px-4 py-2.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-card)] shadow-lg border border-[var(--color-border)]/50 overflow-hidden flex items-center justify-center flex-shrink-0">
              {escuela?.logo_url ? (
                <img src={escuela.logo_url} className="w-full h-full object-cover" alt="Logo" />
              ) : (
                <School className="text-[var(--color-primary)]" size={20} />
              )}
            </div>
            <div className="text-left flex flex-col justify-center">
              <p className="text-[7px] font-black uppercase tracking-[0.3em] text-[var(--color-primary)] leading-none mb-0.5 opacity-70">Unidad Activa</p>
              <h1 className="text-xs font-black italic uppercase tracking-tighter truncate max-w-[140px] leading-tight text-[var(--color-text)]">
                {escuela?.nombreescuela || 'Mi Academia'}
              </h1>
            </div>
          </div>
          <div className="flex gap-1.5">
            <button className="p-2.5 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] shadow-sm active:scale-90 transition-all hover:text-[var(--color-primary)]">
              <Bell size={18} />
            </button>
            <button onClick={handleLogout} className="p-2.5 bg-red-500/10 text-red-500 rounded-xl border border-red-500/10 shadow-sm active:scale-90 transition-all hover:bg-red-500 hover:text-white">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ÁREA DE CONTENIDO DINÁMICO */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-4 pb-40">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
            
            {activeTab === 'inicio' && (
              <div className="space-y-5">
                {/* Distribución Técnica */}
                <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-2xl flex items-center justify-between gap-6">
                  <div className="flex-1 space-y-2 text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-indigo-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <PieIcon size={14} className="text-indigo-500" />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Grados Kup</span>
                    </div>
                    <h3 className="text-lg font-black italic uppercase leading-tight text-[var(--color-text)]">Distribución</h3>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-3">
                      {stats?.distribucion_cintas?.slice(0, 4).map((c: any, i: number) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: BELT_COLORS[c.color] || '#ccc' }} />
                          <span className="text-[8px] font-black uppercase truncate opacity-70 text-[var(--color-text)]">{c.color}: {c.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <BeltRingChart data={stats?.distribucion_cintas || []} />
                </div>

                {/* Rendimiento Financiero */}
                <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-2xl">
                   <div className="flex justify-between items-start mb-1">
                    <div className="space-y-1 text-left">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BarChart3 size={14} className="text-emerald-500" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Flujo de Caja</span>
                      </div>
                      <h3 className="text-lg font-black italic uppercase text-[var(--color-text)]">Rendimiento</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-emerald-500 tracking-tighter leading-none">${stats?.ingresos_semanales || 0}</p>
                      <p className="text-[7px] font-black uppercase opacity-40 mt-0.5 tracking-widest text-[var(--color-text-muted)]">Ingresos Semanal</p>
                    </div>
                  </div>
                  <WeeklyFinancesChart data={stats?.finanzas_semana} />
                </div>

                {/* Resumen Operativo */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[var(--color-card)] p-6 rounded-[2rem] border border-[var(--color-border)] shadow-xl text-center flex flex-col items-center">
                    <Clock className="text-orange-500 mb-1.5" size={24} />
                    <p className="text-[8px] font-black uppercase text-[var(--color-text-muted)] tracking-widest leading-none">Pendientes</p>
                    <p className="text-3xl font-black italic mt-1.5 tracking-tighter text-[var(--color-text)]">{stats?.pagos_pendientes_count || 0}</p>
                  </div>
                  <div className="bg-[var(--color-card)] p-6 rounded-[2rem] border border-[var(--color-border)] shadow-xl text-center flex flex-col items-center">
                    <Target className="text-purple-500 mb-1.5" size={24} />
                    <p className="text-[8px] font-black uppercase text-[var(--color-text-muted)] tracking-widest leading-none">En Torneo</p>
                    <p className="text-3xl font-black italic mt-1.5 tracking-tighter text-[var(--color-text)]">{stats?.alumnos_torneo_count || 0}</p>
                  </div>
                </div>
              </div>
            )}

            {/* VISTAS MODULARES */}
            {activeTab === 'perfil' && escuela && (
              <PerfilConfiguracion initialEscuela={escuela} onUpdate={() => fetchData(true)} />
            )}
            {activeTab === 'profesores' && <GestionProfesores />}
            {activeTab === 'alumnos' && <GestionAlumnos />}
            {activeTab === 'caja' && <CajaFinanzas />}

            {/* Módulos en construcción */}
            {['torneos'].includes(activeTab) && (
              <div className="py-20 text-center bg-[var(--color-card)]/40 rounded-[2.5rem] border-2 border-dashed border-[var(--color-border)] opacity-30 shadow-inner">
                <PieIcon size={48} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
                <p className="text-[10px] font-black uppercase italic tracking-[0.2em] text-[var(--color-text-muted)]">Módulo en sincronización</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* NAVBAR GLOBAL */}
      <GlobalNavbar activeTab={activeTab} onTabChange={(tab: string) => setActiveTab(tab)} role="Escuela" />
    </div>
  );
};

export default EscuelaDashboard;