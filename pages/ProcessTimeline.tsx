
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Gavel, 
  Clock, 
  CheckCircle2, 
  Circle, 
  ExternalLink, 
  Info,
  Calendar,
  User,
  MapPin,
  Scale
} from 'lucide-react';
import { cn } from '../lib/utils';

// Dados fake para a UI enquanto não integramos com o histórico real do Escavador
const MOCK_MOVEMENTS = [
  { id: 1, date: '15/05/2024', time: '14:30', title: 'Concluso para Despacho', description: 'O processo foi enviado para a mesa do juiz para análise e decisão.', status: 'completed' },
  { id: 2, date: '12/05/2024', time: '09:15', title: 'Juntada de Petição de Manifestação', description: 'A parte autora apresentou manifestação sobre os documentos juntados pelo réu.', status: 'completed' },
  { id: 3, date: '10/05/2024', time: '16:45', title: 'Publicado no Diário Oficial', description: 'Publicação de despacho referente à dilação de prazo para as partes.', status: 'completed' },
  { id: 4, date: '05/05/2024', time: '11:00', title: 'Expedido Mandado de Citação', description: 'Mandado enviado para cumprimento via Oficial de Justiça.', status: 'completed' },
  { id: 5, date: '01/05/2024', time: '08:00', title: 'Processo Distribuído', description: 'Distribuição automática para a 2ª Vara Cível da Comarca.', status: 'completed' },
];

const ProcessTimeline: React.FC = () => {
  const { cnj } = useParams();
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto">
      {/* Top Header/Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="size-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-primary hover:bg-primary/10 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded">Em Andamento</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TJSP • Cível</span>
              </div>
              <h2 className="text-xl font-black text-deep-indigo dark:text-white leading-none">{cnj}</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button className="flex items-center gap-2 text-slate-500 hover:text-primary text-xs font-bold px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 transition-all">
                <ExternalLink size={14} />
                <span>Ver no Tribunal</span>
             </button>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="text-primary" size={20} />
            <h3 className="text-xl font-bold text-deep-indigo dark:text-white">Linha do Tempo</h3>
          </div>

          <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary before:via-slate-200 before:to-transparent">
            {MOCK_MOVEMENTS.map((movement, idx) => (
              <div key={movement.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                {/* Dot */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white dark:border-slate-900 bg-slate-50 dark:bg-slate-800 text-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 -translate-x-1/2 transition-transform group-hover:scale-110 z-10">
                  {idx === 0 ? <CheckCircle2 size={18} className="fill-primary text-white" /> : <Circle size={10} className="fill-primary" />}
                </div>
                
                {/* Content Card */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all ml-12 md:ml-0">
                  <div className="flex items-center justify-between space-x-2 mb-1">
                    <div className="font-black text-deep-indigo dark:text-white text-base">{movement.title}</div>
                    <time className="font-mono text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded uppercase">{movement.date}</time>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
                    {movement.description}
                  </p>
                  <div className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                    <Clock size={10} />
                    Registrado às {movement.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm sticky top-32">
            <h3 className="text-lg font-bold text-deep-indigo dark:text-white mb-6 flex items-center gap-2">
              <Info size={18} className="text-primary" />
              Detalhes do Processo
            </h3>

            <div className="space-y-6">
              <DetailItem 
                icon={<Scale size={16} />} 
                label="Assunto Principal" 
                value="Indenização por Dano Moral" 
              />
              <DetailItem 
                icon={<User size={16} />} 
                label="Polo Ativo" 
                value="Ricardo de Oliveira Silva" 
              />
              <DetailItem 
                icon={<User size={16} />} 
                label="Polo Passivo" 
                value="Banco Brasileiro de Crédito S.A." 
              />
              <DetailItem 
                icon={<Calendar size={16} />} 
                label="Data de Início" 
                value="01/05/2024" 
              />
              <DetailItem 
                icon={<MapPin size={16} />} 
                label="Órgão Julgador" 
                value="2ª Vara Cível - Foro Central de São Paulo" 
              />
            </div>

            <div className="mt-8 p-4 bg-primary/5 rounded-2xl border border-primary/10">
               <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Monitoramento Ativo</p>
               <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                 Este processo está sendo verificado semanalmente. Notificações via WhatsApp serão enviadas para: 
                 <span className="font-bold text-deep-indigo dark:text-white block mt-1">(11) 99887-7665</span>
               </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div className="flex gap-4">
    <div className="size-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-bold text-deep-indigo dark:text-white leading-snug">{value}</p>
    </div>
  </div>
);

export default ProcessTimeline;
