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
    <aside className={cn("w-64 bg-background border-r border-border flex flex-col h-full z-20", className)}>
      <style>
        {`
          .custom-sidebar-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-sidebar-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-sidebar-scrollbar::-webkit-scrollbar-thumb {
            background: hsl(var(--card));
            border-radius: 10px;
          }
          .custom-sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
            background: hsl(var(--primary));
          }
        `}
      </style>
      
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-2 justify-start">
          <div className="bg-primary p-1.5 rounded-lg shrink-0">
            <Gavel className="w-5 h-5 text-secondary" />
          </div>
          <span className="font-bold text-lg text-foreground tracking-tight">JurisClaro</span>
        </div>
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest text-left">Busca de processo com IA</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-8 custom-sidebar-scrollbar">
        {menuSections.map((section) => (
          <div key={section.title} className="space-y-2">
            <h3 className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-left">
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
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-4 h-4 shrink-0", activeView === item.id ? "text-primary" : "text-muted-foreground")} />
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="bg-secondary/50 rounded-xl p-3 border border-border text-left">
          <p className="text-[10px] text-muted-foreground mb-1">Logado como</p>
          <p className="text-xs font-medium text-slate-300 truncate">usuario@exemplo.com</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;