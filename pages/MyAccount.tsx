"use client";

import React, { useEffect } from 'react';
import { 
  User, 
  CreditCard, 
  History, 
  Calendar, 
  CheckCircle2, 
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

const SUPPORT_NUMBER = "5524999984056";
const SUPPORT_MESSAGE = encodeURIComponent("Olá vim através do consulta Processo e preciso de suporte");

const MyAccount: React.FC = () => {
  const { user, profile, sessionLoading } = useAuth();
  const { history, currentPlanDetails, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();

  // Proteção de Rota: Se não estiver logado após o carregamento da sessão, redireciona
  useEffect(() => {
    if (!sessionLoading && !user) {
      navigate('/auth', { state: { from: '/minha-conta' } });
    }
  }, [user, sessionLoading, navigate]);

  const isPro = profile?.subscription_status === 'active';

  // Enquanto verifica a sessão ou carrega os dados da assinatura
  if (sessionLoading || (user && subscriptionLoading)) {
    return (
      <div className="h-full flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">Carregando Perfil...</p>
        </div>
      </div>
    );
  }

  // Se não houver usuário, não renderiza o conteúdo (o useEffect cuidará do redirect)
  if (!user) return null;

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
                isPro 
                  ? "bg-emerald-500/10 text-emerald-500" 
                  : "bg-slate-500/10 text-slate-500"
              )}>
                {isPro ? 'Ativo' : 'Gratuito'}
              </span>
            </div>

            <div className="space-y-1 mb-8">
              <h2 className="text-2xl font-black text-deep-indigo dark:text-white">
                {isPro ? (currentPlanDetails?.name || 'Plano Pro') : 'Nenhum Plano'}
              </h2>
              {isPro && (
                <p className="text-slate-500 font-bold text-sm">
                  R$ {(currentPlanDetails?.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} /mês
                </p>
              )}
            </div>

            <div className="space-y-4">
              {profile?.subscription_expires_at && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <Calendar size={18} className="text-slate-400" />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {isPro ? 'Próxima Renovação' : 'Expirou em'}
                    </p>
                    <p className="text-xs font-bold text-deep-indigo dark:text-white">
                      {new Date(profile.subscription_expires_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              )}

              <a 
                href="/planos"
                className="w-full py-4 bg-primary text-deep-indigo font-black rounded-2xl text-sm shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group"
              >
                {isPro ? 'Alterar Assinatura' : 'Ver Planos Disponíveis'}
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          <div className="bg-deep-indigo rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
             <div className="absolute -right-4 -top-4 size-32 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all" />
             <Zap size={48} className="text-primary/40 mb-4" />
             <h4 className="text-lg font-black mb-2 leading-tight">Precisa de Ajuda?</h4>
             <p className="text-slate-300 text-sm font-medium mb-6">Fale com nosso suporte jurídico para tirar dúvidas sobre seu plano.</p>
             <a 
              href={`https://wa.me/${SUPPORT_NUMBER}?text=${SUPPORT_MESSAGE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center"
             >
                Falar com Suporte
             </a>
          </div>
        </div>

        {/* Coluna da Direita: Histórico */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 px-2">
            <History size={18} className="text-primary" />
            <h2 className="text-xl font-black text-deep-indigo dark:text-white uppercase tracking-tight">Histórico de Cobrança</h2>
          </div>

          <div className="space-y-4">
            {history.length > 0 ? (
              history.map((item) => (
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
                          {new Date(item.created_at).toLocaleDateString('pt-BR')} às {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <span className="size-1 rounded-full bg-slate-300" />
                        <div className="flex items-center gap-1">
                          {item.payment_status === 'approved' ? (
                            <>
                              <CheckCircle2 size={10} className="text-emerald-500" />
                              <span className="text-[10px] font-bold text-emerald-500 uppercase">Pago</span>
                            </>
                          ) : item.payment_status === 'refunded' ? (
                            <>
                              <Clock size={10} className="text-red-500" />
                              <span className="text-[10px] font-bold text-red-500 uppercase">Estornado</span>
                            </>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{item.payment_status}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:px-4">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Valor</p>
                      <p className="text-lg font-black text-deep-indigo dark:text-white">
                        R$ {Number(item.amount_paid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
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