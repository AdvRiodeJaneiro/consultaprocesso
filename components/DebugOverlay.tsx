"use client";

import React, { useState, useEffect } from 'react';
import { Terminal, Copy, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DebugLog {
  timestamp: string;
  type: 'info' | 'error' | 'success';
  message: string;
  data?: any;
}

interface DebugOverlayProps {
  logs: DebugLog[];
  onClear: () => void;
}

export const DebugOverlay: React.FC<DebugOverlayProps> = ({ logs, onClear }) => {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleCopy = () => {
    const text = logs.map(l => `[${l.timestamp}] ${l.type.toUpperCase()}: ${l.message} ${l.data ? JSON.stringify(l.data, null, 2) : ''}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (logs.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-2">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-80 md:w-96 h-96 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-bold text-xs">
                <Terminal size={14} />
                <span>DEBUG CONSOLE</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleCopy} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 transition-colors">
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
                <button onClick={onClear} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-3 scrollbar-hide">
              {logs.map((log, i) => (
                <div key={i} className={`border-l-2 pl-2 ${
                  log.type === 'error' ? 'border-red-500 text-red-400' : 
                  log.type === 'success' ? 'border-green-500 text-green-400' : 
                  'border-primary text-slate-300'
                }`}>
                  <div className="flex items-center gap-2 opacity-50">
                    <span>{log.timestamp}</span>
                    <span className="uppercase font-bold">{log.type}</span>
                  </div>
                  <p className="font-bold mt-0.5">{log.message}</p>
                  {log.data && (
                    <pre className="mt-1 bg-black/30 p-2 rounded overflow-x-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-900 text-primary border border-slate-800 p-3 rounded-full shadow-xl hover:scale-110 transition-all flex items-center gap-2"
      >
        <Terminal size={20} />
        {logs.length > 0 && (
          <span className="bg-primary text-deep-indigo text-[10px] font-black px-1.5 rounded-full">
            {logs.length}
          </span>
        )}
      </button>
    </div>
  );
};