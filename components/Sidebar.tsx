"use client";

import React from 'react';
import { 
  Search, 
  UserSearch, 
  Eye, 
  ListChecks, 
  CreditCard, 
  UserCircle,
  Gavel
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, className }) => {
  const menuSections = [
    {
      title: "Consulta processo",
      items: [
        { id: 'search-number', label: 'Pelo número do processo', icon: Search },
        { id: 'search-person', label: 'Pelo CPF ou Nome', icon: UserSearch },
      ]
    },
    {
      title: "Monitoramento",
      items: [
        { id: 'monitor-new', label: 'Monitoramento de processo', icon: Eye },
        { id: 'monitor-list', label: 'Meus monitoramentos', icon: ListChecks },
      ]
    },
    {
      title: "Configurações",
      items: [
        { id: 'benefits', label: 'Plano de benefícios', icon: CreditCard },
        { id: 'account', label: 'Minha conta', icon: UserCircle },
      ]
    }
  ];

  return (
    <aside className={cn("w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-full z-20", className)}>
      <style>
        {`
          .custom-sidebar-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-sidebar-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-sidebar-scrollbar::-webkit-scrollbar-thumb {
            background: #1e293b;
            border-radius: 10px;
          }
          .custom-sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #dfa968;
          }
        `}
      </style>
      
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-2 justify-start">
          <div className="bg-[#dfa968] p-1.5 rounded-lg shrink-0">
            <Gavel className="w-5 h-5 text-slate-900" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">JurisClaro</span>
        </div>
        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest text-left">Busca de processo com IA</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-8 custom-sidebar-scrollbar">
        {menuSections.map((section) => (
          <div key={section.title} className="space-y-2">
            <h3 className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-left">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 justify-start text-left",
                    activeView === item.id
                      ? "bg-[#dfa968]/10 text-[#dfa968] font-medium"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                  )}
                >
                  <item.icon className={cn("w-4 h-4 shrink-0", activeView === item.id ? "text-[#dfa968]" : "text-slate-500")} />
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800 text-left">
          <p className="text-[10px] text-slate-500 mb-1">Logado como</p>
          <p className="text-xs font-medium text-slate-300 truncate">usuario@exemplo.com</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;