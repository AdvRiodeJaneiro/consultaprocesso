import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Gavel, ArrowLeft } from 'lucide-react';
import { AuthForm } from '../components/AuthForm';

export default function Auth() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-deep-indigo/10 rounded-full blur-[120px]" />
      </div>

      <button 
        onClick={() => navigate(-1)}
        className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-primary transition-colors z-10"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Voltar</span>
      </button>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="size-16 rounded-2xl bg-primary mx-auto flex items-center justify-center text-deep-indigo shadow-lg mb-4">
            <Gavel className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-deep-indigo dark:text-white">JurisClaro</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Acesse sua conta para monitorar processos sem limites
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800">
          <AuthForm />
        </div>
      </div>
    </div>
  );
}