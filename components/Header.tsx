"use client";

import React from 'react';
import { ChevronRight, MessageSquare, Bell } from 'lucide-react';
import { Button } from './ui/button';

interface HeaderProps {
  viewTitle: string;
  onWhatsappClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ viewTitle, onWhatsappClick }) => {
  return (
    <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-2 text-slate-400">
        <span className="text-sm font-medium">Dashboard</span>
        <ChevronRight size={14} className="mt-0.5" />
        <span className="text-sm font-bold text-deep-indigo dark:text-white">{viewTitle}</span>
      </div>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={onWhatsappClick}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm"
        >
          <MessageSquare size={18} />
          <span>Configurar WhatsApp</span>
        </button>
        
        <button className="size-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50">
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;