import React from 'react';
import { Message } from '../types';
import { ShiningText } from './ui/shining-text';
import { WhatsappButtons } from './WhatsappButtons';
import { Bell, ArrowRight, Sparkles } from 'lucide-react';

interface ChatBubbleProps {
  message: Message;
  onMonitorClick?: () => void;
  onExplainClick?: () => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onMonitorClick, onExplainClick }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-card text-primary text-xs px-3 py-1 rounded-full border border-border">
          {message.content}
        </div>
      </div>
    );
  }

  // Handle Explain with AI Suggestion Card
  if (message.isExplainAi) {
    return (
      <div className="flex w-full mb-6 justify-start">
        <div className="max-w-[85%] md:max-w-[75%] rounded-2xl p-6 shadow-xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-purple-500/30 rounded-bl-none overflow-hidden relative group">
           {/* Animated Background Effect */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-purple-500/20 transition-all duration-700" />
           
           <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                 <div className="size-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/50">
                    <Sparkles size={20} className="animate-pulse" />
                 </div>
                 <h4 className="text-white font-black text-lg leading-tight">Traduzir com IA</h4>
              </div>
              
              <p className="text-slate-300 text-sm mb-6 leading-relaxed font-medium">
                {message.content}
              </p>
              
              <button
                onClick={onExplainClick}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-purple-900/40"
              >
                <span>Explicar com IA Jurídica</span>
                <Sparkles size={18} />
              </button>
           </div>
        </div>
      </div>
    );
  }

  // Handle Monitor Suggestion Card
  if (message.isMonitorSuggestion) {
    return (
      <div className="flex w-full mb-6 justify-start">
        <div className="max-w-[85%] md:max-w-[75%] rounded-2xl p-6 shadow-xl bg-slate-900 border border-primary/30 rounded-bl-none overflow-hidden relative group">
           {/* Animated Background Effect */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
           
           <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                 <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-deep-indigo shadow-lg shadow-primary/20">
                    <Bell size={20} className="animate-pulse" />
                 </div>
                 <h4 className="text-white font-black text-lg leading-tight">Acompanhe seu processo</h4>
              </div>
              
              <p className="text-slate-300 text-sm mb-6 leading-relaxed font-medium">
                {message.content}
              </p>
              
              <button
                onClick={onMonitorClick}
                className="w-full bg-primary hover:bg-primary/90 text-deep-indigo font-black py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/20"
              >
                <span>Sim quero</span>
                <ArrowRight size={18} />
              </button>
           </div>
        </div>
      </div>
    );
  }

  // Handle Special Contact Bubble
  if (message.isContact) {
    return (
      <div className="flex w-full mb-6 justify-start">
        <div className="max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-5 shadow-sm bg-card border border-primary/30 rounded-bl-none">
           <p className="mb-4 font-semibold text-foreground/90">{message.content}</p>
           <WhatsappButtons />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4 shadow-sm ${
          isUser
            ? 'bg-primary text-secondary rounded-br-none font-medium'
            : 'bg-card text-foreground border border-border rounded-bl-none'
        }`}
      >
        {message.isLoading ? (
          <div className="flex items-center min-h-6">
             <ShiningText text={message.content || "Carregando..."} />
          </div>
        ) : (
          <div className={`prose prose-sm max-w-none ${!isUser && 'text-foreground'}`}>
             <div className="whitespace-pre-wrap leading-relaxed">
                {message.content.split('\n').map((line, i) => {
                    // Adaptative Heading Colors
                    if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-black mt-2 mb-1 text-foreground dark:text-white">{line.replace('## ', '')}</h2>;
                    if (line.startsWith('### ')) return <h3 key={i} className="text-md font-black mt-3 mb-2 text-primary uppercase tracking-wide">{line.replace('### ', '')}</h3>;
                    if (line.startsWith('- ')) return <li key={i} className="ml-4">{line.replace('- ', '')}</li>;
                    
                    const matchLink = line.match(/\[(.*?)\]\((.*?)\)/);
                    if (matchLink) {
                        const parts = line.split(/(\[.*?\]\(.*?\))/g);
                        return (
                            <p key={i} className="mb-2">
                                {parts.map((part, k) => {
                                    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
                                    if (linkMatch) {
                                        return (
                                            <a 
                                                key={k} 
                                                href={linkMatch[2]} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-primary underline hover:opacity-80 transition-opacity"
                                            >
                                                {linkMatch[1]}
                                            </a>
                                        );
                                    }
                                    return part.split(/(\*\*.*?\*\*)/g).map((subPart, m) => {
                                        if (subPart.startsWith('**') && subPart.endsWith('**')) {
                                            return <strong key={`${k}-${m}`} className="font-bold text-foreground dark:text-white">{subPart.slice(2, -2)}</strong>;
                                        }
                                        return subPart;
                                    });
                                })}
                            </p>
                        );
                    }

                    return (
                        <p key={i} className="mb-2">
                            {line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                    return <strong key={j} className="font-bold text-foreground dark:text-white">{part.slice(2, -2)}</strong>;
                                }
                                return part;
                            })}
                        </p>
                    );
                })}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};