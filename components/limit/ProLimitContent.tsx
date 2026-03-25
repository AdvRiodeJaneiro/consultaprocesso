"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ChevronRight } from 'lucide-react';
import { GlowingButton } from '../GlowingButton';

interface ProLimitContentProps {
  onClose: () => void;
}

export const ProLimitContent: React.FC<ProLimitContentProps> = ({ onClose }) => {
  const navigate = useNavigate();

  const handleAction = () => {
    navigate('/planos');
    onClose();
  };

  return (
    <div className="text-center space-y-8 py-4">
      <div>
        <h3 className="text-2xl font-black text-deep-indigo dark:text-white leading-tight">
          Deseja fazer mais consultas?
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mt-3 text-sm font-medium leading-relaxed">
          Você atingiu o limite de consultas do seu plano. Faça um upgrade de plano para continuar.
        </p>
      </div>

      <div className="pt-4">
        <GlowingButton onClick={handleAction} className="w-full py-5">
          <div className="flex items-center justify-center gap-2">
            <Zap size={20} fill="currentColor" />
            <span className="text-lg">Quero fazer mais consultas</span>
            <ChevronRight size={20} />
          </div>
        </GlowingButton>

        <button 
          onClick={onClose}
          className="mt-6 text-slate-400 font-bold hover:text-slate-600 transition-all text-sm"
        >
          Voltar ao dashboard
        </button>
      </div>
    </div>
  );
};