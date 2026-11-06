'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { User, AthleteCardData } from '@/lib/types';
import {
  CreditCard,
  Ruler,
  Maximize2,
  Zap,
  Target,
  Shield,
  Copy,
  Eye,
  Check,
  ExternalLink,
  Trophy,
  Info,
  Link as LinkIcon,
  Lock,
} from 'lucide-react';

interface ProfileForCard {
  user_id: string;
  full_name: string;
  birth_date?: string | null;
  preferred_position: string;
  laterality?: string | null;
  practice_time?: string | null;
  public_card_enabled: boolean;
  public_card_slug: string | null;
  avatar_url?: string | null;
}

interface LatestEvaluationForCard {
  age: number;
  height: number;
  wingspan: number;
  vertical_jump: number;
  attack_reach: number | null;
  block_reach: number | null;
  laterality?: string | null;
  evaluation_date: string;
}

interface CarteirinhaResponse {
  profile: ProfileForCard | null;
  latestEvaluation: LatestEvaluationForCard | null;
  evaluationsCount: number;
  goalsTotal: number;
  goalsCompleted: number;
  unlockedAchievements: AthleteCardData['unlocked_achievements'];
}

export default function CarteirinhaPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<CarteirinhaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Toggle do link público
  const [toggling, setToggling] = useState(false);
  const [publicEnabled, setPublicEnabled] = useState(false);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchCarteirinha = async () => {
    try {
      const authRes = await fetch('/api/auth/me');
      if (!authRes.ok) {
        router.push('/login');
        return;
      }
      const authData = await authRes.json();
      setUser(authData.user);

      const res = await fetch('/api/carteirinha');
      if (!res.ok) {
        throw new Error('Falha ao carregar a carteirinha.');
      }
      const card = (await res.json()) as CarteirinhaResponse;
      setData(card);
      const enabled = Boolean(card.profile?.public_card_enabled);
      setPublicEnabled(enabled);
      if (enabled && card.profile?.public_card_slug) {
        setPublicUrl(
          `${window.location.origin}/cartao/${card.profile.public_card_slug}`
        );
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar a carteirinha.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarteirinha();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = async (enabled: boolean) => {
    setToggling(true);
    try {
      const res = await fetch('/api/carteirinha', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_card_enabled: enabled }),
      });
      if (!res.ok) {
        throw new Error('Falha ao atualizar o compartilhamento.');
      }
      const result = await res.json();
      setPublicEnabled(enabled);
      setPublicUrl(enabled ? result.publicUrl || null : null);
      if (!enabled) setCopied(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar o compartilhamento.');
    } finally {
      setToggling(false);
    }
  };

  const handleCopy = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Não foi possível copiar o link.');
    }
  };

  const handleOpen = () => {
    if (!publicUrl) return;
    window.open(publicUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070908] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-emerald-400">Carregando carteirinha...</p>
        </div>
      </div>
    );
  }

  const profile = data?.profile ?? null;
  const latest = data?.latestEvaluation ?? null;
  const avatarUrl = user?.avatar_url ?? profile?.avatar_url ?? null;
  const fullName = profile?.full_name || user?.name || 'Atleta';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const athleteNumber = (profile?.user_id || user?.id || '').slice(0, 8).toUpperCase();
  const hasEvaluation = Boolean(latest);

  const statItems = [
    { label: 'Altura', value: latest?.height, icon: Ruler },
    { label: 'Envergadura', value: latest?.wingspan, icon: Maximize2 },
    { label: 'Salto Vertical', value: latest?.vertical_jump, icon: Zap },
    { label: 'Alcance de Ataque', value: latest?.attack_reach, icon: Target },
    { label: 'Alcance de Bloqueio', value: latest?.block_reach, icon: Shield },
  ];

  const formatStat = (value: unknown): string =>
    typeof value === 'number' && !isNaN(value) ? `${value} cm` : '—';

  return (
    <div className="min-h-screen bg-[#070908] text-white flex">
      <Sidebar
        currentUser={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(true)}
          currentUser={user}
          title="Minha Carteirinha"
          subtitle="Seu cartão de atleta TIME IFAL · VOLLEY PERFORMANCE"
        />

        <main className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto w-full">
          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/50 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* ================= CARTÃO DE ATLETA ================= */}
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-black via-[#0d1512] to-[#07110b] shadow-card">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Logo + nº de atleta */}
            <div className="relative flex items-center justify-between px-6 sm:px-8 py-5 border-b border-emerald-500/20">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <span className="text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-emerald-400">
                  Volley Performance
                </span>
              </div>
              <span className="font-mono text-xs text-gray-400 tracking-widest">
                Nº {athleteNumber || '--------'}
              </span>
            </div>

            {/* Identidade */}
            <div className="relative flex flex-col sm:flex-row items-center gap-5 px-6 sm:px-8 py-6">
              {/* Avatar grande à esquerda */}
              <div className="shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={`Foto de ${fullName}`}
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-neon"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-emerald-950/60 border-2 border-emerald-500/50 shadow-neon flex items-center justify-center text-3xl font-black text-emerald-300 font-mono">
                    {initials || 'VP'}
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left min-w-0">
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide truncate">
                  {fullName}
                </h2>
                <div className="mt-2 flex flex-wrap justify-center sm:justify-start items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider">
                    {profile?.preferred_position || 'Atleta'}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-lg bg-white/[0.04] text-gray-300 border border-white/10 text-xs font-semibold">
                    {hasEvaluation && latest?.age ? `${latest.age} anos` : 'Idade —'}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-4 text-xs text-gray-400">
                  <span>
                    <span className="text-gray-500">Lateralidade:</span>{' '}
                    <span className="text-emerald-300 font-semibold">
                      {latest?.laterality || 'Não informado'}
                    </span>
                  </span>
                  <span>
                    <span className="text-gray-500">Tempo de prática:</span>{' '}
                    <span className="text-emerald-300 font-semibold">
                      {profile?.practice_time || 'Não informado'}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Linha de estatísticas */}
            <div className="relative grid grid-cols-2 sm:grid-cols-5 gap-3 px-6 sm:px-8 pb-6">
              {statItems.map((stat) => (
                <div
                  key={stat.label}
                  className="p-3 rounded-xl bg-black/40 border border-emerald-950/80"
                >
                  <span className="flex items-center gap-1 text-[10px] text-gray-500 uppercase font-semibold">
                    <stat.icon className="w-3 h-3 text-emerald-500" />
                    {stat.label}
                  </span>
                  <span className="mt-1 block font-mono font-bold text-white text-sm">
                    {formatStat(stat.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sem avaliação: aviso de placeholders */}
          {!hasEvaluation && (
            <div className="p-4 rounded-xl bg-[#0b0e0c] border border-emerald-950 text-xs text-gray-400 flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Você ainda não possui avaliações registradas. Os valores físicos do cartão
                aparecem depois da sua primeira avaliação na plataforma.
              </span>
            </div>
          )}

          {/* Resumo: conquistas e metas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="athletic-card rounded-2xl p-5 flex items-center gap-4">
              <span className="p-3 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                <Trophy className="w-6 h-6" />
              </span>
              <div>
                <p className="text-[11px] text-gray-400 uppercase font-semibold">Conquistas</p>
                <p className="font-mono font-black text-white text-lg">
                  {data?.unlockedAchievements?.length ?? 0}{' '}
                  <span className="text-sm text-emerald-400">desbloqueadas</span>
                </p>
              </div>
            </div>
            <div className="athletic-card rounded-2xl p-5 flex items-center gap-4">
              <span className="p-3 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                <Target className="w-6 h-6" />
              </span>
              <div>
                <p className="text-[11px] text-gray-400 uppercase font-semibold">Metas</p>
                <p className="font-mono font-black text-white text-lg">
                  {data?.goalsCompleted ?? 0}
                  <span className="text-gray-500 text-sm">/{data?.goalsTotal ?? 0}</span>{' '}
                  <span className="text-sm text-emerald-400">concluídas</span>
                </p>
              </div>
            </div>
          </div>

          {/* ============ LINK PÚBLICO ============ */}
          <div className="athletic-card rounded-2xl p-6 sm:p-7 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <LinkIcon className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-base font-bold text-white uppercase tracking-wide">
                    Link Público da Carteirinha
                  </h3>
                </div>
                <p className="text-xs text-gray-400">
                  Ative para gerar um link que qualquer pessoa pode abrir — sem precisar de login.
                </p>
              </div>

              {/* Switch */}
              <button
                onClick={() => handleToggle(!publicEnabled)}
                disabled={toggling}
                className={`relative w-12 h-6 rounded-full border transition-colors shrink-0 disabled:opacity-50 ${
                  publicEnabled
                    ? 'bg-emerald-500 border-emerald-400 shadow-neon'
                    : 'bg-black/60 border-emerald-950'
                }`}
                title={publicEnabled ? 'Desativar link público' : 'Ativar link público'}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                    publicEnabled ? 'left-6' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {publicEnabled && publicUrl ? (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    readOnly
                    value={publicUrl}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-black/60 border border-emerald-950 text-emerald-300 font-mono text-xs focus:outline-none focus:border-emerald-500/50"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wide flex items-center gap-1.5 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copiar
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleOpen}
                      className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-gray-200 font-semibold text-xs uppercase tracking-wide border border-white/10 flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Abrir
                    </button>
                  </div>
                </div>

                {/* Preview (somente habilitado) */}
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> Ver preview
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-black/40 border border-emerald-950 text-xs text-gray-500">
                <Lock className="w-4 h-4 shrink-0" />
                <span>
                  {toggling
                    ? 'Atualizando configuração...'
                    : 'O link está desativado. Sua carteirinha não está visível publicamente.'}
                </span>
              </div>
            )}
          </div>

          {/* Nota informativa */}
          <div className="p-4 rounded-xl bg-[#0b0e0c] border border-emerald-950 text-xs text-gray-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Este cartão contém apenas valores da sua avaliação mais recente. Dados restritos só
              aparecem se as toggles de privacidade permitirem.
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}
