"use client";

import React from 'react';
import { AuthForm } from '../AuthForm';

interface GuestLimitContentProps {
  onSuccess: () => void;
}

export const GuestLimitContent: React.FC<GuestLimitContentProps> = ({ onSuccess }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-black text-deep-indigo dark:text-white leading-tight">
          Deseja fazer mais consultas?
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
          Você atingiu o limite de consultas gratuitas. Faça Login ou Cadastre-se para continuar buscando sem limites.
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
        <AuthForm onSuccess={onSuccess} />
      </div>
    </div>
  );
};