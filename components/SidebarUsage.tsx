"use client";

import React, { useState, useEffect } from 'react';
import { useSearchLimit, LimitType } from '../hooks/useSearchLimit';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface UsageItemProps {
  label: string;
  type: LimitType;
  updateTrigger: number;
}

const UsageItem: React.FC<UsageItemProps> = ({ label, type, updateTrigger }) => {
  const { getLimitForType, getCurrentUsage, loading } = useSearchLimit();
  const [current, setCurrent] = useState(0);
  const [limit, setLimit] = useState(0);

  useEffect(() => {
    const fetchUsage = async () => {
      const l = getLimitForType(type);
      const c = await getCurrentUsage(type);
      setLimit(l);
      setCurrent(c);
    };
    fetchUsage();
  }, [type, getLimitForType, getCurrentUsage, updateTrigger, loading]);

  if (loading) return (
    <div className="space-y-2 animate-pulse">
      <div className="h-2 w-20 bg-slate-100 dark:bg-slate-800 rounded" />
      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full" />
    </div>
  );

  const percentage = Math.min((current / limit) * 100, 100);
  // Invertendo para "esvaziar" conforme solicitado: a barra colorida representa o que RESTA
  const remainingPercentage = 100 - percentage;
  const isWarning = remainingPercentage < 20;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
        <span className="text-slate-400 truncate pr-2">{label}</span>
        <span className={cn(
          "shrink-0",
          isWarning ? "text-red-500" : "text-deep-indigo dark:text-white"
        )}>
          {current} de {limit}
        </span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-500 ease-out",
            isWarning ? "bg-red-500" : "bg-primary"
          )}
          style={{ width: `${remainingPercentage}%` }}
        />
      </div>
    </div>
  );
};

export const SidebarUsage: React.FC = () => {
  const { user, profile } = useAuth();
  // Usamos um contador simples baseado no perfil para forçar o componente de uso a se atualizar
  const updateTrigger = (profile?.current_month_searches || 0) + (profile?.current_month_process_consults || 0);

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="px-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Seu Limite</p>
        <div className="space-y-5">
          <UsageItem 
            label="N° de processo" 
            type="process" 
            updateTrigger={updateTrigger}
          />
          <UsageItem 
            label="CPF, CNPJ e Nome" 
            type="search" 
            updateTrigger={updateTrigger}
          />
          <UsageItem 
            label="Monitoramento Whatsapp" 
            type="monitoring" 
            updateTrigger={updateTrigger}
          />
        </div>
      </div>
      
      {!user && (
        <div className="mx-2 p-3 bg-primary/5 border border-primary/10 rounded-xl">
          <p className="text-[9px] font-bold text-primary leading-tight">
            Crie uma conta para aumentar seus limites e monitorar processos.
          </p>
        </div>
      )}
    </div>
  );
};