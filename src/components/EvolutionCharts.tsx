'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { Evaluation } from '@/lib/types';
import { TrendingUp, Activity, BarChart3, Maximize2 } from 'lucide-react';

interface EvolutionChartsProps {
  evaluations: Evaluation[];
}

export default function EvolutionCharts({ evaluations }: EvolutionChartsProps) {
  const [activeMetric, setActiveMetric] = useState<'jump' | 'height' | 'weight' | 'wingspan' | 'bmi' | 'all'>('jump');

  if (!evaluations || evaluations.length === 0) {
    return (
      <div className="athletic-card rounded-2xl p-8 text-center border-dashed border-emerald-950">
        <Activity className="w-12 h-12 text-emerald-500/40 mx-auto mb-3 animate-pulse" />
        <h3 className="text-lg font-bold text-white mb-1">Nenhuma avaliação histórica disponível</h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          Registre sua primeira avaliação física para começar a visualizar os gráficos de evolução e métricas de desempenho.
        </p>
      </div>
    );
  }

  // Sort chronologically
  const sorted = [...evaluations].sort((a, b) => new Date(a.evaluation_date).getTime() - new Date(b.evaluation_date).getTime());

  // Format data for Recharts
  const chartData = sorted.map((item) => {
    const d = new Date(item.evaluation_date);
    const dateFormatted = !isNaN(d.getTime()) 
      ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
      : item.evaluation_date;

    return {
      date: dateFormatted,
      fullDate: item.evaluation_date,
      height: item.height,
      weight: item.weight,
      reach_standing: item.reach_standing,
      reach_jumping: item.reach_jumping,
      vertical_jump: item.vertical_jump,
      wingspan: item.wingspan,
      bmi: item.bmi,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0b100d] border border-emerald-500/40 p-3.5 rounded-xl shadow-neon text-xs">
          <p className="font-bold text-white mb-2 border-b border-emerald-950 pb-1 flex items-center justify-between gap-4">
            <span>Avaliação</span>
            <span className="text-emerald-400 font-mono">{label}</span>
          </p>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => (
              <div key={`item-${index}`} className="flex items-center justify-between gap-4">
                <span className="text-gray-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}:
                </span>
                <span className="font-bold font-mono text-white">
                  {entry.value} {entry.unit || ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="athletic-card rounded-2xl p-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-emerald-950/60">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white tracking-wide">
              Evolução Física e de Desempenho
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Histórico de progressão ao longo de {chartData.length} {chartData.length === 1 ? 'avaliação registrada' : 'avaliações registradas'}
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#090d0b] p-1.5 rounded-xl border border-emerald-950/80">
          <button
            onClick={() => setActiveMetric('jump')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeMetric === 'jump'
                ? 'bg-emerald-500 text-black shadow-neon'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Alcance & Salto
          </button>
          <button
            onClick={() => setActiveMetric('height')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeMetric === 'height'
                ? 'bg-emerald-500 text-black shadow-neon'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Altura
          </button>
          <button
            onClick={() => setActiveMetric('weight')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeMetric === 'weight'
                ? 'bg-emerald-500 text-black shadow-neon'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Peso
          </button>
          <button
            onClick={() => setActiveMetric('wingspan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeMetric === 'wingspan'
                ? 'bg-emerald-500 text-black shadow-neon'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Envergadura
          </button>
          <button
            onClick={() => setActiveMetric('bmi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeMetric === 'bmi'
                ? 'bg-emerald-500 text-black shadow-neon'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            IMC
          </button>
        </div>
      </div>

      {/* Main Active Chart */}
      <div className="w-full h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          {activeMetric === 'jump' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E676" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00E676" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorJump" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#16261d" />
              <XAxis dataKey="date" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} domain={['dataMin - 10', 'dataMax + 10']} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              <Area
                type="monotone"
                dataKey="reach_jumping"
                name="Alcance Pulando (cm)"
                unit="cm"
                stroke="#00E676"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorReach)"
              />
              <Area
                type="monotone"
                dataKey="reach_standing"
                name="Alcance Parado (cm)"
                unit="cm"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={0.1}
                fill="#94a3b8"
              />
              <Line
                type="monotone"
                dataKey="vertical_jump"
                name="Salto Vertical (cm)"
                unit="cm"
                stroke="#38bdf8"
                strokeWidth={3}
                dot={{ r: 4, fill: '#38bdf8' }}
              />
            </AreaChart>
          ) : activeMetric === 'height' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#16261d" />
              <XAxis dataKey="date" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="height"
                name="Altura (cm)"
                unit="cm"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorHeight)"
                dot={{ r: 5, fill: '#10b981' }}
              />
            </AreaChart>
          ) : activeMetric === 'weight' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#16261d" />
              <XAxis dataKey="date" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} domain={['dataMin - 3', 'dataMax + 3']} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="weight"
                name="Peso Corporal (kg)"
                unit="kg"
                stroke="#f59e0b"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorWeight)"
                dot={{ r: 5, fill: '#f59e0b' }}
              />
            </AreaChart>
          ) : activeMetric === 'wingspan' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorWingspan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#16261d" />
              <XAxis dataKey="date" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="wingspan"
                name="Envergadura (cm)"
                unit="cm"
                stroke="#a855f7"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorWingspan)"
                dot={{ r: 5, fill: '#a855f7' }}
              />
            </AreaChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#16261d" />
              <XAxis dataKey="date" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 11 }} domain={['dataMin - 1', 'dataMax + 1']} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="bmi"
                name="Índice de Massa Corporal (IMC)"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{ r: 5, fill: '#22c55e' }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
