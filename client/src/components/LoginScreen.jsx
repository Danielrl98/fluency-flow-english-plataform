import React, { useState } from 'react';
import {
  Headphones,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Database
} from 'lucide-react';

export default function LoginScreen({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (mode === 'register') {
      if (!name.trim()) {
        setErrorMessage('Por favor, digite seu nome completo.');
        return;
      }
      if (!email.trim() || !password.trim()) {
        setErrorMessage('Por favor, preencha todos os campos.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('A senha deve ter no mínimo 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('As senhas não coincidem. Verifique e tente novamente.');
        return;
      }
    } else {
      if (!email.trim() || !password.trim()) {
        setErrorMessage('Por favor, preencha seu e-mail e senha.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const body = mode === 'register'
        ? { name: name.trim(), email: email.trim(), password }
        : { email: email.trim(), password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha na autenticação.');
      }

      // Persist auth token and user info
      localStorage.setItem('fluency_auth_token', data.token);
      localStorage.setItem('fluency_user', JSON.stringify(data.user));

      setSuccessMessage(mode === 'register' ? 'Conta criada com sucesso! Entrando...' : 'Login realizado com sucesso!');
      
      setTimeout(() => {
        onLoginSuccess(data.token, data.user);
      }, 400);

    } catch (err) {
      setErrorMessage(err.message || 'Erro ao processar sua solicitação.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchMode = (newMode) => {
    setMode(newMode);
    setErrorMessage('');
    setSuccessMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-3 sm:p-4 relative overflow-hidden font-sans">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center mb-5 sm:mb-6">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-2.5 sm:mb-3">
            <Headphones className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              FluencyFlow
            </h1>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              PRO
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Plataforma oficial de prática diária de inglês com IA
          </p>
        </div>

        {/* Mode Toggle Switch */}
        <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 mb-5 sm:mb-6">
          <button
            type="button"
            onClick={() => handleSwitchMode('login')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Entrar na Conta
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('register')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Criar Nova Conta
          </button>
        </div>

        {/* Alert feedback */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
          {mode === 'register' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-150">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Seu Nome
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Daniel Souza"
                  required={mode === 'register'}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition shadow-inner"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu-email@exemplo.com"
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Senha {mode === 'register' && <span className="text-slate-500 lowercase">(mínimo 6 caracteres)</span>}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-150">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita sua senha"
                  required={mode === 'register'}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition shadow-inner"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed text-xs sm:text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processando...</span>
              </>
            ) : mode === 'register' ? (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Cadastrar e Começar</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Entrar na Plataforma</span>
              </>
            )}
          </button>
        </form>

        {/* Security & Database Badge */}
        <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-slate-800 flex items-center justify-center gap-2 sm:gap-3 text-slate-500 text-[10px] sm:text-[11px]">
          <div className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Banco SQLite</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Hash Bcrypt</span>
          </div>
        </div>
      </div>
    </div>
  );
}