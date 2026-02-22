import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, 
  Loader2, 
  ChevronRight, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles,
  Zap,
  Activity,
  ShieldCheck
} from 'lucide-react';
import axios from 'axios';

// Importación del logo desde la carpeta de assets (Asegúrate de que la ruta sea correcta en tu laptop)
import logoDojo from '../../assets/TKW_Logo_claro.png';

// Importaciones del sistema
import { useAuth } from '../../context/AuthContext';
import { themeService } from '../../services/theme.service';

/**
 * --- COMPONENTE: OrbesOscuros ---
 * Crea efectos visuales de esferas de luz que se mueven en el fondo oscuro.
 */
const OrbesOscuros = () => (
  <div className="fixed inset-0 overflow-hidden -z-10 bg-[#020617]">
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        x: [0, 100, 0],
        y: [0, 50, 0],
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute -top-[10%] -left-[10%] w-[70%] h-[70%] bg-[var(--color-primary)] opacity-[0.12] blur-[130px] rounded-full"
    />
    <motion.div
      animate={{
        scale: [1, 1.3, 1],
        x: [0, -80, 0],
        y: [0, -40, 0],
      }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      className="absolute -bottom-[20%] -right-[10%] w-[80%] h-[80%] bg-[var(--color-primary)] opacity-[0.15] blur-[160px] rounded-full"
    />
    <div className="absolute inset-0 bg-black/40" />
  </div>
);

export const LoginView = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ user: '', pass: '' });

  /**
   * Manejador del envío del formulario
   * Procesa la autenticación y sincroniza el tema institucional.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const params = new URLSearchParams();
    params.append('username', form.user);
    params.append('password', form.pass);

    try {
      const res = await axios.post("https://taekwondo-system-api.onrender.com/auth/login", params);
      
      // Aplicación inmediata del tema institucional para evitar saltos visuales al entrar
      const themeFromServer = res.data.tema || 'blue-ocean';
      if (themeService && typeof themeService.applyTheme === 'function') {
        themeService.applyTheme(themeFromServer);
      }

      // Delay controlado para mostrar la transición de "Iniciando Dojo"
      setTimeout(() => {
        login(res.data.access_token, res.data.user_role, form.user);
      }, 1200);

    } catch (err: any) {
      console.error("Login Error:", err);
      setLoading(false);
      const detail = err.response?.data?.detail || "Acceso denegado. Verifica tus credenciales.";
      alert(detail);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-8 relative overflow-hidden font-sans selection:bg-[var(--color-primary)] selection:text-white">
      <OrbesOscuros />

      {/* OVERLAY DE CARGA ANIMADO (Premium Dark) */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#020617] flex flex-col items-center justify-center gap-10"
          >
            <div className="relative">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                  rotate: 360
                }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                className="w-40 h-40 border-t-4 border-b-4 border-dashed border-[var(--color-primary)] rounded-full blur-sm"
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-[var(--color-primary)] to-black rounded-[2.8rem] flex items-center justify-center text-white shadow-[0_0_60px_-10px_var(--color-primary)] border border-white/10 overflow-hidden">
                  {/* Logo pulsante en la carga */}
                  <img 
                    src={logoDojo} 
                    alt="Cargando..." 
                    className="w-14 h-14 object-contain animate-pulse" 
                    onError={(e) => {
                      // Fallback si la imagen no carga
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </motion.div>
            </div>
            
            <div className="text-center space-y-4">
              <motion.h2 
                animate={{ opacity: [0.5, 1, 0.5], letterSpacing: ["0.4em", "0.6em", "0.4em"] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="text-xl font-black uppercase italic text-white"
              >
                Iniciando Dojo
              </motion.h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Sincronizando entorno técnico...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 50 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.8, cubicBezier: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md space-y-12 relative z-10"
      >
        {/* CABECERA CON LOGOTIPO DE ACTIVOS */}
        <div className="text-center space-y-8">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-32 h-32 bg-gradient-to-tr from-slate-900 via-[var(--color-primary)] to-slate-900 rounded-[3rem] mx-auto flex items-center justify-center shadow-[0_30px_70px_-15px_rgba(0,0,0,0.8)] border-2 border-white/5 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[var(--color-primary)] opacity-20 blur-2xl rounded-full" />
            {/* Imagen del Logo desde assets */}
            <img 
              src={logoDojo} 
              alt="Dojo Logo" 
              className="w-20 h-20 object-contain relative z-10 drop-shadow-2xl" 
              onError={(e) => {
                // Si el logo no existe en la ruta, mostramos un escudo genérico
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if(parent) {
                   parent.innerHTML += '<div class="text-white relative z-10"><svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg></div>';
                }
              }}
            />
          </motion.div>
          
          <div className="space-y-3">
            <h1 className="text-5xl font-black italic tracking-tighter text-white uppercase leading-none">
              TKW <span className="text-[var(--color-primary)] drop-shadow-[0_0_10px_var(--color-primary)] transition-colors duration-1000">SYSTEM</span>
            </h1>
            <div className="flex items-center justify-center gap-4 opacity-50">
              <div className="h-px w-6 bg-slate-700" />
              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-400 italic flex items-center gap-2">
                <Sparkles size={12} className="text-[var(--color-primary)]" /> Management 1.5
              </p>
              <div className="h-px w-6 bg-slate-700" />
            </div>
          </div>
        </div>

        {/* CONTENEDOR DE FORMULARIO OSCURO */}
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="bg-slate-900/40 backdrop-blur-3xl p-4 rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden transition-all duration-700">
            
            {/* Input de Usuario */}
            <div className="relative group p-2">
              <div className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[var(--color-primary)] transition-all duration-300">
                <User size={22} />
              </div>
              <input 
                type="text" 
                placeholder="Identificador" 
                required
                className="w-full h-18 pl-16 pr-8 bg-transparent outline-none font-bold text-white text-base placeholder:text-slate-700"
                onChange={e => setForm({...form, user: e.target.value})}
                autoComplete="username"
              />
            </div>
            
            <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent mx-10 opacity-50" />
            
            {/* Input de Contraseña */}
            <div className="relative group p-2">
              <div className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[var(--color-primary)] transition-all duration-300">
                <Lock size={22} />
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Contraseña" 
                required
                className="w-full h-18 pl-16 pr-16 bg-transparent outline-none font-bold text-white text-base placeholder:text-slate-700"
                onChange={e => setForm({...form, pass: e.target.value})}
                autoComplete="current-password"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors p-2"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* BOTÓN DE ACCIÓN PRINCIPAL */}
          <div className="space-y-6 px-2 text-center">
            <motion.button 
              whileHover={{ scale: 1.03, y: -4, boxShadow: "0 25px 50px -12px var(--color-primary)" }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={loading}
              className="w-full h-22 bg-[var(--color-primary)] text-white font-black rounded-[2.5rem] shadow-2xl flex justify-center items-center gap-4 active:brightness-125 transition-all overflow-hidden relative group"
            >
              {/* Efecto de barrido de luz en el botón */}
              <motion.div 
                animate={{ x: ['-100%', '200%'] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
              />
              
              <span className="relative z-10 text-lg uppercase italic tracking-tighter">Entrar al Sistema</span>
              <div className="relative z-10 p-2 bg-black/20 rounded-2xl group-hover:translate-x-1 transition-transform">
                <ChevronRight size={22} strokeWidth={3} />
              </div>
            </motion.button>
            
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">
              Terminal <span className="text-slate-500">Centralizada</span>
            </p>
          </div>
        </form>
      </motion.div>

      {/* Decoración lateral decorativa */}
      <div className="fixed bottom-10 left-10 text-slate-800 text-[8px] font-black uppercase tracking-[0.5em] [writing-mode:vertical-lr] rotate-180 opacity-20 pointer-events-none">
        DISCIPLINA • HONOR • RESPETO
      </div>
    </div>
  );
};

export default LoginView;