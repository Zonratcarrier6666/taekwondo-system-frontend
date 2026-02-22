import React, { useState, useEffect } from 'react';
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
// Nota: Estas rutas deben existir en tu proyecto local.
import { dashboardService } from '../../services/dashboard.service';
import { escuelaService } from '../../services/escuela.service';
import { themeService } from '../../services/theme.service';
import type { Escuela } from '../../types/escuela.types';

// Componentes
import GlobalNavbar from '../../components/common/GlobalNavbar';
import PerfilConfiguracion from './PerfilConfiguracion';
import GestionProfesores from './GestionProfesores'; 

// Mapeo de colores para cintas (Gráficas)
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
 * COMPONENTES DE APOYO (Gráficas internas)
 */
const BeltRingChart = ({ data }: { data: { color: string, count: number }[] }) => {
  const total = data.reduce((acc, curr) => acc + curr.count, 0);
  let accumulatedPercent = 0;
  if (total === 0) return <div className="w-36 h-36 rounded-full border-4 border-dashed border-[var(--color-border)] flex items-center justify-center opacity-20"><PieIcon size={24} /></div>;

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
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
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black italic tracking-tighter leading-none">{total}</span>
        <span className="text-[7px] font-black uppercase text-[var(--color-text-muted)] tracking-widest mt-1">Alumnos</span>
      </div>
    </div>
  );
};

