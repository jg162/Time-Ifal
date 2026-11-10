'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import {
  User,
  RankingEntry,
  RankingCategory,
  RANKING_CATEGORIES,
} from '@/lib/types';
import {
  Trophy,
  Medal,
  Award,
  Calendar,
  Info,
  Flame,
  RefreshCw,
} from 'lucide-react';

/* ------------------------------ Helpers ------------------------------ */

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return `${first}${last}`.toUpperCase();
}

function formatValue(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

function formatDate(rawValue: string | null | undefined): string {
  if (!rawValue) return 'Data não informada';
  const date = new Date(rawValue.includes('T') ? rawValue : `${rawValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return rawValue;
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/* Avatar com fallback de iniciais em círculo verde */
function AthleteAvatar({
  name,
  avatarUrl,
  className,
}: {
  name: string;
  avatarUrl: string | null;
  className: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!avatarUrl || failed) {
    return (
      <div
        className={`${className} rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-black select-none`}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={name}
      onError={() => setFailed(true)}
      className={`${className} rounded-full object-cover border border-emerald-500/30 bg-emerald-950/30`}
    />
  );
}

/* Estilo das medalhas do pódio (ouro, prata e bronze via CSS) */
const MEDALS: Record<
  number,
  {
    Icon: typeof Trophy;
    label: string;
    badge: string;
    border: string;
    shadow: string;
    order: string;
  }
> = {
  1: {
    Icon: Trophy,
    label: '1º lugar',
    badge: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/40',
    border: 'border-yellow-400/40 hover:border-yellow-400/70',
    shadow: 'shadow-[0_0_25px_rgba(250,204,21,0.15)]',
    order: 'sm:order-2',
  },
  2: {
    Icon: Medal,
    label: '2º lugar',
    badge: 'bg-slate-300/10 text-slate-300 border-slate-300/40',
    border: 'border-slate-300/30 hover:border-slate-300/60',
    shadow: 'shadow-[0_0_20px_rgba(203,213,225,0.10)]',
    order: 'sm:order-1',
  },
  3: {
    Icon: Award,
    label: '3º lugar',
    badge: 'bg-amber-600/10 text-amber-500 border-amber-600/40',
    border: 'border-amber-600/30 hover:border-amber-500/60',
    shadow: 'shadow-[0_0_20px_rgba(217,119,6,0.12)]',
    order: 'sm:order-3',
  },
};

/* ------------------------------ Página ------------------------------ */

export default function RankingsPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [rankings, setRankings] = useState<Partial<Record<RankingCategory, RankingEntry[]>>>({});
  const [note, setNote] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<RankingCategory>('reach_jumping');

  const fetchRankings = async () => {
    setLoading(true);
    setError(null);
    try {
      const authRes = await fetch('/api/auth/me');
      if (!authRes.ok) {
        router.push('/login');
        return;
      }
      const authData = await authRes.json();
      setUser(authData.user);

      // Busca sem query: traz todos os rankings de uma vez.
      const rankRes = await fetch('/api/rankings');
      if (!rankRes.ok) {
        throw new Error('Não foi possível carregar os rankings.');
      }
      const rankData = await rankRes.json();
      setRankings(rankData.rankings || {});
      setNote(rankData.note || null);
    } catch (err) {
      console.error('Error fetching rankings:', err);
      setError('Não foi possível carregar os rankings. Tente novamente em alguns instantes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeInfo = RANKING_CATEGORIES.find((c) => c.key === activeCategory);
  const entries = rankings[activeCategory] || [];
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070908] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-emerald-400">Carregando rankings do time...</p>
        </div>
      </div>
    );
  }

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
          title="Rankings"
          subtitle="Classificação do time usando apenas a avaliação MAIS RECENTE de cada atleta"
        />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0d1612] via-[#09120e] to-[#070908] border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide">
                  Ranking Oficial · TIME IFAL
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-300">
                Os melhores índices físicos do elenco, categoria por categoria.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold whitespace-nowrap">
              <Flame className="w-3.5 h-3.5" />
              <span>{entries.length} classificados nesta categoria</span>
            </div>
          </div>

          {/* Banner inteligente explicativo */}
          <div className="athletic-card rounded-2xl p-4 sm:p-5 flex items-start gap-3 border-emerald-500/20">
            <span className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 shrink-0">
              <Info className="w-4 h-4 text-emerald-400" />
            </span>
            <div className="space-y-1">
              <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                Cada categoria considera <span className="text-emerald-400 font-bold">apenas a avaliação mais recente</span> de
                cada atleta. Quem ainda não realizou nenhuma avaliação não aparece no ranking. Passe o mouse ou toque nas
                abas para ver a descrição do critério.
              </p>
              {note && (
                <p className="text-[11px] text-gray-400 border-t border-emerald-950/60 pt-2">
                  <span className="text-emerald-400 font-semibold">Nota da API:</span> {note}
                </p>
              )}
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div className="athletic-card rounded-2xl p-8 text-center space-y-3">
              <RefreshCw className="w-10 h-10 text-red-400 mx-auto" />
              <p className="text-sm font-semibold text-red-300">{error}</p>
              <button
                onClick={fetchRankings}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase shadow-neon transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar novamente
              </button>
            </div>
          )}

          {!error && (
            <>
              {/* Tabs / Chips das categorias */}
              <div className="athletic-card rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
                  {RANKING_CATEGORIES.map((cat) => {
                    const count = (rankings[cat.key] || []).length;
                    const isActive = activeCategory === cat.key;
                    return (
                      <button
                        key={cat.key}
                        onClick={() => setActiveCategory(cat.key)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                          isActive
                            ? 'bg-emerald-500 text-black shadow-neon'
                            : 'bg-[#080d0a] text-gray-400 border border-emerald-950/80 hover:text-white hover:border-emerald-500/30'
                        }`}
                      >
                        {cat.label} ({count})
                      </button>
                    );
                  })}
                </div>
                {activeInfo && (
                  <p className="text-[11px] text-gray-400 border-t border-emerald-950/60 pt-3">
                    <span className="text-emerald-400 font-semibold">Critério:</span> {activeInfo.description}
                  </p>
                )}
              </div>

              {/* Vazio nesta categoria */}
              {entries.length === 0 ? (
                <div className="athletic-card rounded-2xl p-12 text-center">
                  <Flame className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white mb-1">
                    Ninguém pontuou nessa categoria ainda
                  </h3>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    Assim que os atletas registrarem seus testes, o ranking desta categoria aparecerá aqui
                    automaticamente.
                  </p>
                </div>
              ) : (
                <>
                  {/* Pódio - TOP 3 */}
                  {podium.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Trophy className="w-5 h-5 text-yellow-400" />
                        <h3 className="text-lg font-bold text-white tracking-wide uppercase">
                          Pódio
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        {podium.map((entry) => {
                          const medal = MEDALS[entry.rank];
                          if (!medal) return null;
                          const MedalIcon = medal.Icon;
                          return (
                            <div
                              key={entry.athlete_id}
                              className={`athletic-card p-6 flex flex-col items-center text-center gap-3 border transition-all hover:-translate-y-1 ${medal.border} ${medal.shadow} ${medal.order}`}
                            >
                              <span
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${medal.badge}`}
                              >
                                <MedalIcon className="w-3.5 h-3.5" />
                                {medal.label}
                              </span>
                              <AthleteAvatar
                                name={entry.name}
                                avatarUrl={entry.avatar_url}
                                className="w-20 h-20 text-xl"
                              />
                              <div>
                                <p className="text-base font-black text-white">{entry.name}</p>
                                <p className="text-xs text-gray-400">{entry.position}</p>
                              </div>
                              <div className="px-5 py-2 rounded-xl bg-black/60 border border-emerald-950/80">
                                <span className="font-mono font-black text-2xl text-emerald-300">
                                  {formatValue(entry.value)}
                                </span>
                                <span className="text-xs text-emerald-400 font-bold ml-1">cm</span>
                              </div>
                              <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" />
                                {formatDate(entry.evaluation_date)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Lista do 4º em diante */}
                  {rest.length > 0 && (
                    <div className="athletic-card rounded-2xl p-4 sm:p-6">
                      <div className="flex items-center gap-2 pb-4 mb-4 border-b border-emerald-950/60">
                        <Award className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-base font-bold text-white tracking-wide uppercase">
                          Demais Atletas
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {rest.map((entry) => (
                          <div
                            key={entry.athlete_id}
                            className="p-4 rounded-2xl bg-black/40 border border-emerald-950 hover:border-emerald-500/40 transition-all flex items-center gap-3 sm:gap-4"
                          >
                            <span className="w-9 h-9 shrink-0 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-emerald-300 text-sm">
                              {entry.rank}
                            </span>
                            <AthleteAvatar
                              name={entry.name}
                              avatarUrl={entry.avatar_url}
                              className="w-11 h-11 text-xs shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white truncate">{entry.name}</p>
                              <p className="text-[11px] text-gray-400 truncate">
                                {entry.position} • Avaliado em {formatDate(entry.evaluation_date)}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-mono font-extrabold text-base sm:text-lg text-emerald-300">
                                {formatValue(entry.value)}
                              </span>
                              <span className="text-[11px] text-gray-400 block">cm</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
