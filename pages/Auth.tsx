
import React, { useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Gavel, Mail, Lock, User, Phone, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { GlowingButton } from '../components/GlowingButton';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    whatsapp: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        toast.success('Bem-vindo de volta!');
        navigate('/');
      } else {
        if (!formData.firstName) {
          toast.error('O nome é obrigatório');
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              whatsapp: formData.whatsapp,
            }
          }
        });
        if (error) throw error;
        toast.success('Conta criada com sucesso! Verifique seu e-mail.');
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error(error.message || 'Ocorreu um erro');
    } finally {
      setLoading(false);
    }
  };

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
            {isLogin ? 'Acesse sua conta para monitorar processos' : 'Crie sua conta gratuita agora'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      name="firstName"
                      type="text"
                      placeholder="Ex: João"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Sobrenome</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      name="lastName"
                      type="text"
                      placeholder="Ex: Silva"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    name="whatsapp"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  required
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  required
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <GlowingButton 
              type="submit" 
              className="w-full py-4 mt-4"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                isLogin ? 'Entrar' : 'Criar Conta'
              )}
            </GlowingButton>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-medium text-slate-500 hover:text-primary transition-colors"
            >
              {isLogin ? (
                <>Não tem uma conta? <span className="text-primary font-bold">Cadastre-se</span></>
              ) : (
                <>Já tem uma conta? <span className="text-primary font-bold">Faça login</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
