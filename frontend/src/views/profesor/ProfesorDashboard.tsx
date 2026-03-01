import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  CheckCircle2,
  Trophy,
  Calendar,
  LogOut,
  Loader2,
  TrendingUp,
  PieChart as PieIcon,
  Search,
  ChevronRight,
  Bell,
  Sparkles,
  Smartphone,
  UserCheck,
  Clock,
  LayoutDashboard,
  GraduationCap
} from 'lucide-react';

// --- IMPORTACIONES REALES DE PRODUCCIÓN ---
// @ts-ignore
import { useAuth } from '../../context/AuthContext';
// @ts-ignore
import { dashboardService } from '../../services/dashboard.service';
// @ts-ignore
import { escuelaService } from '../../services/escuela.service';
// @ts-ignore
import { themeService } from '../../services/theme.service';
// @ts-ignore
import GlobalNavbar from '../../components/common/GlobalNavbar';

/**
 * COMPONENTE: ProfesorDashboard
 * Administra el seguimiento técnico y de asistencia de los alumnos asignados al profesor.
 * Sincroniza automáticamente la identidad visual con el tema de la escuela.
 */
export const ProfesorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('inicio');
  const [stats, setStats] = useState<any>(null);
  const [escuela, setEscuela] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  /**
   * Sincronización Integral: Datos Estadísticos + Identidad de Marca (Tema)
   */
  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      // Consultamos estadísticas del profesor y datos de la escuela en paralelo
      const [statsRes, escuelaRes] = await Promise.all([
        dashboardService.getProfesorStats(),
        escuelaService.getMiEscuela()
      ]);

      setStats(statsRes);
      setEscuela(escuelaRes);

      // Aplicamos el tema de color definido por la escuela
      if (escuelaRes?.color_paleta) {
        themeService.applyTheme(escuelaRes.color_paleta);
      }
      
    } catch (err) {
      console.error("Error al sincronizar el tablero del profesor:", err);
    } finally {
      if (!isRefresh) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = () => {
    logout();
    localStorage.clear();
    window.location.href = '/auth/login';
  };

  // Filtrado de alumnos basado en búsqueda local
  const filteredAlumnos = stats?.mis_alumnos_lista?.filter((a: any) => 
    `${a.nombres} ${a.apellidopaterno}`.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)] text-[var(--color-text)]">
      <div className="relative">
        <Loader2 className="animate-spin text-[var(--color-primary)] mb-6" size={60} strokeWidth={1.5} />
        <div className="absolute inset-0 blur-3xl bg-[var(--color-primary)]/20 animate-pulse" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.6em] text-[var(--color-text-muted)] italic">
        Sincronizando Perfil Técnico...
      </p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-text)] transition-colors duration-700 font-sans">
      
      {/* ── HEADER: IDENTIDAD INSTITUCIONAL ── */}
      <header className="sticky top-0 z-40 bg-[var(--color-background)]/80 backdrop-blur-xl border-b border-[var(--color-border)]/30 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-card)] shadow-2xl border border-[var(--color-border)] overflow-hidden flex items-center justify-center">
              {escuela?.logo_url ? (
                <img src={escuela.logo_url} className="w-full h-full object-cover" alt="Dojo Logo" />
              ) : (
                <Users className="text-[var(--color-primary)]" size={24} />
              )}
            </div>
            <div className="text-left flex flex-col justify-center">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[var(--color-primary)]">Staff Técnico</span>
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </div>
              <h1 className="text-sm font-black italic uppercase tracking-tighter leading-none">
                Prof. {user?.nombre || 'Instructor'}
              </h1>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button className="p-3 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] text-[var(--color-text-muted)] shadow-xl active:scale-90 transition-all hover:text-[var(--color-primary)]">
              <Bell size={20} />
            </button>
            <button onClick={handleLogout} className="p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/10 shadow-xl active:scale-90 transition-all hover:bg-red-500 hover:text-white">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* ── CONTENIDO DINÁMICO ── */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-6 pb-40">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: "circOut" }}
            className="space-y-6"
          >
            {activeTab === 'inicio' && (
              <div className="space-y-6">
                
                {/* KPIs OPERATIVOS */}
                <div className="grid grid-cols-2 gap-4">
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="bg-[var(--color-card)] p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-2xl relative overflow-hidden group"
                  >
                    <Users className="absolute -right-4 -top-4 opacity-[0.03] text-[var(--color-primary)] group-hover:opacity-[0.06] transition-opacity" size={120} />
                    <Users className="text-[var(--color-primary)] mb-3" size={32} />
                    <h4 className="text-4xl font-black italic tracking-tighter leading-none">{stats?.total_alumnos || 0}</h4>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] mt-2">Mis Alumnos</p>
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="bg-[var(--color-card)] p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-2xl relative overflow-hidden group"
                  >
                    <UserCheck className="absolute -right-4 -top-4 opacity-[0.03] text-emerald-500 group-hover:opacity-[0.06] transition-opacity" size={120} />
                    <CheckCircle2 className="text-emerald-500 mb-3" size={32} />
                    <h4 className="text-4xl font-black italic tracking-tighter leading-none">{stats?.mis_asistencias_hoy || 0}</h4>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] mt-2">Pases Hoy</p>
                  </motion.div>
                </div>

                {/* DOMINIO TÉCNICO (DISTRIBUCIÓN DE CINTAS) */}
                <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-8 rounded-[3rem] border border-[var(--color-border)] shadow-2xl">
                  <div className="flex items-center justify-between mb-8">
                    <div className="text-left text-[var(--color-text)]">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-7 h-7 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                          <PieIcon size={14} className="text-indigo-400" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Análisis Kup/Dan</span>
                      </div>
                      <h3 className="text-xl font-black italic uppercase tracking-tighter">Niveles de Grado</h3>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-background)] rounded-full border border-[var(--color-border)]">
                      <Sparkles size={12} className="text-amber-400" />
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Fuerza Técnica</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {stats?.distribucion_cintas_porcentaje && Object.entries(stats.distribucion_cintas_porcentaje).map(([color, pct]: any, idx) => (
                      <div key={color} className="space-y-2.5">
                        <div className="flex justify-between text-[10px] font-black uppercase italic tracking-tighter text-[var(--color-text)]">
                          <span className="flex items-center gap-2">
                             <div className="w-2.5 h-2.5 rounded-full border border-white/10 shadow-[0_0_10px_rgba(255,255,255,0.1)]" 
                                  style={{ backgroundColor: color === 'Blanca' ? '#fff' : color === 'Negra' ? '#111' : 'var(--color-primary)' }} />
                             Cinta {color}
                          </span>
                          <span className="text-[var(--color-primary)] font-black">{pct}%</span>
                        </div>
                        <div className="h-2.5 bg-[var(--color-background)] rounded-full overflow-hidden border border-[var(--color-border)]/5 shadow-inner">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1.2, delay: idx * 0.05, ease: "circOut" }}
                            className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] rounded-full shadow-[0_0_15px_var(--color-primary-60)]" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ALERTAS Y EVENTOS TÉCNICOS */}
                <div className="grid grid-cols-1 gap-4 text-left">
                  <motion.div 
                    whileTap={{ scale: 0.98 }}
                    className="bg-[var(--color-card)] p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-xl flex items-center justify-between group cursor-pointer hover:border-[var(--color-primary)]/30 transition-all"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20 shadow-inner">
                        <Trophy size={28} />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-black uppercase italic tracking-tighter leading-none text-[var(--color-text)]">Arena y Torneos</h4>
                        <p className="text-[10px] font-bold text-[var(--color-text-muted)] mt-2 opacity-60">
                          {stats?.alumnos_en_torneo || 0} Atletas en competencia activa
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="text-[var(--color-text-muted)] opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" size={20} />
                  </motion.div>

                  <motion.div 
                    whileTap={{ scale: 0.98 }}
                    className="bg-[var(--color-card)] p-6 rounded-[2.5rem] border border-[var(--color-border)] shadow-xl flex items-center justify-between group cursor-pointer hover:border-orange-500/30 transition-all"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-400 border border-orange-500/20 shadow-inner">
                        <Clock size={28} />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-black uppercase italic tracking-tighter leading-none text-[var(--color-text)]">Administración de Cobro</h4>
                        <p className="text-[10px] font-bold text-orange-400 mt-2">
                          {stats?.mensualidades_stats?.pendientes || 0} Cargos pendientes de tus alumnos
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="text-[var(--color-text-muted)] opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" size={20} />
                  </motion.div>
                </div>
              </div>
            )}

            {/* LISTADO DE ALUMNOS (ASISTENCIA RÁPIDA) */}
            {activeTab === 'alumnos' && (
              <div className="space-y-6">
                <div className="bg-[var(--color-card)] p-4 rounded-[2.2rem] border border-[var(--color-border)] shadow-2xl">
                  <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[var(--color-primary)] transition-colors" size={20} />
                    <input 
                      type="text" 
                      placeholder="Identificar alumno para pase..." 
                      className="w-full h-14 pl-14 pr-6 bg-[var(--color-background)] rounded-[1.8rem] border border-transparent focus:border-[var(--color-primary)] outline-none font-bold text-sm text-[var(--color-text)] transition-all shadow-inner placeholder:opacity-30"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  {filteredAlumnos.map((alumno: any) => (
                    <motion.div 
                      key={alumno.idalumno}
                      layout
                      className="bg-[var(--color-card)]/40 p-4 rounded-[2.5rem] border border-[var(--color-border)] flex items-center justify-between group hover:bg-[var(--color-card)] transition-colors shadow-lg"
                    >
                      <div className="flex items-center gap-5 text-left">
                        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-[var(--color-border)] overflow-hidden flex items-center justify-center shadow-inner">
                          {alumno.fotoalumno ? (
                            <img src={alumno.fotoalumno} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <Users size={24} className="text-slate-800 opacity-20" />
                          )}
                        </div>
                        <div className="text-left space-y-1">
                          <h4 className="text-base font-black uppercase italic tracking-tighter leading-none text-[var(--color-text)]">
                            {alumno.nombres} {alumno.apellidopaterno}
                          </h4>
                          <p className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />
                             Cinta {alumno.cinta_color}
                          </p>
                        </div>
                      </div>
                      <button className="p-4 bg-emerald-500/10 text-emerald-500 rounded-3xl border border-emerald-500/20 active:scale-90 transition-all hover:bg-emerald-500 hover:text-white shadow-xl">
                        <UserCheck size={24} strokeWidth={2.5} />
                      </button>
                    </motion.div>
                  ))}
                  
                  {filteredAlumnos.length === 0 && !loading && (
                    <div className="py-32 text-center opacity-20 font-black uppercase text-[11px] tracking-[0.3em] italic">
                       Sin coincidencias técnicas
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MÓDULOS EN DESARROLLO (VISTA SMARTPHONE) */}
            {['pagos', 'examenes'].includes(activeTab) && (
              <div className="py-40 flex flex-col items-center gap-10 text-center animate-in zoom-in duration-500">
                 <div className="w-36 h-36 rounded-[3.8rem] bg-zinc-900/50 flex items-center justify-center border border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[var(--color-primary)]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Smartphone size={54} className="text-[var(--color-primary)]/40 animate-pulse" strokeWidth={1.2} />
                 </div>
                 <div className="space-y-4 px-10">
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-[var(--color-text)]">Módulo: {activeTab}</h3>
                    <p className="text-[11px] font-black uppercase tracking-[0.6em] text-[var(--color-primary)] animate-pulse leading-relaxed">
                       Cifrando protocolos de red central y sincronización de datos de combate...
                    </p>
                 </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── BARRA DE NAVEGACIÓN GLOBAL REAL ── */}
      <GlobalNavbar 
        activeTab={activeTab} 
        onTabChange={(id: string) => setActiveTab(id)} 
        role="Profesor" 
      />
    </div>
  );
};

export default ProfesorDashboard;