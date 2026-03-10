import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ExternalLink, 
  Info,
  Calendar,
  User,
  MapPin,
  Scale,
  Loader2,
  Clock,
  History,
  MessageSquare
} from 'lucide-react';
import { useProcessDetails } from '../hooks/useProcessDetails';
import { ChatBubble } from '../components/ChatBubble';

const ProcessTimeline: React.FC = () => {
  const { cnj } = useParams();
  const navigate = useNavigate();
  const { processData, aiMessages, isLoading, error } = useProcessDetails(cnj);

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

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Top Header - Always Visible */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="size-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-primary transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded">Em Monitoramento</span>
                {isLoading ? (
                    <div className="w-24 h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                ) : (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {processData?.fontes?.[0]?.sigla || 'Tribunal'} • {processData?.fontes?.[0]?.capa?.area || 'Judiciário'}
                    </span>
                )}
              </div>
              <h2 className="text-xl font-black text-deep-indigo dark:text-white leading-none">{cnj}</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <a 
               href={`https://www.google.com/search?q=processo+${cnj}`} 
               target="_blank" 
               rel="noreferrer"
               className="flex items-center gap-2 text-slate-500 hover:text-primary text-xs font-bold px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
             >
                <ExternalLink size={14} />
                <span>Ver no Tribunal</span>
             </a>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        
        {/* LEFT COLUMN: AI Analysis */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-hide border-r border-slate-200 dark:border-slate-800">
           <div className="max-w-3xl mx-auto space-y-2 pb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-2xl bg-primary flex items-center justify-center text-deep-indigo">
                  <MessageSquare size={20} />
                </div>
                <h3 className="text-xl font-black text-deep-indigo dark:text-white">Explicação da JurisClaro</h3>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                   <div className="w-full h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
                   <div className="w-2/3 h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
                   <div className="w-full h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
                </div>
              ) : (
                aiMessages.map((msg) => (
                    <ChatBubble key={msg.id} message={msg} />
                ))
              )}
              
              {!isLoading && (
                <div className="mt-8 p-6 bg-slate-900 rounded-[32px] border border-slate-800 text-center">
                    <p className="text-slate-400 text-sm font-medium mb-4">Ainda tem dúvidas sobre essa análise?</p>
                    <button 
                    onClick={() => navigate('/')}
                    className="bg-primary/10 text-primary border border-primary/20 px-8 py-3 rounded-2xl text-sm font-bold hover:bg-primary hover:text-deep-indigo transition-all"
                    >
                    Falar com assistente no Chat
                    </button>
                </div>
              )}
           </div>
        </div>

        {/* RIGHT SIDEBAR: Info & Timeline */}
        <div className="w-full lg:w-[400px] bg-white dark:bg-slate-900 overflow-y-auto p-6 scrollbar-hide">
          <div className="space-y-8">
            
            {/* Metadata Section */}
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

            {/* Raw Timeline Section */}
            <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <History size={16} className="text-primary" />
                Histórico (Raw)
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