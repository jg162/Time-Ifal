'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { User, AchievementView } from '@/lib/types';
import {
  ClipboardList,
  Repeat,
  Medal,
  Target,
  Trophy,
  Zap,
  TrendingUp,
  Shield,
  Lock,
  Sparkles,
  LucideIcon,
} from 'lucide-react';

// Mapeamento dos ícones declarativos das definições de conquista.
const ICON_MAP: Record<string, LucideIcon> = {
  clipboard: ClipboardList,
  repeat: Repeat,
  medal: Medal,
  target: Target,
  trophy: Trophy,
  zap: Zap,
  'arrow-up': TrendingUp,
  shield: Shield,
};

// Cores por tier: bronze (amber-700), prata (gray-400), ouro (yellow-400).
const TIER_STYLES: Record<string, { text: string; border: string; bg: string; label: string }> = {
  bronze: {
    text: 'text-amber-700',
    border: 'border-amber-700/40',
    bg: 'bg-amber-950/30',
    label: 'Bronze',
  },
  prata: {
    text: 'text-gray-400',
    border: 'border-gray-500/40',
    bg: 'bg-gray-800/40',
    label: 'Prata',
  },
  ouro: {
    text: 'text-yellow-400',
    border: 'border-yellow-400/40',
    bg: 'bg-yellow-900/20',
    label: 'Ouro',
  },
};

export default function ConquistasPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [achievements, setAchievements] = useState<AchievementView[]>([]);
  const [unlockedNow, setUnlockedNow] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievements = async () => {
    try {
      const authRes = await fetch('/api/auth/me');
      if (!authRes.ok) {
        router.push('/login');
        return;
      }
      const authData = await authRes.json();
      setUser(authData.user);

      const res = await fetch('/api/conquistas');
      if (!res.ok) {
        throw new Error('Falha ao carregar conquistas.');
      }
      const data = await res.json();
      setAchievements(data.achievements || []);
      setUnlockedNow(data.unlockedNow || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar conquistas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070908] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-emerald-400">Carregando conquistas...</p>
        </div>
      </div>
    );
  }

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const progressPct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  const unlockedNowViews = achievements.filter(
    (a) => a.unlocked && unlockedNow.includes(a.key)
  );

  const formatDate = (value: string | null): string => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

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
          title="Conquistas"
          subtitle="Desbloqueadas automaticamente conforme seus resultados"
        />

        <main className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Cabeçalho com progresso numérico */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0d1612] via-[#09120e] to-[#070908] border border-emerald-500/30">
            <div className="flex items-center gap-2 mb-1">
              <Medal className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide">
                Sala de Troféus
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 mb-4">
              Você desbloqueou{' '}
              <span className="text-emerald-400 font-bold font-mono">{unlockedCount}</span>{' '}
              de <span className="text-emerald-400 font-bold font-mono">{totalCount}</span>{' '}
              conquistas disponíveis.
            </p>

            {/* Barra de progresso */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 rounded-full bg-black/60 border border-emerald-950 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-neon transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="font-mono font-black text-emerald-400 text-sm whitespace-nowrap">
                {progressPct}%
              </span>
            </div>
          </div>

          {/* Banner de conquistas recém-desbloqueadas */}
          {unlockedNowViews.length > 0 && (
            <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 border border-emerald-400/60 bg-gradient-to-r from-emerald-950/80 via-[#0d1512] to-[#07110b] shadow-neon animate-pulse">
              <div className="absolute -top-16 -right-16 w-40 h-40 bg-emerald-500/25 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-emerald-300" />
                <span className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-emerald-300">
                  Nova Conquista!
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {unlockedNowViews.map((a) => (
                  <span
                    key={a.key}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-sm font-bold text-emerald-200"
                  >
                    {a.title}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Erro de carregamento */}
          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/50 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Grid de medalhas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {achievements.map((achievement) => {
              const Icon = ICON_MAP[achievement.icon] ?? Medal;
              const tier = TIER_STYLES[achievement.tier] ?? TIER_STYLES.bronze;
              const unlockedAt = formatDate(achievement.unlocked_at);

              return (
                <div
                  key={achievement.key}
                  className={`relative overflow-hidden athletic-card rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-300 ${
                    achievement.unlocked
                      ? 'border-emerald-500/50 shadow-neon bg-[#0f1411]/80'
                      : 'border-emerald-950 bg-[#0b0e0c]/80 grayscale opacity-40'
                  }`}
                >
                  {/* Glow decorativo para desbloqueadas */}
                  {achievement.unlocked && (
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
                  )}

                  {/* Ícone da medalha */}
                  <div
                    className={`relative p-4 rounded-2xl border ${tier.border} ${tier.bg} ${
                      achievement.unlocked ? tier.text : 'text-gray-500'
                    }`}
                  >
                    <Icon className="w-8 h-8" />
                    {!achievement.unlocked && (
                      <Lock className="absolute -bottom-1.5 -right-1.5 w-4 h-4 text-gray-500" />
                    )}
                  </div>

                  <h3 className="mt-3 text-sm font-black text-white uppercase tracking-wide">
                    {achievement.title}
                  </h3>

                  <span
                    className={`mt-1.5 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${tier.text} ${tier.border} ${tier.bg}`}
                  >
                    {tier.label}
                  </span>

                  {achievement.unlocked ? (
                    <div className="mt-3">
                      <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">
                        Desbloqueada em {unlockedAt}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                        Bloqueada
                      </p>
                      <p className="text-[11px] text-gray-500 leading-snug">
                        {achievement.description}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
