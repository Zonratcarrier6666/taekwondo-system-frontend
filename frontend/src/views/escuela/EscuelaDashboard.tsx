import React, { useState } from 'react';
import { LayoutDashboard, Users, DollarSign, School, LogOut, Palette } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PerfilConfiguracion } from './PerfilConfiguracion';

export const EscuelaDashboard = () => {
  const { user, logout, setTheme, currentTheme } = useAuth();
  const [activeTab, setActiveTab] = useState('inicio');

  return (
    <div className="min-h-screen bg-[var(--color-background)] px-6 pt-12 pb-32">
      <header className="flex justify-between items-center mb-12">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-primary)]">ADMIN ESCUELA</p>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter text-[var(--color-text)]">{user?.username}</h2>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setTheme(currentTheme === 'light' ? 'default' : 'light')} className="p-3 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] text-[var(--color-primary)] shadow-sm"><Palette size={20} /></button>
           <button onClick={logout} className="p-3 bg-red-500/10 rounded-2xl text-red-500"><LogOut size={20} /></button>
        </div>
      </header>

      <main>

        {activeTab === 'perfil' && <PerfilConfiguracion />}
        {activeTab === 'alumnos' && <div className="p-20 text-center opacity-30 italic font-black uppercase">Módulo Alumnos</div>}
        {activeTab === 'caja' && <div className="p-20 text-center opacity-30 italic font-black uppercase">Módulo Caja</div>}
      </main>

      <nav className="fixed bottom-6 left-6 right-6 h-20 bg-[var(--color-card)]/80 backdrop-blur-xl rounded-[2.5rem] border border-[var(--color-border)] shadow-2xl flex justify-around items-center px-4 z-50">
        {[
          { id: 'inicio', icon: LayoutDashboard, label: 'Inicio' },
          { id: 'alumnos', icon: Users, label: 'Alumnos' },
          { id: 'caja', icon: DollarSign, label: 'Caja' },
          { id: 'perfil', icon: School, label: 'Perfil' }
        ].map((item) => (
          <button 
            key={item.id} 
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === item.id ? 'text-[var(--color-primary)] scale-110' : 'text-[var(--color-text-muted)]'}`}
          >
            <item.icon size={24} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};