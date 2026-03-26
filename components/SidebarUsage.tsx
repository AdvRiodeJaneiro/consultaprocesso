"use client";

import React, { useState, useEffect } from 'react';
import { useSearchLimit, LimitType } from '../hooks/useSearchLimit';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { DollarSign } from 'lucide-react';

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
      <div className="h-2 w-20 bg-white/10 rounded" />
      <div className="h-1.5 w-full bg-white/5 rounded-full" />
    </div>
  );

  const percentage = Math.min((current / limit) * 100, 100);
  const remainingPercentage = 100 - percentage;
  const isWarning = remainingPercentage < 20;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
        <span className="text-slate-400 truncate pr-2">{label}</span>
        <span className={cn(
          "shrink-0",
          isWarning ? "text-red-400" : "text-white"
        )}>
          {current} de {limit}
        </span>
      </div>
      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
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
  const updateTrigger = (profile?.current_month_searches || 0) + (profile?.current_month_process_consults || 0);

  return (
    <div className="px-0 py-2">
      <div className="bg-[#1E1B4B] rounded-2xl p-5 space-y-5 border border-white/5 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
            <DollarSign size={10} strokeWidth={3} />
          </div>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Seus Créditos</p>
          <div className="ml-auto size-1.5 rounded-full bg-primary animate-pulse" />
        </div>
        
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

        {!user && (
          <div className="pt-2 border-t border-white/5">
            <p className="text-[9px] font-bold text-slate-400 leading-tight">
              Crie uma conta para aumentar seus limites.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};