'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { User, EvolutionMetric, EvolutionResponse } from '@/lib/types';
import {
  TrendingUp,
  Activity,
  Ruler,
  Weight,
  Maximize2,
  Armchair,
  MoveVertical,
  ArrowUp,
  Zap,
  ArrowUpRight,
  Shield,
  CalendarDays,
  Trophy,
  ArrowDownRight,
  Minus,
  Flag,
  CalendarRange,
} from 'lucide-react';

const PERIOD_OPTIONS = [
  { value: '', label: 'Todo o histórico' },
  { value: '3', label: 'Últimos 3 meses' },
  { value: '6', label: 'Últimos 6 meses' },
  { value: '12', label: 'Últimos 12 meses' },
];

const METRIC_ICONS: Record<string, React.ReactNode> = {
  height: <Ruler className="w-5 h-5" />,
  weight: <Weight className="w-5 h-5" />,
  wingspan: <Maximize2 className="w-5 h-5" />,
  seated_height: <Armchair className="w-5 h-5" />,
  reach_standing: <MoveVertical className="w-5 h-5" />,
  reach_jumping: <ArrowUp className="w-5 h-5" />,
  vertical_jump: <Zap className="w-5 h-5" />,
  attack_reach: <ArrowUpRight className="w-5 h-5" />,
  block_reach: <Shield className="w-5 h-5" />,
};

interface EvolutionPoint {
  date: string;
  value: number;
}

const formatNumber = (value: number): string =>
  Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 1 });

const formatDate = (dateStr: string, opts?: Intl.DateTimeFormatOptions): string => {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(
    'pt-BR',
    opts || { day: '2-digit', month: 'short', year: 'numeric' }
  );
};

interface SummaryBlockProps {
  title: string;
  date: string | null;
  value: number | null;
  unit: string;
}

function SummaryBlock({ title, date, value, unit }: SummaryBlockProps) {
  return (
    <div className="p-3 rounded-xl bg-[#080d0a] border border-emerald-950/80">
      <span className="text-[10px] text-gray-500 uppercase block font-semibold mb-1">
        {title}
      </span>
      <span className="font-mono text-sm font-extrabold text-white block">
        {value !== null ? formatNumber(value) : '—'}{' '}
        {value !== null && <span className="text-[10px] text-gray-400 font-semibold">{unit}</span>}
      </span>
      {date && (
        <span className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
          <CalendarDays className="w-3 h-3" />
          {formatDate(date)}
        </span>
      )}
    </div>
  );
}

interface MetricEvolutionCardProps {
  metric: EvolutionMetric;
  chartId: string;
}

