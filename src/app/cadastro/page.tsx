'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Zap, Lock, Mail, User, ArrowRight, AlertCircle, CheckCircle2, Users } from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamCode = searchParams.get('team');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Team invite info
  const [invitedTeam, setInvitedTeam] = useState<{ name: string; code: string } | null>(null);
  const [teamLookupDone, setTeamLookupDone] = useState(false);

  useEffect(() => {
    if (!teamCode) {
      setTeamLookupDone(true);
      return;
    }
    fetch(`/api/teams?code=${encodeURIComponent(teamCode)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.team) setInvitedTeam({ name: data.team.name, code: data.team.code });
      })
      .catch(() => {})
      .finally(() => setTeamLookupDone(true));
  }, [teamCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage('A confirmação de senha não confere com a senha digitada.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
          teamCode: invitedTeam?.code || undefined,
        }),
      });

      let data: any = {};
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(
          res.status >= 500
            ? 'Erro no servidor ao processar o cadastro. Tente novamente mais tarde.'
            : text || 'Erro inesperado na resposta do servidor.'
        );
      }

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar conta.');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao cadastrar.');
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
                Cadastro de Atleta
              </p>
            </div>
          </Link>
          <h2 className="text-xl font-black text-white uppercase tracking-wider">
            Criar Conta de Atleta
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Cadastre seu perfil para registrar e monitorar suas avaliações físicas
          </p>
        </div>

        {/* Team Invite Banner */}
        {teamCode && invitedTeam && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-0.5">Convite de Time</p>
              <p className="text-sm text-white font-semibold">{invitedTeam.name}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Ao criar sua conta, você entrará automaticamente neste time.
              </p>
            </div>
          </div>
        )}

        {/* Card Form */}
        <div className="athletic-card rounded-3xl p-7 sm:p-8 border border-emerald-950/80 shadow-2xl">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/50 flex items-start gap-3 text-red-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
              <p>{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome Completo */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Nome Completo do Jogador
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Matheus Santos"
                  required
                  className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* E-mail */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                E-mail
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

            {/* Senha */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Senha (mínimo 6 dígitos)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Confirmar Senha */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Confirmar Senha
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm tracking-wider uppercase shadow-neon hover:shadow-neon-strong transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              <span>{loading ? 'Criando Conta...' : invitedTeam ? `Cadastrar e Entrar no ${invitedTeam.name}` : 'Cadastrar Atleta'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-emerald-950/60 text-center">
            <p className="text-xs text-gray-400">
              Já possui conta cadastrada?{' '}
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-bold">
                Entrar agora
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#070908] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
