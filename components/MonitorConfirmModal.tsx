"use client";

import React from 'react';
import { X, Bell, Gavel } from 'lucide-react';
import { Button } from './ui/button';
import { EscavadorProcesso } from '../types';

interface MonitorConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  process: EscavadorProcesso | null;
}

const MonitorConfirmModal: React.FC<MonitorConfirmModalProps> = ({ isOpen, onClose, onConfirm, process }) => {
  if (!isOpen || !process) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-secondary border border-border rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-8 pb-4 flex justify-end">
           <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-8 pb-8 text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
             <Bell className="w-10 h-10 text-primary animate-pulse" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white tracking-tight">Confirmar Monitoramento?</h3>
            <p className="text-slate-400 text-sm px-4">
              Você receberá uma mensagem no WhatsApp sempre que houver uma nova movimentação neste processo.
            </p>
          </div>

          <div className="bg-card/50 rounded-2xl p-5 border border-border text-left space-y-4">
             <div className="flex items-start gap-3">
                <Gavel className="w-5 h-5 text-slate-400 mt-1 shrink-0" />
                <div className="space-y-1 overflow-hidden">
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Processo CNJ</p>
                   <p className="text-sm font-bold text-white font-mono break-all">{process.numero_cnj}</p>
                </div>
             </div>
             
             <div className="space-y-1 pl-8 border-l border-border">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Partes</p>
                <p className="text-xs text-slate-300 line-clamp-2">
                   {process.titulo_polo_ativo || 'N/A'} vs {process.titulo_polo_passivo || 'N/A'}
                </p>
             </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button 
                onClick={onConfirm}
                className="w-full bg-primary hover:bg-primary/90 text-secondary font-bold py-7 text-lg rounded-2xl shadow-xl shadow-primary/10"
            >
                Confirmar monitoramento
            </Button>
            <button 
                onClick={onClose}
                className="w-full text-slate-500 hover:text-white transition-colors text-sm font-medium py-2"
            >
                Agora não, cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitorConfirmModal;