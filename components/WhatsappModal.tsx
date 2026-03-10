"use client";

import React, { useState, useEffect } from 'react';
import { X, Phone, Check } from 'lucide-react';
import { Button } from './ui/button';

interface WhatsappModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (phone: string) => void;
  initialValue?: string;
}

const WhatsappModal: React.FC<WhatsappModalProps> = ({ isOpen, onClose, onSave, initialValue = '' }) => {
  const [phone, setPhone] = useState(initialValue);

  useEffect(() => {
    if (isOpen) {
      setPhone(initialValue);
    }
  }, [isOpen, initialValue]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      if (numbers.length > 2) {
        if (numbers.length > 7) {
            return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
        }
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
      }
      return numbers;
    }
    return value.slice(0, 15);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const digitsOnly = rawValue.replace(/\D/g, '');
    if (digitsOnly.length <= 11) {
        setPhone(formatPhone(digitsOnly));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <div className="bg-green-500/10 p-2 rounded-lg">
                <Phone className="w-5 h-5 text-green-500" />
             </div>
             <h3 className="text-xl font-bold text-white">Configurar WhatsApp</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-slate-400 text-sm leading-relaxed">
            Informe o número de WhatsApp que receberá as notificações de movimentações dos processos monitorados.
          </p>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Número do WhatsApp</label>
            <div className="relative">
                <input
                  type="text"
                  value={phone}
                  onChange={handleChange}
                  placeholder="(99) 99999-9999"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#dfa968] focus:border-transparent transition-all text-lg tracking-wide"
                />
            </div>
            <p className="text-[10px] text-slate-500 italic">Exemplo: (21) 98888-7777</p>
          </div>
        </div>

        <div className="p-6 bg-slate-900/50 border-t border-slate-800 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 py-6 rounded-xl font-semibold">
            Cancelar
          </Button>
          <Button 
            onClick={() => onSave(phone)} 
            disabled={phone.replace(/\D/g, '').length < 10}
            className="flex-1 bg-[#dfa968] hover:bg-[#c99557] text-slate-900 font-bold py-6 rounded-xl shadow-lg shadow-[#dfa968]/20"
          >
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WhatsappModal;
