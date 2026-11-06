'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import MetricCard from '@/components/MetricCard';
import EvolutionCharts from '@/components/EvolutionCharts';
import { User, Profile, Evaluation } from '@/lib/types';
import { getBMICategory, getJumpCategory } from '@/lib/calculations';
import {
  Zap,
  Ruler,
  Weight,
  Maximize2,
  Calendar,
  Target,
  PlusCircle,
  Users,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Award,
  ClipboardList,
  Trophy,
  ArrowLeftRight
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [latestEval, setLatestEval] = useState<Evaluation | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const authRes = await fetch('/api/auth/me');
        if (!authRes.ok) {
          router.push('/login');
          return;
        }

        const authData = await authRes.json();
        setUser(authData.user);
        setProfile(authData.profile);
        setLatestEval(authData.latestEvaluation);

        const evalRes = await fetch('/api/evaluations');
        if (evalRes.ok) {
          const evalData = await evalRes.json();
          setEvaluations(evalData.evaluations || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070908] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-emerald-400 tracking-wider uppercase">
            Carregando Painel do Atleta...
          </p>
        </div>
      </div>
    );
  }

  const bmiBadge = latestEval ? getBMICategory(latestEval.bmi) : null;
  const jumpBadge = latestEval ? getJumpCategory(latestEval.vertical_jump) : null;

  return (
    <div className="min-h-screen bg-[#070908] text-white flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentUser={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(true)}
          currentUser={user}
          title="Início"
          subtitle="Visão geral do desempenho físico e técnico do atleta"
        />

        <main className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* ATHLETE HERO BANNER */}
          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#0c1611] via-[#0e1c15] to-[#070908] border border-emerald-500/30 shadow-card">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <img
                    src={user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user?.name || 'atleta')}`}
                    alt={user?.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-emerald-400 shadow-neon"
                  />
                  <div className="absolute -bottom-2 -right-2 p-1.5 rounded-lg bg-emerald-500 text-black shadow-sm" title="Atleta Ativo">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {user?.name}
                    </h2>
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm">
                      {latestEval?.position || profile?.preferred_position || 'Ponteiro'}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-emerald-400 font-semibold">TIME IFAL · VOLLEY PERFORMANCE</span>
                    <span>•</span>
                    <span>{latestEval?.age ? `${latestEval.age} anos` : 'Idade pendente'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-gray-400">
                      <Calendar className="w-3.5 h-3.5" />
                      Última atualização: {latestEval?.evaluation_date ? new Date(latestEval.evaluation_date + 'T00:00:00').toLocaleDateString('pt-BR') : 'Nenhuma avaliação'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <Link
                  href="/avaliacao"
                  className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs sm:text-sm tracking-wide uppercase shadow-neon hover:shadow-neon-strong transition-all flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Nova Avaliação</span>
                </Link>
                <Link
                  href="/time"
                  className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white border border-emerald-950 hover:border-emerald-500/30 text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Ver Time</span>
                </Link>
              </div>
            </div>
          </div>

          {/* QUICK SHORTCUTS */}
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {/* Nova avaliação (destaque emerald) */}
              <Link
                href="/avaliacao"
                className="rounded-2xl p-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 hover:border-emerald-400/60 transition-all"
              >
                <div className="p-2 w-fit rounded-lg bg-emerald-500 text-black shadow-neon mb-3">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-emerald-300">Nova avaliação</p>
              </Link>

              {/* Histórico */}
              <Link
                href="/avaliacoes"
                className="rounded-2xl p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-emerald-950 hover:border-emerald-500/40 transition-all group"
              >
                <div className="p-2 w-fit rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-3">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-gray-300 group-hover:text-white">
                  Histórico
                </p>
              </Link>

              {/* Time */}
              <Link
                href="/time"
                className="rounded-2xl p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-emerald-950 hover:border-emerald-500/40 transition-all group"
              >
                <div className="p-2 w-fit rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-3">
                  <Users className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-gray-300 group-hover:text-white">
                  Time
                </p>
              </Link>

              {/* Rankings */}
              <Link
                href="/rankings"
                className="rounded-2xl p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-emerald-950 hover:border-emerald-500/40 transition-all group"
              >
                <div className="p-2 w-fit rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-3">
                  <Trophy className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-gray-300 group-hover:text-white">
                  Rankings
                </p>
              </Link>

              {/* Comparar */}
              <Link
                href="/comparar"
                className="rounded-2xl p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-emerald-950 hover:border-emerald-500/40 transition-all group"
              >
                <div className="p-2 w-fit rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-3">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-gray-300 group-hover:text-white">
                  Comparar
                </p>
              </Link>

              {/* Metas */}
              <Link
                href="/metas"
                className="rounded-2xl p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-emerald-950 hover:border-emerald-500/40 transition-all group"
              >
                <div className="p-2 w-fit rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-3">
                  <Target className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-gray-300 group-hover:text-white">
                  Metas
                </p>
              </Link>
            </div>
          </div>

          {/* NO EVALUATION WARNING BANNER (if user has 0 evaluations) */}
          {!latestEval && (
            <div className="p-6 rounded-2xl bg-amber-950/30 border border-amber-600/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-base font-bold text-white mb-1">
                    Você ainda não cadastrou nenhuma avaliação física!
                  </h4>
                  <p className="text-xs text-gray-300">
                    Registre suas primeiras medidas para ativar seus indicadores, impulsão vertical, gráficos de evolução e comparativos do time.
                  </p>
                </div>
              </div>
              <Link
                href="/avaliacao"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wide transition-all shadow-md flex items-center gap-2"
              >
                <span>Fazer Primeira Avaliação</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* KEY METRICS GRID */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Resumo das Medidas e Desempenho
              </h3>
              <Link
                href="/avaliacoes"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <span>Ver histórico completo ({evaluations.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Alcance Pulando (Destaque Neon) */}
              <MetricCard
                title="Alcance Pulando"
                value={latestEval?.reach_jumping ?? '--'}
                unit="cm"
                subtitle="Ataque / Bloqueio em salto"
                icon={Zap}
                highlight={true}
                badge={{
                  text: jumpBadge?.label || 'Pendente',
                  color: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                }}
              />

              {/* Salto Vertical Calculado */}
              <MetricCard
                title="Salto Vertical"
                value={latestEval?.vertical_jump ? `+${latestEval.vertical_jump}` : '--'}
                unit="cm"
                subtitle="Impulsão líquida do atleta"
                icon={TrendingUp}
                badge={{
                  text: 'Calculado',
                  color: 'bg-sky-950/60 text-sky-400 border-sky-600/40'
                }}
              />

              {/* Altura */}
              <MetricCard
                title="Altura"
                value={latestEval?.height ?? '--'}
                unit="cm"
                subtitle={`Envergadura: ${latestEval?.wingspan ? `${latestEval.wingspan} cm` : '--'}`}
                icon={Ruler}
              />

              {/* Peso & IMC */}
              <MetricCard
                title="Peso Corporal & IMC"
                value={latestEval?.weight ?? '--'}
                unit="kg"
                subtitle={`IMC: ${latestEval?.bmi ? `${latestEval.bmi} kg/m²` : '--'}`}
                icon={Weight}
                badge={{
                  text: bmiBadge?.label || 'Aguardando',
                  color: bmiBadge?.color || 'bg-gray-800 text-gray-400 border-gray-700'
                }}
              />
            </div>
          </div>

          {/* OBJECTIVES & TECHNICAL INFO */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Objetivos Cadastrados */}
            <div className="lg:col-span-2 athletic-card rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-emerald-950/60">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-base font-bold text-white tracking-wide uppercase">
                      Objetivos e Metas Cadastradas
                    </h4>
                  </div>
                  <Link
                    href="/avaliacao"
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    Atualizar Metas
                  </Link>
                </div>

                {latestEval?.goals || profile?.bio_goals ? (
                  <p className="text-sm text-gray-300 leading-relaxed italic bg-black/40 p-4 rounded-xl border border-emerald-950/80">
                    "{latestEval?.goals || profile?.bio_goals}"
                  </p>
                ) : (
                  <div className="text-center py-6 text-xs text-gray-500">
                    Nenhum objetivo registrado ainda. Clique em "Nova Avaliação" para detalhar suas metas de voleibol.
                  </div>
                )}
              </div>

              {/* Tipos de Saque Dominados */}
              <div className="mt-6 pt-4 border-t border-emerald-950/60">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2.5">
                  Saques Praticados pelo Atleta:
                </span>
                <div className="flex flex-wrap gap-2">
                  {(latestEval?.serve_types || profile?.serve_types || ['Flutuante pulando']).map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Links & Squad Status */}
            <div className="athletic-card rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h4 className="text-base font-bold text-white tracking-wide uppercase mb-4 pb-3 border-b border-emerald-950/60 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  Elenco TIME IFAL · VOLLEY PERFORMANCE
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed mb-4">
                  Acompanhe os alcances verticais, alturas e estatísticas físicas de todos os companheiros de equipe na área coletiva.
                </p>
                <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-950/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-gray-300">
                    <span>Suas avaliações salvas:</span>
                    <span className="font-bold text-white font-mono">{evaluations.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-300">
                    <span>Posição ativa:</span>
                    <span className="font-bold text-emerald-400">
                      {latestEval?.position || profile?.preferred_position || 'Ponteiro'}
                    </span>
                  </div>
                  {latestEval?.attack_reach != null && (
                    <div className="flex items-center justify-between text-gray-300">
                      <span>Alcance de ataque:</span>
                      <span className="font-bold text-white font-mono">{latestEval.attack_reach} cm</span>
                    </div>
                  )}
                  {latestEval?.block_reach != null && (
                    <div className="flex items-center justify-between text-gray-300">
                      <span>Alcance de bloqueio:</span>
                      <span className="font-bold text-white font-mono">{latestEval.block_reach} cm</span>
                    </div>
                  )}
                </div>
              </div>

              <Link
                href="/time"
                className="mt-6 w-full py-3 rounded-xl bg-white/[0.04] hover:bg-emerald-500/20 text-emerald-300 border border-emerald-950 hover:border-emerald-500/40 text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2"
              >
                <span>Acessar Área do Time</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* EVOLUTION CHARTS PREVIEW */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Acompanhamento de Evolução
              </h3>
            </div>
            <EvolutionCharts evaluations={evaluations} />
          </div>
        </main>
      </div>
    </div>
  );
}
