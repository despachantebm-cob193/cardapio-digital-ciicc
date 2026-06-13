import React, { useState } from 'react';
import { Lock, LogIn, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { isSupabaseAuthConfigured, signInWithGoogle } from '../features/auth/supabaseAuthService';
import { motion } from 'motion/react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBack?: () => void;
}

export default function AdminLogin({ onLoginSuccess, onBack }: AdminLoginProps) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const supabaseAuthReady = isSupabaseAuthConfigured();

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPin('');
    setError('Acesso por PIN desabilitado nesta fase. Use o login Google via Supabase Auth.');
  };

  const handleGoogleLogin = async () => {
    if (!supabaseAuthReady) {
      setError('Supabase Auth ainda não está configurado. Configure .env.local para habilitar o login Google.');
      return;
    }

    setGoogleLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
    } catch (err) {
      console.error(err);
      setError('Falha ao iniciar login Google via Supabase Auth. Verifique a configuração Supabase/Google.');
      setGoogleLoading(false);
    }
  };

  return (
    <div id="admin-login-layout" className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl p-8 border border-zinc-100 shadow-xl"
      >
        {/* Header Visual */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 border border-amber-100">
            <Lock className="w-6 h-6 text-amber-600 animate-pulse" />
          </div>
          <h2 className="font-display font-bold text-2xl text-zinc-900">Acesso Restrito</h2>
          <p className="text-zinc-500 text-sm mt-1">
            Painel do Administrador para Alimentar o Cardápio
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-xs leading-relaxed text-center">
            {error}
          </div>
        )}

        {/* PIN Code Box */}
        <form onSubmit={handlePinSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2">
              PIN legado do Administrador
            </label>
            <div className="relative">
              <input
                id="admin-pin-input"
                type={showPin ? 'text' : 'password'}
                placeholder="PIN legado desabilitado"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(null);
                }}
                maxLength={10}
                className="w-full pr-12 pl-4 py-3 bg-zinc-50 border border-zinc-200 focus:border-amber-500 focus:bg-white rounded-2xl font-mono text-center text-lg tracking-widest text-zinc-900 outline-none transition-all placeholder:font-sans placeholder:tracking-normal placeholder:text-sm"
              />
              <button
                type="button"
                id="toggle-pin-visibility-btn"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="admin-pin-submit-btn"
            className="w-full py-4.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-sm rounded-2xl cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <span>PIN legado desabilitado</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-7 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-150"></div>
          </div>
          <span className="relative px-3 bg-white text-zinc-400 text-xs font-medium">OU</span>
        </div>

        {/* Authentication Options */}
        <div className="space-y-4">
          <button
            type="button"
            id="google-signin-btn"
            onClick={handleGoogleLogin}
            disabled={googleLoading || !supabaseAuthReady}
            className="w-full py-4 bg-white border-2 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-350 text-zinc-800 font-medium text-sm rounded-2xl cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.62-.17-1.18-.45-1.68-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>
              {!supabaseAuthReady
                ? 'Supabase Auth não configurado'
                : googleLoading
                  ? 'Redirecionando...'
                  : 'Conectar com Google via Supabase'}
            </span>
          </button>

          <p className="text-zinc-400 text-[11px] text-center px-4 leading-relaxed">
            {supabaseAuthReady
              ? 'O login Google será iniciado pelo Supabase Auth. O Firebase legado permanece ativo apenas para compatibilidade durante a validação.'
              : 'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env.local para habilitar o login Google via Supabase Auth.'}
          </p>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-full mt-3 py-3 bg-zinc-50 border border-zinc-200 hover:bg-zinc-150 text-zinc-650 hover:text-zinc-800 font-bold text-xs uppercase tracking-wider rounded-2xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              Voltar ao Início
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
