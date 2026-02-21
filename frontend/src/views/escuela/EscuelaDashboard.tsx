import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  LogOut,
  School,
  Loader2,
  Users,
  DollarSign,
  Heart,
  Trophy,
  PieChart as PieIcon,
  BarChart3,
  CalendarDays,
  Target,
  Clock
} from 'lucide-react';

// --- IMPORTACIONES MODULARES SEGÚN TU ESTRUCTURA ---
import { dashboardService } from '../../services/dashboard.service';
import { escuelaService } from '../../services/escuela.service';
import type { Escuela } from '../../types/escuela.types';

// Componentes
import GlobalNavbar from '../../components/common/GlobalNavbar';
import PerfilConfiguracion from './PerfilConfiguracion';
import { GestionAlumnos } from './GestionAlumnos';
import { Torneos } from './Torneos';
import { CajaFinanzas } from './CajaFinanzas';
import { GestionProfesores } from './GestionProfesores';

// Mapeo de colores para las cintas en las gráficas
const BELT_COLORS: Record<string, string> = {
  "Blanca": "#f8fafc",
  "Amarilla": "#fbbf24",
  "Naranja": "#fb923c",
  "Verde": "#22c55e",
  "Azul": "#3b82f6",
  "Roja": "#ef4444",
  "Marrón": "#78350f",
  "Negra": "#1e293b"
};

/**
 * Gráfico de Anillo (Donut) para Distribución de Cintas
 */
