"use client";

import React from 'react';
import { ChevronRight, MessageSquare, Bell, Menu } from 'lucide-react';
import { Button } from './ui/button';
import { useUIStore } from '../store/uiStore';

interface HeaderProps {
  viewTitle: string;
  onWhatsappClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ viewTitle, onWhatsappClick }) => {
  const { toggleSidebar } = useUIStore();

  return (
    <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleSidebar}
          className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2 text-slate-400 overflow-hidden">
          <span className="text-xs md:text-sm font-medium hidden sm:inline">Dashboard</span>
          <ChevronRight size={14} className="mt-0.5 hidden sm:inline" />
          <span className="text-xs md:text-sm font-bold text-deep-indigo dark:text-white truncate max-w-[150px] md:max-w-none">{viewTitle}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        <button 
          onClick={onWhatsappClick}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all shadow-sm"
        >
          <MessageSquare size={16} className="md:w-[18px] md:h-[18px]" />
          <span className="hidden xs:inline">Configurar WhatsApp</span>
          <span className="xs:hidden">WhatsApp</span>
        </button>
        
        <button className="size-9 md:size-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50">
          <Bell size={18} className="md:w-5 md:h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;