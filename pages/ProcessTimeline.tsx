import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Info,
  Calendar,
  User,
  MapPin,
  Scale,
  History,
  MessageSquare,
  ChevronUp,
  X
} from 'lucide-react';
import { useProcessDetails } from '../hooks/useProcessDetails';
import { ChatBubble } from '../components/ChatBubble';
import { motion, AnimatePresence } from 'framer-motion';

const ProcessTimeline: React.FC = () => {
  const { cnj } = useParams();
  const navigate = useNavigate();
  const { processData, aiMessages, isLoading, error } = useProcessDetails(cnj);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  if (error && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-950">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-red-100 max-w-md">
           <h2 className="text-xl font-bold text-red-500 mb-2">Ops! Algo deu errado</h2>
           <p className="text-slate-500 mb-6">{error || "Não conseguimos carregar os dados deste processo."}</p>
           <button onClick={() => navigate(-1)} className="bg-primary text-deep-indigo px-6 py-2 rounded-xl font-bold">Voltar</button>
        </div>
      </div>
    );
  }

  const InfoContent = () => (
    <div className="space-y-8">
        <div>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Info size={16} className="text-primary" />
            Dados do Processo
            </h3>
            <div className="space-y-5">
            {isLoading ? (
                [1,2,3,4,5].map(i => (
                    <div key={i} className="flex gap-4 animate-pulse">
                        <div className="size-9 rounded-xl bg-slate-100 dark:bg-slate-800" />
                        <div className="flex-1 space-y-2 py-1">
                            <div className="w-16 h-2 bg-slate-100 dark:bg-slate-800 rounded" />
                            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded" />
                        </div>
                    </div>
                ))
            ) : (
                <>
                    <DetailItem icon={<Scale size={16} />} label="Assunto" value={processData?.fontes?.[0]?.capa?.assunto || "Não informado"} />
                    <DetailItem icon={<User size={16} />} label="Polo Ativo" value={processData?.titulo_polo_ativo || "Não informado"} />
                    <DetailItem icon={<User size={16} />} label="Polo Passivo" value={processData?.titulo_polo_passivo || "Não informado"} />
                    <DetailItem icon={<Calendar size={16} />} label="Data de Início" value={processData?.data_inicio || "N/A"} />
                    <DetailItem icon={<MapPin size={16} />} label="Órgão Julgador" value={processData?.fontes?.[0]?.capa?.orgao_julgador || "Não informado"} />
                </>
            )}
            </div>
        </div>

        <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <History size={16} className="text-primary" />
            Histórico
            </h3>
            
            <div className="space-y-4">
            {isLoading ? (
                [1,2,3].map(i => (
                    <div key={i} className="pl-6 border-l-2 border-slate-100 dark:border-slate-800 animate-pulse pb-6">
                        <div className="w-20 h-2 bg-slate-100 dark:bg-slate-800 rounded mb-2" />
                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded mb-2" />
                        <div className="w-2/3 h-2 bg-slate-100 dark:bg-slate-800 rounded" />
                    </div>
                ))
            ) : (
                processData?.movimentacoes?.slice(0, 10).map((move, idx) => (
                <div key={idx} className="relative pl-6 pb-6 border-l-2 border-slate-100 dark:border-slate-800 last:border-0">
                    <div className="absolute left-[-9px] top-0 size-4 rounded-full bg-white dark:bg-slate-900 border-2 border-primary" />
                    <div className="flex flex-col">
                    <time className="text-[10px] font-black text-primary uppercase mb-1">{move.data}</time>
                    <p className="text-xs font-bold text-deep-indigo dark:text-white mb-1 leading-tight">{move.tipo}</p>
                    <p className="text-[10px] text-slate-500 line-clamp-2">{move.conteudo}</p>
                    </div>
                </div>
                ))
            )}
            </div>
        </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 md:p-6 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto w-full flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="size-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-primary transition-all shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5 md:mb-1">
              <span className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded shrink-0">Monitorado</span>
              <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                {processData?.fontes?.[0]?.sigla || 'Justiça'}
              </span>
            </div>
            <h2 className="text-base md:text-xl font-black text-deep-indigo dark:text-white leading-none truncate">{cnj}</h2>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row relative">
        
        {/* MAIN: AI Analysis */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide lg:border-r border-slate-200 dark:border-slate-800">
           <div className="max-w-3xl mx-auto space-y-2 pb-24 md:pb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-2xl bg-primary flex items-center justify-center text-deep-indigo">
                  <MessageSquare size={20} />
                </div>
                <h3 className="text-lg md:text-xl font-black text-deep-indigo dark:text-white">Explicação da JurisClaro</h3>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                   <div className="w-full h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
                   <div className="w-2/3 h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
                </div>
              ) : (
                aiMessages.map((msg) => (
                    <ChatBubble key={msg.id} message={msg} />
                ))
              )}
           </div>
        </div>

        {/* SIDEBAR: Desktop Only */}
        <div className="hidden lg:block w-[400px] bg-white dark:bg-slate-900 overflow-y-auto p-6 scrollbar-hide">
          <InfoContent />
        </div>

        {/* BOTTOM SHEET: Mobile Only */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[30]">
          <AnimatePresence>
            {isSheetOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSheetOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
              />
            )}
          </AnimatePresence>

          <motion.div
            initial={{ y: "calc(100% - 70px)" }}
            animate={{ y: isSheetOpen ? 0 : "calc(100% - 70px)" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="bg-white dark:bg-slate-900 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] border-t border-slate-200 dark:border-slate-800 z-40 relative flex flex-col max-h-[85vh]"
          >
            {/* Handle / Header */}
            <div 
              onClick={() => setIsSheetOpen(!isSheetOpen)}
              className="p-4 flex flex-col items-center gap-2 cursor-pointer"
            >
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
              <div className="flex items-center justify-between w-full px-4">
                <div className="flex items-center gap-2 text-primary">
                  <Info size={18} />
                  <span className="text-sm font-black uppercase tracking-widest">Ver Dados & Histórico</span>
                </div>
                {isSheetOpen ? <X size={20} className="text-slate-400" /> : <ChevronUp size={20} className="text-primary animate-bounce" />}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 pt-2 scrollbar-hide">
              <InfoContent />
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
};

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div className="flex gap-4">
    <div className="size-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 border border-slate-100 dark:border-slate-700">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-xs font-bold text-deep-indigo dark:text-white leading-tight break-words">{value}</p>
    </div>
  </div>
);

export default ProcessTimeline;