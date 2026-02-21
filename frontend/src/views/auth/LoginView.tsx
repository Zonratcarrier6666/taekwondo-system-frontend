import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Loader2, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

export const LoginView = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ user: '', pass: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const params = new URLSearchParams();
    params.append('username', form.user);
    params.append('password', form.pass);

    try {
      const res = await axios.post("https://taekwondo-system-api.onrender.com/auth/login", params);
      login(res.data.access_token, res.data.user_role, form.user);
    } catch (err) {
      alert("Credenciales incorrectas");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-8 bg-slate-50 dark:bg-[#020617]">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-12">
        <div className="text-center">
          <div className="w-24 h-24 bg-blue-600 rounded-[2rem] mx-auto flex items-center justify-center shadow-xl mb-6">
            <Award className="text-white" size={48} />
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter dark:text-white uppercase">TKW SYSTEM</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2 italic">Management 1.5</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-[#0f172a] p-2 rounded-[2.5rem] shadow-2xl border border-black/5 dark:border-white/5">
            <input 
               type="text" placeholder="Usuario" required
               className="w-full h-16 px-8 bg-transparent outline-none font-bold dark:text-white"
               onChange={e => setForm({...form, user: e.target.value})}
            />
            <div className="h-px bg-slate-100 dark:bg-white/5 mx-8" />
            <input 
               type="password" placeholder="Contraseña" required
               className="w-full h-16 px-8 bg-transparent outline-none font-bold dark:text-white"
               onChange={e => setForm({...form, pass: e.target.value})}
            />
          </div>
          <button 
            type="submit" disabled={loading}
            className="w-full h-20 bg-blue-600 text-white font-black rounded-3xl shadow-lg flex justify-center items-center gap-3 active:scale-95 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>ENTRAR AL SISTEMA <ChevronRight size={20} /></>}
          </button>
        </form>
      </motion.div>
    </div>
  );
};