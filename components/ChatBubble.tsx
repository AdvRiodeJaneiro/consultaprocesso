import React from 'react';
import { Message } from '../types';
import { ShiningText } from './ui/shining-text';
import { WhatsappButtons } from './WhatsappButtons';

interface ChatBubbleProps {
  message: Message;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
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
          <div className="prose prose-sm max-w-none prose-invert">
             <div className="whitespace-pre-wrap leading-relaxed">
                {message.content.split('\n').map((line, i) => {
                    // Simple parser for headings and bold
                    if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold mt-2 mb-1 text-white">{line.replace('## ', '')}</h2>;
                    if (line.startsWith('### ')) return <h3 key={i} className="text-md font-bold mt-3 mb-2 text-primary uppercase tracking-wide">{line.replace('### ', '')}</h3>;
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
                                                className="text-primary underline hover:text-white transition-colors"
                                            >
                                                {linkMatch[1]}
                                            </a>
                                        );
                                    }
                                    return part.split(/(\*\*.*?\*\*)/g).map((subPart, m) => {
                                        if (subPart.startsWith('**') && subPart.endsWith('**')) {
                                            return <strong key={`${k}-${m}`} className={isUser ? "font-bold text-black" : "font-bold text-white"}>{subPart.slice(2, -2)}</strong>;
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
                                    return <strong key={j} className={isUser ? "font-bold text-black" : "font-bold text-white"}>{part.slice(2, -2)}</strong>;
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