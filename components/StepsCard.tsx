"use client";

import React from 'react';
import { 
  Search, 
  MousePointerClick, 
  BellRing
} from 'lucide-react';
import { motion } from 'framer-motion';

const WhatsAppIcon = ({ size = 24, className = "" }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    className={className}
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

const StepsCard = () => {
  const steps = [
    { num: 1, title: "Faça uma busca", icon: Search, color: "text-[#1E1B4B]" },
    { num: 2, title: "Selecione o processo", icon: MousePointerClick, color: "text-[#1E1B4B]" },
    { num: 3, title: "Clique em monitorar", icon: BellRing, color: "text-[#1E1B4B]" },
    { num: 4, title: "Receba o Andamento", isWa: true, color: "text-[#25D366]" }
  ];

  return (
    <div className="w-full mb-8 relative px-4 md:px-10 py-6 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
      <style>{`
        .bg-dashed-line {
          background-image: linear-gradient(to right, #e5e7eb 50%, transparent 50%);
          background-size: 10px 1px;
          background-repeat: repeat-x;
        }
        .dark .bg-dashed-line {
          background-image: linear-gradient(to right, #334155 50%, transparent 50%);
        }
      `}</style>
      
      {/* Linha de Conexão no Fundo */}
      <div className="absolute top-[45%] left-12 right-12 h-[2px] bg-dashed-line -translate-y-1/2 z-0 hidden md:block" />
      
      {/* Partícula Animada */}
      <motion.div
        initial={{ left: '3rem', opacity: 0 }}
        animate={{ left: 'calc(100% - 3rem)', opacity: [0, 1, 1, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute top-[45%] w-3 h-3 bg-[#FFCC33] rounded-full shadow-[0_0_10px_#FFCC33] -translate-y-1/2 -translate-x-1/2 z-0 hidden md:block"
      />

      <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-0 relative z-10">
        {steps.map((step, index) => (
          <motion.div 
            key={step.num}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2, duration: 0.5 }}
            className="flex flex-col items-center gap-3 w-32"
          >
            {/* Ícone */}
            <div className="relative">
              <motion.div 
                whileHover={{ scale: 1.1 }}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-white dark:bg-slate-800 shadow-md border ${
                  step.isWa ? 'border-[#25D366] shadow-green-100 dark:shadow-green-900/10' : 'border-gray-100 dark:border-slate-700'
                }`}
              >
                {step.isWa ? (
                  <WhatsAppIcon size={28} className={step.color} />
                ) : (
                  <step.icon size={24} className={cn(step.color, "dark:text-white")} />
                )}
              </motion.div>

              {/* Badge numérico */}
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#FFCC33] text-[#1E1B4B] text-xs font-black flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm">
                {step.num}
              </div>

              {/* Efeito de brilho especial no passo do WhatsApp */}
              {step.isWa && (
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-[#25D366] rounded-2xl -z-10"
                />
              )}
            </div>

            {/* Texto */}
            <p className={`text-center text-sm font-bold leading-tight ${
              step.isWa ? 'text-[#25D366]' : 'text-gray-600 dark:text-slate-400'
            }`}>
              {step.title}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

import { cn } from '../lib/utils';
export default StepsCard;