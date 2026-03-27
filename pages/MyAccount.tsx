"use client";

import React from 'react';
import { 
  User, 
  CreditCard, 
  History, 
  Calendar, 
  CheckCircle2, 
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { cn } from '../lib/utils';

// Dados de Exemplo para Visualização (Mock Data)
const MOCK_CURRENT_PLAN = {
  name: 'Plano Pro Mensal',
  status: 'active', // active, inactive
  expiresAt: '2024-04-27T19:00:00Z',
  price: 49.90
};

const MOCK_HISTORY = [
  {
    id: '1',
    plan_name: 'Plano Pro Mensal',
    amount_paid: 49.90,
    payment_status: 'approved',
    date: '2024-03-27T10:30:00Z'
  },
  {
    id: '2',
    plan_name: 'Plano Básico',
    amount_paid: 29.90,
    payment_status: 'approved',
    date: '2024-02-27T14:15:00Z'
  },
  {
    id: '3',
    plan_name: 'Plano Pro Mensal',
    amount_paid: 49.90,
    payment_status: 'refunded',
    date: '2024-01-20T09:00:00Z'
  }
];

const MyAccount: React.FC = () => {
  return (
    <div className="p-6 max-w-5xl mx-auto pb-24 space-y-8">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-deep-indigo dark:text-white tracking-tight flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <User size={24} />
          </div>
          Minha Conta
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Gerencie suas informações e histórico de assinaturas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna da Esquerda: Plano Atual */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
            
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={14} className="text-primary" />
                Plano Atual
              </h3>
              <span className={cn(
                "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                MOCK_CURRENT_PLAN.status === 'active' 
                  ? "bg-emerald-500/10 text-emerald-500" 
                  : "bg-slate-500/10 text-slate-500"
              )}>
                {MOCK_CURRENT_PLAN.status === 'active' ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <div className="space-y-1 mb-8">
              <h2 className="text-2xl font-black text-deep-indigo dark:text-white">{MOCK_CURRENT_PLAN.name}</h2>
              <p className="text-slate-500 font-bold text-sm">R$ {MOCK_CURRENT_PLAN.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} /mês</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <Calendar size={18} className="text-slate-400" />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Renovação em</p>
                  <p className="text-xs font-bold text-deep-indigo dark:text-white">
                    {new Date(MOCK_CURRENT_PLAN.expiresAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              <button className="w-full py-4 bg-primary text-deep-indigo font-black rounded-2xl text-sm shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group">
                Gerenciar Assinatura
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="bg-deep-indigo rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
             <div className="absolute -right-4 -top-4 size-32 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all" />
             <Zap size={48} className="text-primary/40 mb-4" />
             <h4 className="text-lg font-black mb-2 leading-tight">Precisa de Ajuda?</h4>
             <p className="text-slate-300 text-sm font-medium mb-6">Fale com nosso suporte jurídico para tirar dúvidas sobre seu plano.</p>
             <button className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                Falar com Suporte
             </button>
          </div>
        </div>

        {/* Coluna da Direita: Histórico */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 px-2">
            <History size={18} className="text-primary" />
            <h2 className="text-xl font-black text-deep-indigo dark:text-white uppercase tracking-tight">Histórico de Cobrança</h2>
          </div>

          <div className="space-y-4">
            {MOCK_HISTORY.map((item) => (
              <div 
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-primary/30 transition-all shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "size-12 rounded-2xl flex items-center justify-center shrink-0",
                    item.payment_status === 'approved' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                  )}>
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-deep-indigo dark:text-white">{item.plan_name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {new Date(item.date).toLocaleDateString('pt-BR')} às {new Date(item.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <span className="size-1 rounded-full bg-slate-300" />
                      <div className="flex items-center gap-1">
                        {item.payment_status === 'approved' ? (
                          <>
                            <CheckCircle2 size={10} className="text-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-500 uppercase">Pago</span>
                          </>
                        ) : (
                          <>
                            <Clock size={10} className="text-red-500" />
                            <span className="text-[10px] font-bold text-red-500 uppercase">Estornado</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 sm:px-4">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Valor</p>
                    <p className="text-lg font-black text-deep-indigo dark:text-white">
                      R$ {item.amount_paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <button className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary transition-colors">
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            ))}

            {/* Estado Vazio (Caso não houvesse histórico) */}
            {MOCK_HISTORY.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <CreditCard size={48} className="text-slate-200 dark:text-slate-800 mb-4" />
                <h3 className="text-lg font-bold text-deep-indigo dark:text-white">Nenhum pagamento registrado</h3>
                <p className="text-slate-500 text-sm mt-1">Seu histórico de assinaturas PRO aparecerá aqui.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default MyAccount;