const WeeklyFinancesChart = ({ data }: { data: any[] }) => {
  const chartData = data?.length > 0 ? data : [{ label: 'L', value: 0 }, { label: 'M', value: 0 }, { label: 'M', value: 0 }, { label: 'J', value: 0 }, { label: 'V', value: 0 }, { label: 'S', value: 0 }, { label: 'D', value: 0 }];
  const maxValue = Math.max(...chartData.map(d => d.value)) || 100;
  return (
    <div className="flex items-end justify-between h-28 gap-2 mt-4 px-2">
      {chartData.map((day, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <div className="w-full bg-[var(--color-background)]/40 rounded-xl h-full relative overflow-hidden border border-[var(--color-border)]/20">
            <motion.div initial={{ height: 0 }} animate={{ height: `${(day.value / maxValue) * 100}%` }} className="absolute bottom-0 w-full bg-gradient-to-t from-[var(--color-primary)] to-blue-400 rounded-t-lg shadow-[0_0_15px_var(--color-primary)]" />
          </div>
          <span className="text-[8px] font-black uppercase text-[var(--color-text-muted)] opacity-60">{day.label}</span>
        </div>
      ))}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export const EscuelaDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('inicio');
  const [escuela, setEscuela] = useState<Escuela | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [escuelaRes, statsRes] = await Promise.all([
          escuelaService.getMiEscuela(),
          dashboardService.getEscuelaStats()
        ]);
        
        setEscuela(escuelaRes);
        setStats(statsRes);

        /**
         * 🎨 LÓGICA DE SINCRONIZACIÓN DE TEMA
         * Se encarga de aplicar el tema de la escuela al localStorage e inmediatamente al CSS.
         */
        if (escuelaRes && escuelaRes.color_paleta) {
          const themeId = escuelaRes.color_paleta;
          
          // 1. Aplicar variables CSS globales inmediatamente
          if (themeService && typeof themeService.applyTheme === 'function') {
            themeService.applyTheme(themeId);
          }

          // 2. Actualizar el objeto user_session en localStorage para reemplazar "auto"
          const sessionData = localStorage.getItem('user_session');
          if (sessionData) {
            try {
              const parsedSession = JSON.parse(sessionData);
              parsedSession.tema = themeId; // Guardar el tema real
              localStorage.setItem('user_session', JSON.stringify(parsedSession));
              
              // Sincronizar preferencia directa para futuras cargas
              localStorage.setItem('theme_preference', themeId);
              localStorage.setItem('current_theme_name', themeId);
            } catch (e) {
              console.error("Error al sincronizar tema en almacenamiento local:", e);
            }
          }
        }

      } catch (err) {
        console.error('Error al cargar datos iniciales:', err);
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

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)]">
      <Loader2 className="animate-spin text-[var(--color-primary)] mb-4" size={54} />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-muted)]">Sincronizando Dojo...</p>
    </div>
  );

  return (
    <div className="min-h-screen relative flex flex-col bg-[var(--color-background)] text-[var(--color-text)] transition-colors duration-700">
      
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[var(--color-background)]/80 backdrop-blur-xl border-b border-[var(--color-border)]/30 px-6 pt-12 pb-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-card)] shadow-lg border-2 border-[var(--color-background)] overflow-hidden flex items-center justify-center">
              {escuela?.logo_url ? <img src={escuela.logo_url} className="w-full h-full object-cover" /> : <School className="text-[var(--color-primary)]" size={24} />}
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[var(--color-primary)] leading-none mb-1 opacity-70">Unidad Activa</p>
              <h1 className="text-sm font-black italic uppercase tracking-tighter truncate max-w-[150px]">
                {escuela?.nombreescuela || 'Mi Academia'}
              </h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-3 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] shadow-sm active:scale-90 transition-all"><Bell size={20} /></button>
            <button onClick={handleLogout} className="p-3 bg-red-500/10 text-red-500 rounded-xl shadow-sm active:scale-90 transition-all"><LogOut size={20} /></button>
          </div>
        </div>
      </header>

      {/* ÁREA DE CONTENIDO */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 pt-6 pb-40">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            
            {activeTab === 'inicio' && (
              <div className="space-y-6">
                <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-7 rounded-[3rem] border border-[var(--color-border)] shadow-2xl flex items-center justify-between gap-6">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-500/10 rounded-xl flex items-center justify-center"><PieIcon size={16} className="text-indigo-500" /></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Cuerpo Estudiantil</span>
                    </div>
                    <h3 className="text-xl font-black italic uppercase leading-tight">Estado de Cintas</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-4">
                      {stats?.distribucion_cintas?.slice(0, 4).map((c: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: BELT_COLORS[c.color] || '#ccc' }} />
                          <span className="text-[9px] font-black uppercase truncate">{c.color}: {c.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <BeltRingChart data={stats?.distribucion_cintas || []} />
                </div>

                <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-7 rounded-[3rem] border border-[var(--color-border)] shadow-2xl">
                   <div className="flex justify-between items-start mb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center"><BarChart3 size={16} className="text-emerald-500" /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">Rendimiento</span>
                      </div>
                      <h3 className="text-xl font-black italic uppercase">Flujo Semanal</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-emerald-500 tracking-tighter leading-none">${stats?.ingresos_semanales || 0}</p>
                      <p className="text-[8px] font-black uppercase opacity-40 mt-1 tracking-widest">Ingresos</p>
                    </div>
                  </div>
                  <WeeklyFinancesChart data={stats?.finanzas_semana} />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="bg-[var(--color-card)] p-7 rounded-[2.5rem] border border-[var(--color-border)] shadow-xl text-center flex flex-col items-center">
                    <Clock className="text-orange-500 mb-2" size={28} />
                    <p className="text-[9px] font-black uppercase text-[var(--color-text-muted)] tracking-widest leading-none">Pagos Pend.</p>
                    <p className="text-4xl font-black italic mt-2 tracking-tighter">{stats?.pagos_pendientes_count || 0}</p>
                  </div>
                  <div className="bg-[var(--color-card)] p-7 rounded-[2.5rem] border border-[var(--color-border)] shadow-xl text-center flex flex-col items-center">
                    <Target className="text-purple-500 mb-2" size={28} />
                    <p className="text-[9px] font-black uppercase text-[var(--color-text-muted)] tracking-widest leading-none">En Torneo</p>
                    <p className="text-4xl font-black italic mt-2 tracking-tighter">{stats?.alumnos_torneo_count || 0}</p>
                  </div>
                </div>
              </div>
            )}

            {/* VISTAS MODULARES */}
            {activeTab === 'perfil' && escuela && <PerfilConfiguracion initialEscuela={escuela} />}
            {activeTab === 'profesores' && <GestionProfesores />}

            {['alumnos', 'torneos', 'caja'].includes(activeTab) && (
              <div className="py-24 text-center bg-[var(--color-card)]/40 rounded-[3rem] border-2 border-dashed border-[var(--color-border)] opacity-30 shadow-inner">
                <PieIcon size={64} className="mx-auto mb-4 text-[var(--color-text-muted)]" />
                <p className="text-[12px] font-black uppercase italic tracking-[0.3em] text-[var(--color-text-muted)]">Módulo en sincronización</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <GlobalNavbar activeTab={activeTab} onTabChange={(tab: string) => setActiveTab(tab as any)} role="Escuela" />
    </div>
  );
};

export default EscuelaDashboard;