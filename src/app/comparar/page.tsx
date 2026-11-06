'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import {
  User,
  CompareAthlete,
  COMPARE_METRICS,
  CompareMetricKey,
} from '@/lib/types';
import {
  Users,
  Sparkles,
  Check,
  RefreshCw,
  UserPlus,
  Shield,
  Table as TableIcon,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from 'recharts';

/* ------------------------------ Helpers ------------------------------ */

interface AllAthlete {
  id: string;
  name: string;
  avatar_url: string | null;
  position: string | null;
  is_self: boolean;
}

const BAR_COLORS = ['#00E676', '#22d3ee', '#fbbf24', '#a78bfa', '#f87171'];

function formatDate(rawValue: string | null | undefined): string {
  if (!rawValue) return 'Sem avaliação registrada';
  const date = new Date(rawValue.includes('T') ? rawValue : `${rawValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'Sem avaliação registrada';
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return `${first}${last}`.toUpperCase();
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
        className={`${className} rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-black select-none shrink-0`}
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
      className={`${className} rounded-full object-cover border border-emerald-500/30 bg-emerald-950/30 shrink-0`}
    />
  );
}

/* ------------------------------ Página ------------------------------ */

export default function CompararPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [allAthletes, setAllAthletes] = useState<AllAthlete[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [athletes, setAthletes] = useState<CompareAthlete[]>([]);
  const [chartMetric, setChartMetric] = useState<CompareMetricKey>('reach_jumping');

  const initialSelectionDone = useRef(false);

  /* Carrega autenticação + diretório de atletas (uma única vez) */
  useEffect(() => {
    async function load() {
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

        const res = await fetch('/api/comparar');
        if (!res.ok) {
          throw new Error('Não foi possível carregar a lista de atletas.');
        }
        const data = await res.json();
        setAllAthletes(data.allAthletes || []);
        const uid: string | null = data.currentUserId ?? null;
        setCurrentUserId(uid);
        // Inclui o próprio usuário por padrão (uma única vez)
        if (uid && !initialSelectionDone.current) {
          initialSelectionDone.current = true;
          setSelectedIds([uid]);
        }
      } catch (err) {
        console.error('Error loading comparar data:', err);
        setError('Não foi possível carregar a lista de atletas. Tente novamente em alguns instantes.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  /* Refetch dos dados comparados sempre que a seleção muda */
  useEffect(() => {
    if (selectedIds.length === 0) {
      setAthletes([]);
      setCompareError(null);
      return;
    }
    let cancelled = false;
    async function loadAthletes() {
      setCompareLoading(true);
      setCompareError(null);
      try {
        const res = await fetch(`/api/comparar?ids=${selectedIds.join(',')}`);
        if (!res.ok) {
          throw new Error('Falha ao carregar comparação.');
        }
        const data = await res.json();
        if (!cancelled) {
          setAthletes(data.athletes || []);
        }
      } catch (err) {
        console.error('Error fetching comparison:', err);
        if (!cancelled) {
          setCompareError('Erro ao carregar a comparação. Tente novamente.');
        }
      } finally {
        if (!cancelled) {
          setCompareLoading(false);
        }
      }
    }
    loadAthletes();
    return () => {
      cancelled = true;
    };
  }, [selectedIds]);

  const maxed = selectedIds.length >= 5;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (maxed) return prev;
      return [...prev, id];
    });
  };

  /* Mantém a ordem dos atletas de acordo com a ordem da seleção */
  const selectedAthletes = useMemo(() => {
    return selectedIds
      .map((id) => athletes.find((a) => a.id === id))
      .filter((a): a is CompareAthlete => Boolean(a));
  }, [selectedIds, athletes]);

  /* Melhor valor de cada linha da tabela (idade não "vence" — sem destaque) */
  const bestIdByMetric = useMemo(() => {
    const map: Partial<Record<CompareMetricKey, string | null>> = {};
    for (const metric of COMPARE_METRICS) {
      const valid = selectedAthletes
        .map((a) => ({ id: a.id, value: a[metric.key] }))
        .filter((x): x is { id: string; value: number } => typeof x.value === 'number');
      if (metric.key === 'age' || valid.length === 0) {
        map[metric.key] = null;
        continue;
      }
      const best = valid.reduce((acc, x) => {
        if (metric.higherIsBetter) return x.value > acc.value ? x : acc;
        return x.value < acc.value ? x : acc;
      });
      map[metric.key] = best.id;
    }
    return map;
  }, [selectedAthletes]);

  /* Dados do gráfico de barras da métrica escolhida */
  const chartData = useMemo(() => {
    return selectedAthletes
      .map((a) => ({
        id: a.id,
        name: a.name,
        value: a[chartMetric],
      }))
      .filter((d): d is { id: string; name: string; value: number } => typeof d.value === 'number')
      .sort((a, b) => a.value - b.value);
  }, [selectedAthletes, chartMetric]);

  const selectedMetric = COMPARE_METRICS.find((m) => m.key === chartMetric);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070908] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-emerald-400">Carregando comparação de atletas...</p>
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
          title="Comparar Atletas"
          subtitle="Você sempre está incluído — selecione 1 a 5 colegas"
        />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0d1612] via-[#09120e] to-[#070908] border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide">
                  Comparação Física do Elenco
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-300">
                Coloque até 5 atletas lado a lado e descubra os destaques de cada métrica.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{selectedIds.length}/5 selecionados</span>
            </div>
          </div>

          {/* Erro geral */}
          {error && (
            <div className="athletic-card rounded-2xl p-8 text-center space-y-3">
              <RefreshCw className="w-10 h-10 text-red-400 mx-auto" />
              <p className="text-sm font-semibold text-red-300">{error}</p>
              <button
                onClick={() => router.refresh()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase shadow-neon transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar novamente
              </button>
            </div>
          )}

          {!error && (
            <>
              {/* Seletor de atletas */}
              <div className="athletic-card rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                      Selecionar Atletas (1 a 5)
                    </h3>
                  </div>
                  {maxed && (
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">
                      Limite de 5 atingido
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {allAthletes.map((athlete) => {
                    const isSelected = selectedIds.includes(athlete.id);
                    // Ao atingir o máximo, esconde os atletas ainda não selecionados
                    if (maxed && !isSelected) return null;
                    return (
                      <button
                        key={athlete.id}
                        onClick={() => toggleSelect(athlete.id)}
                        className={`relative p-3 rounded-xl flex items-center gap-3 text-left transition-all border ${
                          isSelected
                            ? 'bg-emerald-950/50 border-emerald-500/50 shadow-[0_0_15px_rgba(0,230,118,0.15)]'
                            : 'bg-[#080d0a] border-emerald-950/80 hover:border-emerald-500/40 hover:bg-emerald-950/20'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-neon">
                            <Check className="w-3.5 h-3.5" strokeWidth={3} />
                          </span>
                        )}
                        <AthleteAvatar
                          name={athlete.name}
                          avatarUrl={athlete.avatar_url}
                          className="w-10 h-10 text-xs"
                        />
                        <div className="min-w-0 pr-4">
                          <p className="text-xs font-bold text-white truncate">
                            {athlete.name}
                            {athlete.id === currentUserId && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                                Você
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">{athlete.position}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {allAthletes.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">
                    Nenhum atleta disponível para comparação ainda.
                  </p>
                )}
              </div>

              {/* Nenhum selecionado */}
              {selectedIds.length === 0 ? (
                <div className="athletic-card rounded-2xl p-12 text-center">
                  <UserPlus className="w-12 h-12 text-emerald-500/50 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white mb-1">
                    Nenhum atleta selecionado
                  </h3>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    Selecione ao menos 1 atleta nas opções acima para começar a comparar as métricas
                    físicas do elenco.
                  </p>
                </div>
              ) : compareLoading ? (
                <div className="athletic-card rounded-2xl p-12 flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-semibold text-emerald-400">
                    Carregando métricas comparadas...
                  </p>
                </div>
              ) : compareError ? (
                <div className="athletic-card rounded-2xl p-8 text-center space-y-3">
                  <RefreshCw className="w-10 h-10 text-red-400 mx-auto" />
                  <p className="text-sm font-semibold text-red-300">{compareError}</p>
                  <button
                    onClick={() => setSelectedIds((prev) => [...prev])}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase shadow-neon transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Tentar novamente
                  </button>
                </div>
              ) : (
                <>
                  {/* (a) Tabela por métrica */}
                  <div className="athletic-card rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-2 p-4 sm:p-5 border-b border-emerald-950/60">
                      <TableIcon className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-base font-bold text-white tracking-wide uppercase">
                        Tabela por Métrica
                      </h3>
                      <span className="ml-auto text-[10px] text-gray-400 hidden sm:inline">
                        Destaque em <span className="text-emerald-400 font-bold">verde</span> = melhor marca
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[520px]">
                        <thead className="bg-[#090d0b] border-b border-emerald-950/80 text-gray-400 uppercase text-[10px] tracking-wider font-semibold">
                          <tr>
                            <th className="py-3.5 px-4">Métrica</th>
                            {selectedAthletes.map((a) => (
                              <th key={a.id} className="py-3.5 px-4">
                                <div className="flex items-center gap-2">
                                  <AthleteAvatar
                                    name={a.name}
                                    avatarUrl={a.avatar_url}
                                    className="w-8 h-8 text-[10px]"
                                  />
                                  <div className="min-w-0">
                                    <span className="block font-bold text-white truncate max-w-[110px]">
                                      {a.name}
                                    </span>
                                    {a.id === currentUserId && (
                                      <span className="text-[9px] text-emerald-400 font-semibold">(Você)</span>
                                    )}
                                  </div>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-950/40 text-gray-300">
                          {COMPARE_METRICS.map((metric) => {
                            const bestId = bestIdByMetric[metric.key] ?? null;
                            return (
                              <tr key={metric.key} className="hover:bg-emerald-950/20 transition-colors">
                                <td className="py-3 px-4 font-semibold text-gray-400 whitespace-nowrap">
                                  {metric.label}
                                  <span className="ml-1 text-[9px] text-gray-500 uppercase">
                                    ({metric.unit})
                                  </span>
                                </td>
                                {selectedAthletes.map((a) => {
                                  const value = a[metric.key];
                                  const isBest = bestId !== null && a.id === bestId;
                                  return (
                                    <td key={a.id} className="py-3 px-4">
                                      {typeof value === 'number' ? (
                                        <span
                                          className={`font-mono font-bold px-2 py-1 rounded-lg ${
                                            isBest
                                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/40'
                                              : 'text-white'
                                          }`}
                                        >
                                          {formatNumber(value)} {metric.unit}
                                        </span>
                                      ) : (
                                        <span className="text-gray-600 font-mono">—</span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Cards de posição */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-lg font-bold text-white tracking-wide uppercase">
                        Posição no Sistema
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedAthletes.map((a) => (
                        <div
                          key={a.id}
                          className="athletic-card p-5 flex items-center gap-4 border border-emerald-950 hover:border-emerald-500/40 transition-all hover:-translate-y-0.5"
                        >
                          <AthleteAvatar
                            name={a.name}
                            avatarUrl={a.avatar_url}
                            className="w-14 h-14 text-sm"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate flex items-center gap-2">
                              {a.name}
                              {a.id === currentUserId && (
                                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase shrink-0">
                                  Você
                                </span>
                              )}
                            </p>
                            <p className="text-lg font-black text-emerald-300">{a.position}</p>
                            <p className="text-[10px] text-gray-400">
                              Última avaliação: {formatDate(a.evaluation_date)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* (b) Gráfico de barras — apenas com 2+ atletas */}
                  {selectedAthletes.length >= 2 && (
                    <div className="athletic-card rounded-2xl p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-emerald-950/60">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-emerald-400" />
                          <h3 className="text-base font-bold text-white tracking-wide uppercase">
                            Gráfico Comparativo
                          </h3>
                        </div>
                        <select
                          value={chartMetric}
                          onChange={(e) => setChartMetric(e.target.value as CompareMetricKey)}
                          className="bg-[#080d0a] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none font-semibold cursor-pointer"
                        >
                          {COMPARE_METRICS.map((m) => (
                            <option key={m.key} value={m.key}>
                              {m.label} ({m.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      {chartData.length === 0 || !selectedMetric ? (
                        <p className="text-xs text-gray-400 text-center py-8">
                          Nenhum atleta possui dados registrados para esta métrica ainda.
                        </p>
                      ) : (
                        <>
                          <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={chartData}
                                layout="vertical"
                                margin={{ top: 8, right: 40, bottom: 8, left: 8 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#0d221a" horizontal={false} />
                                <XAxis
                                  type="number"
                                  domain={['dataMin - 4', 'dataMax + 4']}
                                  stroke="#4b5563"
                                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                                />
                                <YAxis
                                  type="category"
                                  dataKey="name"
                                  width={100}
                                  stroke="#4b5563"
                                  tick={{ fontSize: 11, fill: '#d1d5db' }}
                                />
                                <Tooltip
                                  cursor={{ fill: 'rgba(16,185,129,0.06)' }}
                                  contentStyle={{
                                    backgroundColor: '#0a0d0b',
                                    border: '1px solid rgba(16,185,129,0.35)',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                  }}
                                  labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                                  itemStyle={{ color: '#6ee7b7' }}
                                  formatter={(value: any) => `${formatNumber(Number(value))} ${selectedMetric.unit}`}
                                />
                                <Bar dataKey="value" radius={[0, 8, 8, 0]} maxBarSize={28}>
                                  {chartData.map((d, i) => (
                                    <Cell key={d.id} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          {/* Legenda de cores */}
                          <div className="flex flex-wrap items-center gap-3 mt-3">
                            {chartData.map((d, i) => (
                              <span
                                key={d.id}
                                className="flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold"
                              >
                                <span
                                  className="w-2.5 h-2.5 rounded-sm"
                                  style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
                                />
                                {d.name}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
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
