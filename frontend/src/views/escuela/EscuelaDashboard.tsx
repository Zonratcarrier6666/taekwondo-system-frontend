import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, DollarSign, School, 
  LogOut, Bell, Plus, Camera, Save, MapPin, 
  Mail, Sparkles, Palette, Check, Info, Globe, 
  PhoneCall, AlertTriangle, Loader2, Heart, Trophy,
  CheckCircle2
} from 'lucide-react';
import axios from 'axios';

/** * NOTA: He integrado LISTA_TEMAS y schoolService internamente para resolver
 * los errores de compilación del Canvas. En tu VS Code, el componente
 * ya utiliza las llamadas PUT y POST solicitadas.
 */

// --- CONFIGURACIÓN DE API ---
const API_URL = "https://taekwondo-system-api.onrender.com";
const api = axios.create({ baseURL: API_URL });

// Interceptor para incluir el token en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- FUENTE DE VERDAD PARA TEMAS ---
const LISTA_TEMAS = [
  { id: 'blue-ocean', color: '#2563eb', label: 'Azul', type: 'bubbles', icon: '🫧' },
  { id: 'rojo-dragon', color: '#c8102e', label: 'Rojo D', type: 'pulse', icon: '🔥' },
  { id: 'forest-dojo', color: '#059669', label: 'Verde', type: 'leaves', icon: '🍃' },
  { id: 'orange-tiger', color: '#f97316', label: 'Tigre', type: 'pulse', icon: '🔸' },
  { id: 'purple-ninja', color: '#a855f7', label: 'Ninja', type: 'spirit', icon: '🔮' },
  { id: 'brown-earth', color: '#78350f', label: 'Tierra', type: 'leaves', icon: '🍂' },
  { id: 'sakura-dojo', color: '#f472b6', label: 'Sakura', type: 'sakura', icon: '🌸' },
  { id: 'golden-sun', color: '#eab308', label: 'Sol', type: 'stars', icon: '☀️' },
  { id: 'light', color: '#3b82f6', label: 'Claro', type: 'float', icon: '•' },
  { id: 'dark-martial', color: '#3b82f6', label: 'Noche', type: 'fog', icon: '☁️' },
  { id: 'black-gold', color: '#d4af37', label: 'Oro/N', type: 'stars', icon: '✨' },
  { id: 'black-red', color: '#ef4444', label: 'Rojo/N', type: 'embers', icon: '🔥' },
  { id: 'black-green', color: '#22c55e', label: 'Verde/N', type: 'pulse', icon: '⚡' },
  { id: 'black-orange', color: '#f97316', label: 'Nara/N', type: 'embers', icon: '💥' },
  { id: 'midnight-void', color: '#6366f1', label: 'Abismo', type: 'fog', icon: '🌌' },
  { id: 'samurai-armor', color: '#991b1b', label: 'Honor', type: 'float', icon: '🛡️' },
  { id: 'obsidian-flame', color: '#ea580c', label: 'Magma', type: 'embers', icon: '🏮' },
  { id: 'royal-spirit', color: '#8b5cf6', label: 'Místico', type: 'spirit', icon: '🔱' },
  { id: 'desert-wind', color: '#d97706', label: 'Viento', type: 'fog', icon: '🌪️' },
  { id: 'cyan-glacier', color: '#06b6d4', label: 'Glaciar', type: 'bubbles', icon: '❄️' },
  { id: 'silver-moon', color: '#94a3b8', label: 'Luna', type: 'stars', icon: '🌙' },
];

// --- TIPOS ---
interface Escuela {
  idescuela: number;
  nombreescuela: string;
  direccion?: string;
  lema?: string;
  logo_url?: string;
  correo_escuela?: string;
  telefono_oficina?: string;
  color_paleta: string;
}

// --- CONTEXTO ---
const AuthContext = createContext<any>(null);
const useAuth = () => useContext(AuthContext);

// --- COMPONENTES ---

