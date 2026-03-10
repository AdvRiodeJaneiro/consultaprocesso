import React from 'react';
import { cn } from '../lib/utils';
import { Search } from 'lucide-react';

interface GlowingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const GlowingButton: React.FC<GlowingButtonProps> = ({ children, className, ...props }) => {
  return (
    <div className={cn("relative inline-flex items-center justify-center group", className)}>
      {/* Glowing effect layer */}
      <div className="absolute inset-0 duration-1000 opacity-60 transition-all bg-gradient-to-r from-indigo-500 via-pink-500 to-yellow-400 rounded-full blur-sm filter group-hover:opacity-100 group-hover:duration-200" />
      
      {/* Actual Button */}
      <button 
        type="button"
        className="group relative inline-flex items-center justify-center text-xs rounded-full bg-secondary px-3 py-2 font-semibold text-white transition-all duration-200 hover:bg-card hover:shadow-lg hover:-translate-y-0.5 hover:shadow-gray-600/30 border border-border"
        {...props}
      >
        <Search className="w-3 h-3 mr-1 text-primary" />
        {children}
      </button>
    </div>
  );
};