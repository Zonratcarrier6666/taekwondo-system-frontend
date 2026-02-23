// ============================================================
//  src/components/common/GlobalNavbar.tsx
// ============================================================

import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, DollarSign, School,
  ShieldCheck, Trophy, GraduationCap, Swords,
  Settings, UserPlus, BarChart3
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: any;
}

const NAV_ITEMS_BY_ROLE: Record<string, NavItem[]> = {
  Escuela: [
    { id: 'inicio',      label: 'Inicio',      icon: LayoutDashboard },
    { id: 'alumnos',     label: 'Alumnos',     icon: Users },
    { id: 'profesores',  label: 'Profesores',  icon: GraduationCap },
    { id: 'torneos',     label: 'Torneos',     icon: Trophy },
    { id: 'caja',        label: 'Caja',        icon: DollarSign },
    { id: 'perfil',      label: 'Perfil',      icon: School },
  ],
  SuperAdmin: [
    { id: 'dashboard',   label: 'Panel',       icon: LayoutDashboard },
    { id: 'torneos',     label: 'Torneos',     icon: Trophy },
    { id: 'usuarios',    label: 'Usuarios',    icon: UserPlus },
    { id: 'finanzas',    label: 'Finanzas',    icon: DollarSign },
    { id: 'combates',    label: 'Combates',    icon: Swords },
    { id: 'config',      label: 'Config',      icon: Settings },
  ],
  Profesor: [
    { id: 'inicio',      label: 'Inicio',      icon: LayoutDashboard },
    { id: 'pagos',       label: 'Pagos',       icon: DollarSign },
    { id: 'alumnos',     label: 'Alumnos',     icon: Users },
    { id: 'examenes',    label: 'Exámenes',    icon: GraduationCap },
    { id: 'torneos',     label: 'Torneos',     icon: Trophy },
  ],
};

interface GlobalNavbarProps {
  activeTab: string;
  onTabChange: (id: string) => void;
  role: 'Escuela' | 'SuperAdmin' | 'Profesor';
}

export const GlobalNavbar: React.FC<GlobalNavbarProps> = ({ activeTab, onTabChange, role }) => {
  const items = NAV_ITEMS_BY_ROLE[role] || [];

  return (
    <div className="fixed bottom-0 left-0 right-0 p-6 pointer-events-none z-50">
      <nav className="max-w-sm mx-auto h-18 bg-[var(--color-card)]/80 backdrop-blur-2xl rounded-[2.2rem] border border-[var(--color-border)] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.4)] flex justify-around items-center px-4 pointer-events-auto transition-all">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className="relative flex flex-col items-center justify-center w-12 h-12 group transition-transform active:scale-90"
          >
            {activeTab === item.id && (
              <motion.div
                layoutId="navTabIndicator"
                className="absolute inset-0 bg-[var(--color-primary)]/10 rounded-xl -z-10"
                transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
              />
            )}
            <item.icon
              size={20}
              className={`transition-all duration-300 ${
                activeTab === item.id
                  ? 'text-[var(--color-primary)] scale-110 drop-shadow-[0_0_8px_var(--color-primary)]'
                  : 'text-[var(--color-text-muted)] opacity-50'
              }`}
              strokeWidth={activeTab === item.id ? 2.5 : 2}
            />
            <span className={`text-[6px] font-black uppercase tracking-tighter mt-1 transition-all ${
              activeTab === item.id ? 'text-[var(--color-primary)] opacity-100' : 'opacity-0'
            }`}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default GlobalNavbar;