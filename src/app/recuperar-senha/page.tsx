'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, Mail, Lock, KeyRound, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function RecoverPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ message: string; code?: string } | null>(null);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      let data: any = {};
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(
          res.status >= 500
            ? 'Erro no servidor ao solicitar recuperação. Tente novamente mais tarde.'
            : text || 'Erro inesperado na resposta do servidor.'
        );
      }
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao solicitar recuperação.');
      }

      setSuccessInfo({
        message: data.message,
        code: data.recoveryCode,
      });

      if (data.recoveryCode) {
        setCode(data.recoveryCode);
      }

      setStep(2);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword !== confirmPassword) {
      setErrorMessage('A confirmação de senha não confere.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword, confirmPassword }),
      });

      let data: any = {};
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(
          res.status >= 500
            ? 'Erro no servidor ao redefinir senha. Tente novamente mais tarde.'
            : text || 'Erro inesperado na resposta do servidor.'
        );
      }
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao redefinir senha.');
      }

      setSuccessInfo({ message: 'Senha atualizada com sucesso!' });
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao redefinir senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070908] text-white flex flex-col justify-center items-center px-4 py-12 selection:bg-emerald-500 selection:text-black">
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-0.5 shadow-neon flex items-center justify-center">
              <div className="w-full h-full bg-[#0a0d0b] rounded-[14px] flex items-center justify-center">
                <Zap className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-2xl tracking-wider text-white">VOLLEY</span>
                <span className="font-black text-2xl tracking-wider text-emerald-400">PERFORMANCE</span>
              </div>
              <p className="text-[10px] tracking-widest text-emerald-500/80 font-bold uppercase">
                Time IFAL · Vôlei de Alto Rendimento
              </p>
              <p className="text-[10px] tracking-widest text-emerald-500/80 font-bold uppercase">
                Recuperação de Acesso
              </p>
            </div>
          </Link>
          <h2 className="text-xl font-black text-white uppercase tracking-wider">
            {step === 1 ? 'Recuperar Senha' : 'Definir Nova Senha'}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {step === 1
              ? 'Informe seu e-mail cadastrado para gerar o código de redefinição'
              : 'Insira o código de validação e escolha sua nova senha'}
          </p>
        </div>

        {/* Card Form */}
        <div className="athletic-card rounded-3xl p-7 sm:p-8 border border-emerald-950/80 shadow-2xl">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/50 flex items-start gap-3 text-red-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
              <p>{errorMessage}</p>
            </div>
          )}

          {successInfo && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs animate-in fade-in shadow-neon">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                <div>
                  <p className="font-bold">{successInfo.message}</p>
                  {successInfo.code && (
                    <div className="mt-2 p-2 rounded bg-black/40 border border-emerald-500/40 font-mono text-center text-sm font-black text-white">
                      Código de Verificação: {successInfo.code}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  E-mail do Atleta
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    required
                    className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm tracking-wider uppercase shadow-neon hover:shadow-neon-strong transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
              >
                <span>{loading ? 'Gerando Código...' : 'Continuar'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Código de 6 Dígitos
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    required
                    maxLength={6}
                    className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors font-mono tracking-widest"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Nova Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm tracking-wider uppercase shadow-neon hover:shadow-neon-strong transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
              >
                <span>{loading ? 'Salvando...' : 'Redefinir e Entrar'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-emerald-950/60 text-center">
            <Link href="/login" className="text-xs text-gray-400 hover:text-white transition-colors">
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
