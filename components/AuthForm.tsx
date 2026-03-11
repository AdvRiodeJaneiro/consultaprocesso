import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { GlowingButton } from './GlowingButton';

interface AuthFormProps {
  onSuccess?: () => void;
  defaultIsLogin?: boolean;
  initialWhatsapp?: string;
}

export const AuthForm: React.FC<AuthFormProps> = ({ 
  onSuccess, 
  defaultIsLogin = true,
  initialWhatsapp = ''
}) => {
  const [isLogin, setIsLogin] = useState(defaultIsLogin);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    whatsapp: initialWhatsapp
  });

  // Sincroniza se o whatsapp inicial mudar via props
  useEffect(() => {
    if (initialWhatsapp) {
      setFormData(prev => ({ ...prev, whatsapp: initialWhatsapp }));
      setIsLogin(false); // Garante que abra no cadastro se houver um número vindo do modal
    }
  }, [initialWhatsapp]);

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
        if (onSuccess) onSuccess();
        else navigate('/');
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
        toast.success('Conta criada! Verifique seu e-mail.');
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error(error.message || 'Ocorreu um erro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
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
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
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
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
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
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
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
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
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
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
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

      <div className="mt-6 text-center">
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
  );
};