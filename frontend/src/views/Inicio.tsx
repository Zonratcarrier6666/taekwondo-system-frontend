import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { 
  Award, Users, DollarSign, LogOut, LayoutDashboard, 
  Palette, Loader2, AlertCircle, TrendingUp, Clock, ShieldCheck, 
  Filter, UserCheck, ChevronRight, Smartphone, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// --- CONFIGURACIÓN DE API & SERVICIOS (Integrados para evitar errores de ruta) ---
const API_URL = "https://taekwondo-system-api.onrender.com";
const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const dashboardService = {
  getEscuelaStats: async () => (await api.get('/dashboard/escuela')).data,
  getSuperAdminStats: async (idEscuela?: string) => {
    const url = idEscuela ? `/dashboard/superadmin?idescuela=${idEscuela}` : '/dashboard/superadmin';
    return (await api.get(url)).data;
  },
  getProfesorStats: async () => (await api.get('/dashboard/profesor')).data
};

// --- CONTEXTO DE AUTENTICACIÓN (Integrado para el Canvas) ---
type Role = 'SuperAdmin' | 'Escuela' | 'Profesor' | 'Juez';
type ThemeName = 'default' | 'light' | 'rojo-dragon';
interface User { username: string; rol: Role; tema: ThemeName; }

interface AuthContextType {
  user: User | null;
  login: (token: string, role: Role, username: string) => void;
  logout: () => void;
  setTheme: (theme: ThemeName) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user_session');
    if (token && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      document.documentElement.setAttribute('data-theme', parsedUser.tema || 'default');
    }
  }, []);

  const login = (token: string, role: Role, username: string) => {
    const theme: ThemeName = role === 'Profesor' ? 'rojo-dragon' : 'default';
    const newUser = { username, rol: role, tema: theme };
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_session', JSON.stringify(newUser));
    setUser(newUser);
    document.documentElement.setAttribute('data-theme', theme);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    document.documentElement.setAttribute('data-theme', 'default');
  };

  const setTheme = (newTheme: ThemeName) => {
    if (user) {
      const updatedUser = { ...user, tema: newTheme };
      setUser(updatedUser);
      localStorage.setItem('user_session', JSON.stringify(updatedUser));
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, setTheme, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// --- COMPONENTES DE APOYO ---
const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-[var(--color-card)] p-5 rounded-[2rem] border border-white/5 shadow-lg">
    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-white mb-3`}>
      <Icon size={20} />
    </div>
    <h4 className="text-2xl font-black italic">{value}</h4>
    <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">{label}</p>
  </div>
);

// --- VISTAS ESPECÍFICAS POR ROL ---

const SuperAdminContent = ({ data, filterSchool, setFilterSchool }: any) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-4">
      <StatCard label="Usuarios" value={data.total_usuarios} icon={Users} color="bg-blue-500" />
      <StatCard label="Escuelas" value={data.resumen_sistema.total_escuelas} icon={ShieldCheck} color="bg-purple-500" />
    </div>
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] ml-2">Filtrar Institución</label>
      <select 
        value={filterSchool} 
        onChange={(e) => setFilterSchool(e.target.value)}
        className="w-full h-14 bg-[var(--color-card)] rounded-[1.5rem] px-4 font-bold text-sm text-[var(--color-text)] border border-white/5 outline-none"
      >
        <option value="">Todas las Escuelas</option>
        {data.escuelas.map((esc: any) => (
          <option key={esc.idescuela} value={esc.idescuela}>{esc.nombreescuela}</option>
        ))}
      </select>
    </div>
    <div className="bg-[var(--color-card)] rounded-[2.5rem] p-6 border border-white/5">
      <h3 className="text-sm font-black uppercase italic mb-6">Lista de Usuarios</h3>
      <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
        {data.usuarios_lista.map((u: any, i: number) => (
          <div key={i} className="flex items-center justify-between p-3 bg-[var(--color-background)] rounded-2xl border border-white/5">
            <div>
              <p className="text-sm font-black italic">{u.username}</p>
              <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase">{u.rol} • {new Date(u.fecha_creacion).toLocaleDateString()}</p>
            </div>
            <ChevronRight size={14} className="text-[var(--color-text-muted)]" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const EscuelaContent = ({ data }: any) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-4">
      <StatCard label="Ingresos" value={`$${data.ingresos_semanales}`} icon={TrendingUp} color="bg-green-500" />
      <StatCard label="Pendientes" value={data.pagos_pendientes_count} icon={Clock} color="bg-orange-500" />
    </div>
    <div className="bg-[var(--color-card)] rounded-[2.5rem] p-6 border border-white/5">
      <h3 className="text-sm font-black uppercase italic mb-4">Distribución de Cintas</h3>
      <div className="grid grid-cols-2 gap-3">
        {data.distribucion_cintas.map((c: any, i: number) => (
          <div key={i} className="p-4 bg-[var(--color-background)] rounded-3xl border border-white/5 flex flex-col">
             <span className="text-[10px] font-black uppercase text-[var(--color-text-muted)]">{c.color}</span>
             <span className="text-xl font-black italic text-[var(--color-primary)]">{c.count}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ProfesorContent = ({ data }: any) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-4">
      <StatCard label="Mis Alumnos" value={data.total_alumnos} icon={Users} color="bg-red-500" />
      <StatCard label="Torneos" value={data.alumnos_en_torneo} icon={Award} color="bg-blue-500" />
    </div>
    <div className="bg-[var(--color-card)] rounded-[2.5rem] p-6 border border-white/5">
       <h3 className="text-sm font-black uppercase italic mb-6">Mensualidades</h3>
       <div className="flex gap-4">
          <div className="flex-1 bg-green-500/10 p-4 rounded-3xl text-center">
             <p className="text-2xl font-black text-[var(--color-success)]">{data.mensualidades_stats.pagadas}</p>
             <p className="text-[9px] font-bold uppercase text-[var(--color-text-muted)]">Pagadas</p>
          </div>
          <div className="flex-1 bg-red-500/10 p-4 rounded-3xl text-center">
             <p className="text-2xl font-black text-[var(--color-danger)]">{data.mensualidades_stats.pendientes}</p>
             <p className="text-[9px] font-bold uppercase text-[var(--color-text-muted)]">Deudas</p>
          </div>
       </div>
    </div>
  </div>
);

// --- COMPONENTE PRINCIPAL ---

export const Dashboard = () => {
  const { user, logout, setTheme } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterSchool, setFilterSchool] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let res;
        if (user?.rol === 'SuperAdmin') {
          res = await dashboardService.getSuperAdminStats(filterSchool);
        } else if (user?.rol === 'Profesor') {
          res = await dashboardService.getProfesorStats();
        } else {
          res = await dashboardService.getEscuelaStats();
        }
        setData(res);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    if (user) loadData();
  }, [user?.rol, filterSchool]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[var(--color-background)]">
      <Loader2 className="animate-spin text-[var(--color-primary)]" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen pb-24 bg-[var(--color-background)] px-4 pt-8 max-w-2xl mx-auto">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 px-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1">{user?.rol} Mode</p>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">{user?.username}</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTheme(user?.tema === 'light' ? 'default' : 'light')} className="p-3 bg-[var(--color-card)] rounded-2xl text-[var(--color-primary)] border border-white/5">
            <Palette size={20} />
          </button>
          <button onClick={logout} className="p-3 bg-[var(--color-card)] rounded-2xl text-[var(--color-danger)] border border-white/5">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Contenido Dinámico */}
      {user?.rol === 'SuperAdmin' && data && <SuperAdminContent data={data} filterSchool={filterSchool} setFilterSchool={setFilterSchool} />}
      {user?.rol === 'Escuela' && data && <EscuelaContent data={data} />}
      {user?.rol === 'Profesor' && data && <ProfesorContent data={data} />}

      {/* Barra de Navegación Móvil (Simulada) */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[var(--color-card)]/80 backdrop-blur-xl border-t border-white/5 flex justify-around items-center px-4 pb-2 md:hidden">
        {[
          { icon: LayoutDashboard, label: 'Inicio', active: true },
          { icon: Users, label: 'Alumnos' },
          { icon: Award, label: 'Eventos' },
          { icon: DollarSign, label: 'Pagos' },
        ].map((item, idx) => (
          <button key={idx} className={`flex flex-col items-center gap-1 ${item.active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>
            <item.icon size={22} />
            <span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

// Exportación por defecto para el Canvas
export default function App() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  );
}