const BeltRingChart = ({ data }: { data: { color: string, count: number }[] }) => {
  const total = data.reduce((acc, curr) => acc + curr.count, 0);
  let accumulatedPercent = 0;

  if (total === 0) return <div className="text-[10px] opacity-30 font-black italic">Sin datos</div>;

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
        {data.map((item, idx) => {
          const percent = (item.count / total) * 100;
          const strokeColor = BELT_COLORS[item.color] || "#94a3b8";
          const offset = accumulatedPercent;
          accumulatedPercent += percent;
          
          return (
            <circle
              key={idx}
              cx="50" cy="50" r="40"
              fill="transparent"
              stroke={strokeColor}
              strokeWidth="12"
              strokeDasharray={`${percent * 2.51} 251`}
              strokeDashoffset={-offset * 2.51}
              className="transition-all duration-1000 ease-out"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black italic tracking-tighter">{total}</span>
        <span className="text-[7px] font-black uppercase text-[var(--color-text-muted)] tracking-widest leading-none">Total</span>
      </div>
    </div>
  );
};

/**
 * Gráfico de Barras para Finanzas de la Semana
 */
const WeeklyStatsChart = ({ data }: { data: any[] }) => {
  // Datos de ejemplo si el array viene vacío
  const chartData = data?.length > 0 ? data : [
    { label: 'L', value: 0 }, { label: 'M', value: 0 }, { label: 'M', value: 0 },
    { label: 'J', value: 0 }, { label: 'V', value: 0 }, { label: 'S', value: 0 }, { label: 'D', value: 0 }
  ];
  
  const maxValue = Math.max(...chartData.map(d => d.value)) || 100;

  return (
    <div className="flex items-end justify-between h-24 gap-2 mt-4 px-2">
      {chartData.map((day, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
          <div className="w-full bg-[var(--color-background)]/50 rounded-lg h-full relative overflow-hidden">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(day.value / maxValue) * 100}%` }}
              className="absolute bottom-0 w-full bg-gradient-to-t from-[var(--color-primary)] to-cyan-400 rounded-lg shadow-lg"
            />
          </div>
          <span className="text-[8px] font-black uppercase text-[var(--color-text-muted)]">{day.label}</span>
        </div>
      ))}
    </div>
  );
};

type NavTab = 'inicio' | 'alumnos' | 'torneos' | 'caja' | 'perfil';

const EscuelaDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('inicio');
  const [escuela, setEscuela] = useState<Escuela | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [escuelaRes, statsRes] = await Promise.all([
          escuelaService.getMiEscuela(),
          dashboardService.getEscuelaStats()
        ]);
        setEscuela(escuelaRes);
        setStats(statsRes);
      } catch (err) {
        console.error('Error al cargar datos:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/auth/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)]">
        <Loader2 className="animate-spin text-[var(--color-primary)] mb-4" size={48} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-text-muted)]">Sincronizando Dojo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col bg-[var(--color-background)] text-[var(--color-text)] transition-colors duration-700">
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[var(--color-background)]/80 backdrop-blur-xl border-b border-[var(--color-border)]/30 px-6 pt-12 pb-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-card)] shadow-lg border-2 border-[var(--color-background)] overflow-hidden flex items-center justify-center">
              {escuela?.logo_url ? (
                <img src={escuela.logo_url} alt="Logo Dojo" className="w-full h-full object-cover" />
              ) : (
                <School className="text-[var(--color-primary)]" size={24} />
              )}
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[var(--color-primary)] leading-none mb-1 opacity-70">Escuela Pro</p>
              <h1 className="text-sm font-black italic uppercase tracking-tighter truncate max-w-[150px]">
                {escuela?.nombreescuela || 'Mi Dojo'}
              </h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-3 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] relative active:scale-90 transition-all">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[var(--color-card)]" />
            </button>
            <button onClick={handleLogout} className="p-3 bg-red-500/10 text-red-500 rounded-xl active:scale-90 transition-all">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 pt-6 pb-40">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {activeTab === 'inicio' && (
              <div className="space-y-6 pb-10">
                {/* Distribución de Cintas (Gráfico Anillo) */}
                <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-6 rounded-[3rem] border border-[var(--color-border)] shadow-xl flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <PieIcon size={16} className="text-indigo-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Nivel Técnico</span>
                    </div>
                    <h3 className="text-lg font-black italic uppercase leading-none">Distribución de Cintas</h3>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {stats?.distribucion_cintas?.slice(0, 4).map((c: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full border border-white/20" style={{ backgroundColor: BELT_COLORS[c.color] || '#ccc' }} />
                          <span className="text-[9px] font-bold uppercase truncate">{c.color}: {c.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <BeltRingChart data={stats?.distribucion_cintas || []} />
                </div>

                {/* Métricas Financieras (Gráfico Barras) */}
                <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-6 rounded-[3rem] border border-[var(--color-border)] shadow-xl">
                  <div className="flex justify-between items-start mb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <BarChart3 size={16} className="text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Finanzas</span>
                      </div>
                      <h3 className="text-lg font-black italic uppercase">Ingresos Semanales</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-emerald-500 tracking-tighter">${stats?.ingresos_semanales || 0}</p>
                      <p className="text-[8px] font-black uppercase opacity-40">Monto Total</p>
                    </div>
                  </div>
                  <WeeklyStatsChart data={stats?.finanzas_semana} />
                </div>

                {/* Cards Secundarias */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-lg text-center flex flex-col items-center">
                    <Clock className="text-orange-500 mb-2" size={24} />
                    <p className="text-[9px] font-black uppercase text-[var(--color-text-muted)] tracking-widest">Pendientes</p>
                    <p className="text-3xl font-black italic mt-1">{stats?.pagos_pendientes_count || 0}</p>
                  </div>
                  <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-lg text-center flex flex-col items-center">
                    <Target className="text-purple-500 mb-2" size={24} />
                    <p className="text-[9px] font-black uppercase text-[var(--color-text-muted)] tracking-widest">Atletas en Torneo</p>
                    <p className="text-3xl font-black italic mt-1">{stats?.alumnos_torneo_count || 0}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'perfil' && escuela && (
              <PerfilConfiguracion initialEscuela={escuela} />
            )}

            {/* Marcadores para otras pestañas */}
            {['alumnos', 'torneos', 'caja'].includes(activeTab) && (
              <div className="py-24 text-center bg-[var(--color-card)]/40 rounded-[3rem] border-2 border-dashed border-[var(--color-border)] opacity-30">
                <Users size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" />
                <p className="text-[10px] font-black uppercase italic tracking-[0.2em] text-[var(--color-text-muted)]">Módulo de {activeTab} en desarrollo</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <GlobalNavbar
        activeTab={activeTab}
        onTabChange={(tab: string) => setActiveTab(tab as NavTab)}
        role="Escuela"
      />
    </div>
  );
};

export default EscuelaDashboard;