function MetricEvolutionCard({ metric, chartId }: MetricEvolutionCardProps) {
  const points: EvolutionPoint[] = metric.points || [];
  const summary = metric.summary;

  const diff = summary.difference;
  const diffStr = diff === null || diff === undefined ? '—' : (diff > 0 ? '+' : '') + formatNumber(diff);
  const diffColor =
    diff === null || diff === undefined
      ? 'text-gray-400'
      : diff > 0
        ? 'text-emerald-400'
        : diff < 0
          ? 'text-red-400'
          : 'text-gray-300';
  const diffIcon =
    diff === null || diff === undefined
      ? <Minus className="w-3 h-3" />
      : diff > 0
        ? <ArrowUpRight className="w-3 h-3" />
        : diff < 0
          ? <ArrowDownRight className="w-3 h-3" />
          : <Minus className="w-3 h-3" />;

  const chartData = useMemo(
    () =>
      points.map((p) => ({
        label: formatDate(p.date, { day: '2-digit', month: '2-digit', year: '2-digit' }),
        value: p.value,
      })),
    [points]
  );

  const MetricTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0b100d] border border-emerald-500/40 px-3.5 py-2.5 rounded-xl shadow-neon text-xs">
          <p className="font-bold text-white mb-1 border-b border-emerald-950 pb-1">{label}</p>
          <p className="text-emerald-400 font-mono font-bold">
            {formatNumber(payload[0].value)} {metric.unit}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="athletic-card rounded-2xl p-5 sm:p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-emerald-950/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-2.5 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 shrink-0">
            {METRIC_ICONS[metric.key] || <Activity className="w-5 h-5" />}
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-black text-white uppercase tracking-wide truncate">
              {metric.label}
            </h3>
            <span className="text-xs text-gray-400 font-mono">Unidade: {metric.unit}</span>
          </div>
        </div>

        {/* Difference badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shrink-0 ${
            diff !== null && diff > 0
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : diff !== null && diff < 0
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-white/[0.03] border-emerald-950/80'
          }`}
        >
          <span className={diffColor}>{diffIcon}</span>
          <span className={`font-mono text-sm font-extrabold ${diffColor}`}>{diffStr}</span>
        </div>
      </div>

      {/* Summary blocks: first / latest / best */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryBlock
          title="1ª Avaliação"
          date={summary.first?.date || null}
          value={summary.first?.value ?? null}
          unit={metric.unit}
        />
        <SummaryBlock
          title="Mais Recente"
          date={summary.latest?.date || null}
          value={summary.latest?.value ?? null}
          unit={metric.unit}
        />
        <SummaryBlock
          title="Melhor Registrado"
          date={summary.best?.date || null}
          value={summary.best?.value ?? null}
          unit={metric.unit}
        />
      </div>

      {/* Chart */}
      {chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl bg-[#080d0a]/60 border border-dashed border-emerald-950/80 text-center">
          <CalendarRange className="w-8 h-8 text-gray-600" />
          <p className="text-sm font-semibold text-gray-400">Sem registros no período</p>
          <p className="text-xs text-gray-500">
            Nenhuma avaliação registrada dentro do intervalo selecionado para esta métrica.
          </p>
        </div>
      ) : (
        <div className="w-full h-52 sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#16261d" />
              <XAxis
                dataKey="label"
                stroke="#6b7280"
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                tickLine={false}
              />
              <YAxis
                stroke="#6b7280"
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                tickLine={false}
                domain={['dataMin - 3', 'dataMax + 3']}
              />
              <Tooltip content={<MetricTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                name={metric.label}
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill={`url(#grad-${chartId})`}
                dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#052e1b' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default function EvolucaoPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<EvolutionResponse & { filteredByDate?: boolean } | null>(null);
  const [period, setPeriod] = useState('');
  const [error, setError] = useState('');

  const fetchEvolution = async (currentPeriod: string) => {
    setLoading(true);
    setError('');
    try {
      const authRes = await fetch('/api/auth/me');
      if (!authRes.ok) {
        router.push('/login');
        return;
      }
      const authData = await authRes.json();
      setUser(authData.user);

      const query = currentPeriod ? `?periodo=${currentPeriod}` : '';
      const res = await fetch(`/api/evolucao${query}`);
      if (!res.ok) {
        throw new Error('Falha ao carregar dados de evolução.');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('Error fetching evolution:', err);
      setError(err.message || 'Erro ao carregar evolução.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvolution(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#070908] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-emerald-400">Carregando sua evolução...</p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || [];
  const evaluationCount = data?.evaluationCount || 0;
  const filteredByDate = Boolean(data?.filteredByDate);

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
          title="Minha Evolução"
          subtitle="Progressão física e de desempenho ao longo do tempo"
        />

        <main className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Header Banner + Período */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#0d1612] via-[#09120e] to-[#070908] border border-emerald-500/30">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide">
                  Análise de Evolução
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-300">
                Você possui <span className="text-emerald-400 font-bold font-mono">{evaluationCount}</span>{' '}
                {evaluationCount === 1 ? 'avaliação registrada' : 'avaliações registradas'} no período
                {filteredByDate ? ' filtrado.' : '.'}
              </p>
            </div>

            {/* Período chip + select */}
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wide flex items-center gap-1.5">
                <CalendarRange className="w-3.5 h-3.5" />
                Período
              </span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-[#090d0b] border border-emerald-950 hover:border-emerald-500/40 focus:border-emerald-500 focus:outline-none text-sm text-white font-semibold cursor-pointer transition-colors"
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#090d0b]">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-950/30 border border-red-900/50 text-sm text-red-300 font-semibold">
              {error}
            </div>
          )}

          {/* Empty state: no evaluations at all */}
          {evaluationCount === 0 ? (
            <div className="athletic-card rounded-3xl p-10 sm:p-14 text-center border-dashed">
              <Activity className="w-14 h-14 text-emerald-500/40 mx-auto mb-4 animate-pulse" />
              <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wide">
                Sua evolução começa aqui
              </h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
                Nenhuma avaliação física foi registrada ainda. Cadastre sua primeira avaliação para
                desbloquear gráficos, records e a análise completa da sua progressão.
              </p>
              <Link
                href="/avaliacao"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wide shadow-neon transition-all"
              >
                <Flag className="w-4 h-4" />
                <span>Criar Primeira Avaliação</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {metrics.map((metric, index) => (
                <MetricEvolutionCard
                  key={metric.key}
                  metric={metric}
                  chartId={`metric-${metric.key}-${index}`}
                />
              ))}
            </div>
          )}

          {/* Best highlight */}
          {evaluationCount > 0 && metrics.some((m) => m.summary.best) && (
            <div className="athletic-card rounded-2xl p-5 flex items-center gap-3">
              <Trophy className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-xs sm:text-sm text-gray-300">
                O bloco <span className="text-emerald-400 font-bold">"Melhor Registrado"</span> e a
                diferença do período marcam seu{' '}
                <span className="text-emerald-400 font-bold">record histórico</span> em cada métrica
                — mantenha o ritmo!
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
