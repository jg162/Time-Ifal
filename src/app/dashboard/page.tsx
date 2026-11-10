'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import MetricCard from '@/components/MetricCard';
import EvolutionCharts from '@/components/EvolutionCharts';
import { User, Profile, Evaluation, Team } from '@/lib/types';
import { getBMICategory, getJumpCategory, calculateAge } from '@/lib/calculations';
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
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  Info
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [latestEval, setLatestEval] = useState<Evaluation | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [team, setTeam] = useState<Team | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [authRes, evalRes, teamRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/evaluations'),
          fetch('/api/team')
        ]);

        if (!authRes.ok) {
          router.push('/login');
          return;
        }

        const authData = await authRes.json();
        setUser(authData.user);
        setProfile(authData.profile);
        setLatestEval(authData.latestEvaluation);

        if (evalRes.ok) {
          const evalData = await evalRes.json();
          setEvaluations(evalData.evaluations || []);
        }

        if (teamRes.ok) {
          const teamData = await teamRes.json();
          setTeam(teamData.team || authData.team || null);
        } else if (authData.team) {
          setTeam(authData.team);
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
            Carregando Painel TIME IFAL...
          </p>
        </div>
      </div>
    );
  }

  const bmiBadge = latestEval ? getBMICategory(latestEval.bmi) : null;
  const jumpBadge = latestEval ? getJumpCategory(latestEval.vertical_jump) : null;

  // Idade real calculada
  const athleteAge = latestEval?.age || (profile?.birth_date ? calculateAge(profile.birth_date) : null);
  const athletePosition = latestEval?.position || profile?.preferred_position || null;

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
          subtitle="TIME IFAL · Painel principal de acompanhamento do atleta"
        />

        <main className="p-3 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-7xl mx-auto w-full pb-28 lg:pb-8">
          {/* ATHLETE HERO BANNER */}
          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#0c1611] via-[#0e1c15] to-[#070908] border border-emerald-500/30 shadow-card">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <img
                    src={user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user?.name || 'atleta')}`}
                    alt={user?.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-emerald-400 shadow-neon bg-emerald-950/40"
                  />
                  <div className="absolute -bottom-2 -right-2 p-1.5 rounded-lg bg-emerald-500 text-black shadow-sm" title="Atleta TIME IFAL">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {user?.name}
                    </h2>
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm">
                      {athletePosition || 'Posição pendente'}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-emerald-400 font-bold tracking-wide">
                      {team ? team.name : 'TIME IFAL'}
                    </span>
                    <span>•</span>
                    <span>{athleteAge !== null ? `${athleteAge} anos` : 'Idade pendente'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-gray-400">
                      <Calendar className="w-3.5 h-3.5" />
                      Última avaliação: {latestEval?.evaluation_date ? new Date(latestEval.evaluation_date + 'T00:00:00').toLocaleDateString('pt-BR') : 'Nenhuma avaliação realizada'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Quick Actions (sem duplicações) */}
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
                  <span>{team ? 'Ver Time' : 'Entrar em um Time'}</span>
                </Link>
              </div>
            </div>
          </div>

          {/* AVISO: SEM AVALIAÇÕES CADASTRADAS */}
          {!latestEval && (
            <div className="p-6 rounded-2xl bg-amber-950/30 border border-amber-600/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-base font-bold text-white mb-1">
                    Você ainda não cadastrou nenhuma avaliação física!
                  </h4>
                  <p className="text-xs text-gray-300">
                    Registre suas primeiras medidas corporais e de impulsão para ativar seus indicadores, impulsão vertical e histórico no TIME IFAL.
                  </p>
                </div>
              </div>
              <Link
                href="/avaliacao"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wide transition-all shadow-md flex items-center gap-2 flex-shrink-0"
              >
                <span>Fazer Primeira Avaliação</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* AVISO: SEM EQUIPE / TIME VINCULADO */}
          {!team && (
            <div className="p-6 rounded-2xl bg-sky-950/30 border border-sky-600/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Users className="w-6 h-6 text-sky-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-base font-bold text-white mb-1">
                    Você ainda não faz parte de nenhuma equipe no TIME IFAL!
                  </h4>
                  <p className="text-xs text-gray-300">
                    Crie seu próprio time e compartilhe o código de convite com seus colegas de treino, ou insira o código fornecido pelo capitão da sua equipe.
                  </p>
                </div>
              </div>
              <Link
                href="/time"
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs uppercase tracking-wide transition-all shadow-md flex items-center gap-2 flex-shrink-0"
              >
                <span>Área do Time</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* SHORTCUTS GRID (SOMENTE AS 4 FUNCIONALIDADES CENTRAIS ATIVAS) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Nova avaliação */}
            <Link
              href="/avaliacao"
              className="rounded-2xl p-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 hover:border-emerald-400/60 transition-all group"
            >
              <div className="p-2.5 w-fit rounded-xl bg-emerald-500 text-black shadow-neon mb-3 group-hover:scale-105 transition-transform">
                <PlusCircle className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-emerald-300">Nova Avaliação</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Registrar teste físico</p>
            </Link>

            {/* Minhas avaliações */}
            <Link
              href="/avaliacoes"
              className="rounded-2xl p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-emerald-950 hover:border-emerald-500/40 transition-all group"
            >
              <div className="p-2.5 w-fit rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-3 group-hover:scale-105 transition-transform">
                <ClipboardList className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-gray-200 group-hover:text-white">Minhas Avaliações</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Histórico completo ({evaluations.length})</p>
            </Link>

            {/* Meu perfil */}
            <Link
              href="/perfil"
              className="rounded-2xl p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-emerald-950 hover:border-emerald-500/40 transition-all group"
            >
              <div className="p-2.5 w-fit rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-3 group-hover:scale-105 transition-transform">
                <UserIcon className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-gray-200 group-hover:text-white">Meu Perfil</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Dados e ficha técnica</p>
            </Link>

            {/* Time */}
            <Link
              href="/time"
              className="rounded-2xl p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-emerald-950 hover:border-emerald-500/40 transition-all group"
            >
              <div className="p-2.5 w-fit rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-3 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-gray-200 group-hover:text-white">Time</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{team ? team.name : 'Criar ou entrar'}</p>
            </Link>
          </div>

          {/* KEY METRICS GRID (MEDIDAS REAIS DO ATLETA) */}
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
                  text: latestEval ? (jumpBadge?.label || 'Registrado') : 'Sem registro',
                  color: latestEval ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' : 'bg-gray-800 text-gray-400 border-gray-700'
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
                  text: latestEval ? 'Calculado' : 'Aguardando',
                  color: latestEval ? 'bg-sky-950/60 text-sky-400 border-sky-600/40' : 'bg-gray-800 text-gray-400 border-gray-700'
                }}
              />

              {/* Altura */}
              <MetricCard
                title="Altura"
                value={latestEval?.height ?? profile?.height ?? '--'}
                unit="cm"
                subtitle={`Envergadura: ${latestEval?.wingspan ?? profile?.wingspan ? `${latestEval?.wingspan ?? profile?.wingspan} cm` : '--'}`}
                icon={Ruler}
              />

              {/* Peso & IMC */}
              <MetricCard
                title="Peso Corporal & IMC"
                value={latestEval?.weight ?? profile?.weight ?? '--'}
                unit="kg"
                subtitle={`IMC: ${latestEval?.bmi ? `${latestEval.bmi} kg/m²` : '--'}`}
                icon={Weight}
                badge={{
                  text: latestEval ? (bmiBadge?.label || 'Calculado') : 'Aguardando',
                  color: bmiBadge?.color || 'bg-gray-800 text-gray-400 border-gray-700'
                }}
              />
            </div>
          </div>

          {/* OBJECTIVES & TEAM CARD */}
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
                    href="/perfil"
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    Editar no Perfil
                  </Link>
                </div>

                {latestEval?.goals || profile?.bio_goals ? (
                  <p className="text-sm text-gray-300 leading-relaxed italic bg-black/40 p-4 rounded-xl border border-emerald-950/80">
                    "{latestEval?.goals || profile?.bio_goals}"
                  </p>
                ) : (
                  <div className="text-center py-6 text-xs text-gray-500">
                    Nenhum objetivo registrado ainda. Acesse "Meu Perfil" ou cadastre uma "Nova Avaliação" para detalhar suas metas de voleibol.
                  </div>
                )}
              </div>

              {/* Tipos de Saque Dominados */}
              <div className="mt-6 pt-4 border-t border-emerald-950/60">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2.5">
                  Saques Praticados pelo Atleta:
                </span>
                <div className="flex flex-wrap gap-2">
                  {(profile?.serve_types && profile.serve_types.length > 0) ? (
                    profile.serve_types.map((s) => (
                      <span
                        key={s}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                      >
                        {s}
                      </span>
                    ))
                  ) : latestEval?.serve_types && latestEval.serve_types.length > 0 ? (
                    latestEval.serve_types.map((s) => (
                      <span
                        key={s}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500 italic">Nenhum saque cadastrado ainda.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Team Squad Status */}
            <div className="athletic-card rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h4 className="text-base font-bold text-white tracking-wide uppercase mb-4 pb-3 border-b border-emerald-950/60 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  Equipe TIME IFAL
                </h4>
                
                {team ? (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-950/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-gray-300">
                        <span>Nome da Equipe:</span>
                        <strong className="text-white font-bold">{team.name}</strong>
                      </div>
                      <div className="flex items-center justify-between text-gray-300">
                        <span>Código do Time:</span>
                        <span className="font-mono text-emerald-300 font-bold">{team.code}</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-300">
                        <span>Integrantes:</span>
                        <span className="font-mono text-white font-bold">{team.members_count || 1} atleta(s)</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-300">
                        <span>Sua Posição:</span>
                        <span className="text-emerald-400 font-bold">{athletePosition || 'Ponteiro'}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Você está vinculado a uma equipe ativa. Acompanhe os companheiros de time na área coletiva.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Você ainda não está associado a nenhuma equipe. Atletas podem criar uma equipe ou entrar através de um código de convite.
                    </p>
                    <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-950/80 text-xs text-gray-400">
                      <span>Status: </span>
                      <strong className="text-amber-400 font-bold">Sem equipe</strong>
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/time"
                className="mt-6 w-full py-3 rounded-xl bg-white/[0.04] hover:bg-emerald-500/20 text-emerald-300 border border-emerald-950 hover:border-emerald-500/40 text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2"
              >
                <span>{team ? 'Acessar Área do Time' : 'Criar ou Entrar em um Time'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* EVOLUTION CHARTS */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Acompanhamento de Evolução
              </h3>
            </div>
            {evaluations.length > 0 ? (
              <EvolutionCharts evaluations={evaluations} />
            ) : (
              <div className="p-8 rounded-2xl bg-[#0a0f0c] border border-emerald-950/80 text-center">
                <TrendingUp className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-300 mb-1">Sem dados suficientes para gráficos</p>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                  Cadastre suas avaliações físicas para visualizar o gráfico de evolução da impulsão e alcance.
                </p>
                <Link
                  href="/avaliacao"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black text-xs font-bold uppercase shadow-neon"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Cadastrar Avaliação</span>
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Barra de Navegação Inferior para Celular */}
      <BottomNav />
    </div>
  );
}