import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

/** * --- NOTA DE COMPATIBILIDAD ---
 * En tu proyecto local, estas importaciones funcionarán correctamente.
 * Para la previsualización del chat, hemos añadido lógica de respaldo.
 */
// @ts-ignore
import logoDojo from '../../assets/TKW_Logo_claro.png';
// @ts-ignore
import { useAuth } from '../../context/AuthContext';
// @ts-ignore
import { themeService } from '../../services/theme.service';

const OrbesOscuros = () => (
  <div className="fixed inset-0 overflow-hidden -z-10 bg-[#020617]">
    <motion.div
      animate={{ scale: [1, 1.2, 1], x: [0, 100, 0], y: [0, 50, 0] }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute -top-[10%] -left-[10%] w-[70%] h-[70%] bg-blue-600 opacity-[0.12] blur-[130px] rounded-full"
    />
    <motion.div
      animate={{ scale: [1, 1.3, 1], x: [0, -80, 0], y: [0, -40, 0] }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      className="absolute -bottom-[20%] -right-[10%] w-[80%] h-[80%] bg-blue-500 opacity-[0.15] blur-[160px] rounded-full"
    />
  </div>
);

export const LoginView = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ user: '', pass: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const params = new URLSearchParams();
    params.append('username', form.user);
    params.append('password', form.pass);

    try {
      const res = await axios.post("https://taekwondo-system-api.onrender.com/auth/login", params);
      
      // Aplicamos el tema del servidor si existe
      if (res.data.tema && themeService) {
        themeService.applyTheme(res.data.tema);
      }

      // 1. Guardamos la sesión en el estado global
      login(res.data.access_token, res.data.user_role, form.user);

      // 2. Esperamos un momento para mostrar la animación de "Iniciando Dojo"
      setTimeout(() => {
        // 3. NAVEGACIÓN CRÍTICA: Redirigimos al dashboard correspondiente
        const targetPath = res.data.user_role === 'Escuela' ? '/escuela' : '/';
        navigate(targetPath, { replace: true });
      }, 1800);

    } catch (err: any) {
      setLoading(false);
      const detail = err.response?.data?.detail || "Error de conexión o credenciales.";
      setError(detail);
      console.error("Login Error:", detail);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-8 relative overflow-hidden bg-[#020617]">
      <OrbesOscuros />

      {/* OVERLAY DE CARGA ANIMADO */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#020617] flex flex-col items-center justify-center gap-10"
          >
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3], rotate: 360 }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                className="w-40 h-40 border-t-4 border-b-4 border-dashed border-blue-500 rounded-full blur-sm"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-black rounded-[2.8rem] flex items-center justify-center shadow-[0_0_60px_-10px_rgba(37,99,235,0.5)] border border-white/10 overflow-hidden">
                  <img src={logoDojo || "/placeholder-logo.png"} alt="TKW" className="w-14 h-14 object-contain animate-pulse" />
                </div>
              </div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-black uppercase italic text-white tracking-[0.4em]">Iniciando Dojo</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Sincronizando entorno técnico...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-12 relative z-10"
      >
        <div className="text-center space-y-6">
          <div className="w-28 h-28 bg-gradient-to-tr from-slate-900 via-blue-600 to-slate-900 rounded-[2.5rem] mx-auto flex items-center justify-center shadow-2xl border border-white/10">
            <img src={logoDojo || "/placeholder-logo.png"} alt="Logo" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase">
            TKW <span className="text-blue-500">SYSTEM</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-xl p-2 rounded-[2.5rem] border border-white/5">
            <div className="relative group p-4">
              <User className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input 
                type="text" placeholder="Identificador" required
                className="w-full bg-transparent pl-12 pr-4 py-2 outline-none text-white font-bold"
                onChange={e => setForm({...form, user: e.target.value})}
              />
            </div>
            <div className="h-px bg-white/5 mx-8" />
            <div className="relative group p-4">
              <Lock className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input 
                type={showPassword ? "text" : "password"} placeholder="Contraseña" required
                className="w-full bg-transparent pl-12 pr-12 py-2 outline-none text-white font-bold"
                onChange={e => setForm({...form, pass: e.target.value})}
              />
              <button 
                type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-red-500 text-[10px] font-bold uppercase tracking-widest">
              {error}
            </motion.p>
          )}

          <motion.button 
            whileTap={{ scale: 0.98 }}
            type="submit" disabled={loading}
            className="w-full h-20 bg-blue-600 text-white font-black rounded-[2rem] shadow-xl flex justify-center items-center gap-3 uppercase italic tracking-tighter active:scale-95 transition-transform"
          >
            Entrar al Sistema <ChevronRight size={20} />
          </motion.button>
        </form>

        <p className="text-center text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em]">
          &copy; {new Date().getFullYear()} Management Elite <Sparkles size={10} className="inline ml-1" />
        </p>
      </motion.div>
    </div>
  );
};

export default LoginView;