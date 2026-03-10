"use client";

import React from 'react';
import { X, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthForm } from './AuthForm';

interface LimitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LimitModal: React.FC<LimitModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#1E1B4B]/60 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden relative z-10 max-h-[90vh] overflow-y-auto scrollbar-hide"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-all"
            >
              <X size={20} />
            </button>

            <div className="p-8 md:p-10">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
                  <Lock size={32} />
                </div>
                <h3 className="text-2xl font-black text-deep-indigo dark:text-white leading-tight">
                  Deseja fazer mais consultas?
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
                  Você atingiu o limite de consultas gratuitas. Faça Login ou Cadastre-se para continuar buscando sem limites.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                 <AuthForm onSuccess={onClose} />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LimitModal;