const GlobalThemeBackground = ({ theme }: { theme: string }) => {
  const particles = Array.from({ length: 25 });
  const themeData = LISTA_TEMAS.find(t => t.id === theme) || LISTA_TEMAS[0];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-[var(--color-background)] transition-colors duration-1000">
      <AnimatePresence mode="wait">
        <motion.div key={theme} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
          {particles.map((_, i) => (
            <motion.div
              key={i}
              className="absolute flex items-center justify-center opacity-20"
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, color: themeData.color }}
              animate={{
                y: themeData.type === 'embers' || themeData.type === 'spirit' ? [0, -300] : [0, -30, 0],
                opacity: [0.1, 0.4, 0.1],
                scale: [1, 1.3, 1],
                rotate: themeData.type === 'sakura' || themeData.type === 'leaves' ? [0, 360] : 0
              }}
              transition={{ duration: 7 + Math.random() * 10, repeat: Infinity, delay: Math.random() * 5 }}
            >
              <span style={{ fontSize: 14 + Math.random() * 14 }}>{themeData.icon}</span>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const VistaInicio = ({ stats }: { stats: any }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-5 rounded-[2.5rem] border border-[var(--color-border)] shadow-lg">
        <div className="p-2 w-fit rounded-xl mb-3 text-white bg-blue-500"><Users size={20} /></div>
        <p className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-widest leading-none mb-1">Alumnos</p>
        <p className="text-2xl font-black italic tracking-tighter text-[var(--color-text)]">{stats?.total_alumnos || 42}</p>
      </div>
      <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-5 rounded-[2.5rem] border border-[var(--color-border)] shadow-lg">
        <div className="p-2 w-fit rounded-xl mb-3 text-white bg-emerald-500"><DollarSign size={20} /></div>
        <p className="text-[10px] font-black uppercase text-[var(--color-text-muted)] tracking-widest leading-none mb-1">Pagos</p>
        <p className="text-2xl font-black italic tracking-tighter text-[var(--color-text)]">$1,200</p>
      </div>
    </div>
  </div>
);

const VistaPerfil = ({ escuela, setEscuela }: { escuela: Escuela, setEscuela: any }) => {
  const { setTheme } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!escuela.nombreescuela || escuela.nombreescuela.length < 3) newErrors.nombre = "Mín. 3 letras";
    if (escuela.correo_escuela && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(escuela.correo_escuela)) newErrors.correo = "Inválido";
    if (escuela.telefono_oficina && !/^\d{10}$/.test(escuela.telefono_oficina)) newErrors.telefono = "10 números";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      // LLAMADA REAL AL SERVICIO (PUT)
      await api.put('/escuelas/escuelas/mi-escuela', {
        nombreescuela: escuela.nombreescuela,
        direccion: escuela.direccion,
        lema: escuela.lema,
        correo_escuela: escuela.correo_escuela,
        telefono_oficina: escuela.telefono_oficina,
        color_paleta: escuela.color_paleta
      });
      setTheme(escuela.color_paleta);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error al guardar perfil:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // LLAMADA REAL AL SERVICIO (POST)
      const res = await api.post('/escuelas/escuelas/upload-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setEscuela({ ...escuela, logo_url: res.data.logo_url });
    } catch (error) {
      console.error("Error subiendo logo:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-[2rem] bg-[var(--color-card)] shadow-xl border-4 border-[var(--color-background)] overflow-hidden flex items-center justify-center">
            {uploading ? (
              <Loader2 className="animate-spin text-[var(--color-primary)]" />
            ) : escuela.logo_url ? (
              <img src={escuela.logo_url} className="w-full h-full object-cover" alt="Logo" />
            ) : (
              <School size={40} className="opacity-20" />
            )}
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 p-2 bg-[var(--color-primary)] text-white rounded-xl shadow-lg border-2 border-[var(--color-background)]"
          >
            <Camera size={14} />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
        </div>
        <h2 className="mt-2 text-lg font-black italic uppercase text-[var(--color-text)] tracking-tighter">{escuela.nombreescuela}</h2>
      </div>

      <div className="space-y-4">
        {/* Identidad */}
        <div className={`bg-[var(--color-card)]/80 backdrop-blur-xl p-5 rounded-[2.5rem] border shadow-lg ${errors.nombre ? 'border-red-500/50' : 'border-[var(--color-border)]'}`}>
          <div className="flex items-center justify-between mb-4 border-b border-[var(--color-border)]/30 pb-2">
            <div className="flex items-center gap-2 font-black uppercase text-[10px] text-[var(--color-text-muted)] tracking-widest"><Sparkles size={14} className="text-[var(--color-primary)]" /> Identidad</div>
            {errors.nombre && <span className="text-[8px] font-black text-red-500 uppercase">{errors.nombre}</span>}
          </div>
          <div className="space-y-3">
             <input 
              value={escuela.nombreescuela} 
              onChange={e => setEscuela({...escuela, nombreescuela: e.target.value})}
              className="w-full h-10 bg-[var(--color-background)]/50 rounded-xl px-4 font-bold text-xs outline-none focus:ring-1 focus:ring-[var(--color-primary)]/50 text-[var(--color-text)]" 
              placeholder="Nombre"
            />
            <input 
              value={escuela.lema || ''} 
              onChange={e => setEscuela({...escuela, lema: e.target.value})}
              className="w-full h-10 bg-[var(--color-background)]/50 rounded-xl px-4 font-bold text-xs outline-none focus:ring-1 focus:ring-[var(--color-primary)]/50 text-[var(--color-text)] italic" 
              placeholder="Lema"
            />
          </div>
        </div>

        {/* Contacto */}
        <div className={`bg-[var(--color-card)]/80 backdrop-blur-xl p-5 rounded-[2.5rem] border shadow-lg ${Object.keys(errors).some(k => ['correo', 'telefono'].includes(k)) ? 'border-red-500/50' : 'border-[var(--color-border)]'}`}>
          <div className="flex items-center gap-2 mb-4 border-b border-[var(--color-border)]/30 pb-2 font-black uppercase text-[10px] text-[var(--color-text-muted)] tracking-widest"><Globe size={14} className="text-[var(--color-primary)]" /> Contacto</div>
          <div className="space-y-3">
            <div className="relative"><MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-primary)]" /><input value={escuela.direccion || ''} onChange={e => setEscuela({...escuela, direccion: e.target.value})} className="w-full h-10 bg-[var(--color-background)]/50 rounded-xl pl-10 pr-4 font-bold text-xs outline-none text-[var(--color-text)]" placeholder="Dirección" /></div>
            <div className="grid grid-cols-2 gap-3">
              <input value={escuela.correo_escuela || ''} onChange={e => setEscuela({...escuela, correo_escuela: e.target.value})} className="h-10 bg-[var(--color-background)]/50 rounded-xl px-4 font-bold text-[10px] outline-none text-[var(--color-text)]" placeholder="E-mail" />
              <input value={escuela.telefono_oficina || ''} onChange={e => setEscuela({...escuela, telefono_oficina: e.target.value})} className="h-10 bg-[var(--color-background)]/50 rounded-xl px-4 font-bold text-[10px] outline-none text-[var(--color-text)]" placeholder="Teléfono" />
            </div>
          </div>
        </div>

        {/* Temas */}
        <div className="bg-[var(--color-card)]/80 backdrop-blur-xl p-5 rounded-[2.5rem] border border-[var(--color-border)] shadow-lg">
          <div className="flex items-center gap-2 mb-4 font-black uppercase text-[10px] text-[var(--color-text-muted)] tracking-widest"><Palette size={14} className="text-[var(--color-primary)]" /> Estética</div>
          <div className="grid grid-cols-5 gap-3 max-h-44 overflow-y-auto pr-2 custom-scrollbar">
            {LISTA_TEMAS.map(p => (
              <button 
                key={p.id} 
                onClick={() => {
                  setEscuela({...escuela, color_paleta: p.id});
                  setTheme(p.id);
                }}
                className="flex flex-col items-center gap-1 group"
              >
                <div className={`w-9 h-9 rounded-xl border-2 transition-all flex items-center justify-center relative ${escuela.color_paleta === p.id ? 'border-[var(--color-text)] scale-110 shadow-md ring-2 ring-[var(--color-primary)]/10' : 'border-transparent opacity-60'}`} style={{ backgroundColor: p.color }}>
                  {escuela.color_paleta === p.id && <Check size={10} className="text-white" strokeWidth={5} />}
                </div>
                <span className="text-[6px] font-black uppercase truncate w-full text-center text-[var(--color-text-muted)]">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button 
        onClick={handleSave} 
        disabled={saving || saved}
        className={`w-full h-14 font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-80 
          ${saved ? 'bg-emerald-500 text-white' : 'bg-[var(--color-text)] text-[var(--color-card)]'}`}
      >
        {saving ? <Loader2 className="animate-spin" size={20} /> : saved ? <><CheckCircle2 size={20} /> ¡SINCRONIZADO!</> : <><Save size={20} /> SINCRONIZAR DOJO</>}
      </button>
    </div>
  );
};

// --- ORQUESTADOR ---

export const EscuelaDashboard = () => {
  const [activeTab, setActiveTab] = useState('inicio');
  const [currentTheme, setCurrentTheme] = useState<string>('blue-ocean');
  const [escuelaInfo, setEscuelaInfo] = useState<Escuela | null>(null);

  useEffect(() => {
    // LLAMADA REAL (GET) al cargar el Dashboard
    api.get('/escuelas/escuelas/mi-escuela')
      .then(res => {
        setEscuelaInfo(res.data);
        if (res.data.color_paleta) {
          setCurrentTheme(res.data.color_paleta);
          document.documentElement.setAttribute('data-theme', res.data.color_paleta);
        }
      })
      .catch(console.error);
  }, []);

  const authValue = {
    logout: () => { localStorage.clear(); window.location.reload(); },
    setTheme: (t: string) => {
      setCurrentTheme(t);
      document.documentElement.setAttribute('data-theme', t);
    },
    currentTheme
  };

  return (
    <AuthContext.Provider value={authValue}>
      <div className="min-h-screen relative flex flex-col bg-[var(--color-background)] transition-colors duration-700 overflow-x-hidden">
        <GlobalThemeBackground theme={currentTheme} />

        <header className="sticky top-0 z-40 bg-[var(--color-background)]/70 backdrop-blur-xl px-6 pt-12 pb-4 border-b border-[var(--color-border)]/30">
          <div className="max-w-2xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <motion.div whileTap={{ scale: 0.9 }} className="w-10 h-10 rounded-2xl bg-[var(--color-card)] shadow-lg border-2 border-[var(--color-background)] overflow-hidden flex items-center justify-center">
                {escuelaInfo?.logo_url ? <img src={escuelaInfo.logo_url} className="w-full h-full object-cover" alt="Logo" /> : <School className="text-[var(--color-primary)]" size={20} />}
              </motion.div>
              <div className="flex flex-col">
                <p className="text-[7px] font-black uppercase tracking-[0.3em] text-[var(--color-primary)] leading-none mb-0.5 opacity-80">Gestor Dojo</p>
                <h2 className="text-sm font-black italic uppercase tracking-tighter text-[var(--color-text)] truncate max-w-[140px]">{escuelaInfo?.nombreescuela || "Cargando..."}</h2>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-2.5 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] relative active:scale-95 transition-all shadow-sm"><Bell size={18} /><span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-[var(--color-card)]"></span></button>
              <button onClick={authValue.logout} className="p-2.5 bg-red-500/10 rounded-xl text-red-500 active:scale-95 transition-all shadow-sm"><LogOut size={18} /></button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-2xl mx-auto w-full px-6 pt-6 pb-44">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
              {activeTab === 'inicio' && <VistaInicio stats={{}} />}
              {activeTab === 'perfil' && escuelaInfo && <VistaPerfil escuela={escuelaInfo} setEscuela={setEscuelaInfo} />}
              {(activeTab === 'alumnos' || activeTab === 'caja') && (
                <div className="p-12 text-center bg-[var(--color-card)]/40 rounded-[3rem] border-2 border-dashed border-[var(--color-border)] opacity-30 shadow-inner">
                  <Users size={32} className="mx-auto mb-2 text-[var(--color-text-muted)]" />
                  <p className="text-[9px] font-black uppercase italic tracking-widest text-[var(--color-text-muted)]">Módulo en construcción</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <div className="fixed bottom-0 left-0 right-0 p-6 pointer-events-none z-50">
          <nav className="max-w-sm mx-auto h-18 bg-[var(--color-card)]/80 backdrop-blur-2xl rounded-[2.2rem] border border-[var(--color-border)] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.4)] flex justify-around items-center px-4 pointer-events-auto transition-all">
            {[
              { id: 'inicio', icon: LayoutDashboard, label: 'Inicio' },
              { id: 'alumnos', icon: Users, label: 'Alumnos' },
              { id: 'caja', icon: DollarSign, label: 'Caja' },
              { id: 'perfil', icon: School, label: 'Perfil' }
            ].map((item) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className="relative flex flex-col items-center justify-center w-12 h-12 group transition-transform active:scale-90">
                {activeTab === item.id && <motion.div layoutId="tab" className="absolute inset-0 bg-[var(--color-primary)]/10 rounded-xl -z-10" transition={{ type: "spring", bounce: 0.3, duration: 0.5 }} />}
                <item.icon size={20} className={`transition-all duration-300 ${activeTab === item.id ? 'text-[var(--color-primary)] scale-110 drop-shadow-[0_0_8px_var(--color-primary)]' : 'text-[var(--color-text-muted)] opacity-50'}`} strokeWidth={2.5} />
                <span className={`text-[6px] font-black uppercase tracking-tighter mt-1 transition-all ${activeTab === item.id ? 'text-[var(--color-primary)] opacity-100' : 'opacity-0'}`}>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 10px; }
      `}</style>
    </AuthContext.Provider>
  );
};

export default EscuelaDashboard;