import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color }) => (
  <motion.div 
    whileTap={{ scale: 0.95 }} 
    className="bg-[var(--color-card)] p-5 rounded-[2.5rem] border border-[var(--color-border)] shadow-xl relative overflow-hidden"
  >
    <div className={`w-10 h-10 rounded-2xl ${color} flex items-center justify-center text-white mb-3 shadow-lg`}>
      <Icon size={20} />
    </div>
    <h4 className="text-2xl font-black italic text-[var(--color-text)]">{value}</h4>
    <p className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">{label}</p>
  </motion.div>
);