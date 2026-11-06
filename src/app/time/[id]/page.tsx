'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import EvolutionCharts from '@/components/EvolutionCharts';
import { User, TeamAthlete, Evaluation } from '@/lib/types';
import { 
  ArrowLeft, 
  Lock, 
  Zap, 
  Ruler, 
  Weight, 
  Target, 
  Calendar, 
  Activity, 
  Award,
  Users
} from 'lucide-react';

export default function AthleteProfilePage() {
  const params = useParams();
  const router = useRouter();
  const athleteId = params.id as string;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [athlete, setAthlete] = useState<TeamAthlete | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [isSelf, setIsSelf] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const authRes = await fetch('/api/auth/me');
        if (authRes.ok) {
          const authData = await authRes.json();
          setCurrentUser(authData.user);
        }

        const athleteRes = await fetch(`/api/team/${athleteId}`);
        if (!athleteRes.ok) {
          router.push('/time');
          return;
        }

        const athleteData = await athleteRes.json();
        setAthlete(athleteData.athlete);
        setEvaluations(athleteData.evaluations || []);
        setIsSelf(Boolean(athleteData.isSelf));
      } catch (err) {
        console.error('Error fetching athlete profile:', err);
      } finally {
        setLoading(false);
      }
    }

    if (athleteId) {
      loadData();
    }
  }, [athleteId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070908] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-emerald-400">Carregando perfil do atleta...</p>
        </div>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="min-h-screen bg-[#070908] text-white flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-xl font-bold mb-2">Atleta não encontrado</h2>
          <Link href="/time" className="text-emerald-400 font-bold hover:underline">
            Voltar para a área do time
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070908] text-white flex">
      <Sidebar
        currentUser={currentUser}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(true)}
          currentUser={currentUser}
          title={athlete.name}
          subtitle={`Perfil individual do atleta • ${athlete.position}`}
        />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full">
          {/* Back Navigation */}
          <div>
            <Link
              href="/time"
              className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para o Elenco</span>
            </Link>
          </div>

          {/* Profile Header Hero */}
          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#0c1611] via-[#0e1c15] to-[#070908] border border-emerald-500/30">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <img
                src={athlete.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(athlete.name)}`}
                alt={athlete.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-emerald-400 shadow-neon"
              />

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                    {athlete.name}
                  </h1>
                  <span className="px-3.5 py-1 rounded-lg text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                    {athlete.position}
                  </span>
                  {isSelf && (
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white/[0.05] text-emerald-400 border border-emerald-500/30">
                      Você
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-gray-300 flex flex-wrap items-center gap-3">
                  <span>{athlete.age ? `${athlete.age} anos` : 'Idade ñ informada'}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">Time IFAL de Vôlei</span>
                  {athlete.last_updated && (
                    <>
                      <span>•</span>
                      <span className="text-gray-400 flex items-center gap-1 text-xs">
                        <Calendar className="w-3.5 h-3.5" /> Última avaliação em {athlete.last_updated}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Physical Measurements Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Altura */}
            <div className="athletic-card p-4 rounded-xl">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Altura</span>
              <p className="text-xl font-mono font-bold text-white">
                {athlete.height !== null && athlete.height !== undefined ? (
                  `${athlete.height} cm`
                ) : (
                  <span className="text-gray-500 text-xs flex items-center gap-1 font-sans">
                    <Lock className="w-3.5 h-3.5" /> Privado
                  </span>
                )}
              </p>
            </div>

            {/* Peso */}
            <div className="athletic-card p-4 rounded-xl">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Peso</span>
              <p className="text-xl font-mono font-bold text-white">
                {athlete.weight !== null && athlete.weight !== undefined ? (
                  `${athlete.weight} kg`
                ) : (
                  <span className="text-gray-500 text-xs flex items-center gap-1 font-sans">
                    <Lock className="w-3.5 h-3.5" /> Privado
                  </span>
                )}
              </p>
            </div>

            {/* Alcance Parado */}
            <div className="athletic-card p-4 rounded-xl">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Alcance Parado</span>
              <p className="text-xl font-mono font-bold text-white">
                {athlete.reach_standing !== null && athlete.reach_standing !== undefined ? (
                  `${athlete.reach_standing} cm`
                ) : (
                  <span className="text-gray-500 text-xs flex items-center gap-1 font-sans">
                    <Lock className="w-3.5 h-3.5" /> Privado
                  </span>
                )}
              </p>
            </div>

            {/* Alcance Pulando */}
            <div className="athletic-card p-4 rounded-xl border-emerald-500/40 bg-emerald-950/20 shadow-neon">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                <Zap className="w-3 h-3" /> Alcance Pulando
              </span>
              <p className="text-xl font-mono font-black text-emerald-300">
                {athlete.reach_jumping !== null && athlete.reach_jumping !== undefined ? (
                  `${athlete.reach_jumping} cm`
                ) : (
                  <span className="text-gray-500 text-xs flex items-center gap-1 font-sans">
                    <Lock className="w-3.5 h-3.5" /> Privado
                  </span>
                )}
              </p>
            </div>

            {/* Salto Vertical */}
            <div className="athletic-card p-4 rounded-xl">
              <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider block mb-1">Salto Vertical</span>
              <p className="text-xl font-mono font-bold text-sky-300">
                {athlete.vertical_jump !== null && athlete.vertical_jump !== undefined ? (
                  `+${athlete.vertical_jump} cm`
                ) : (
                  <span className="text-gray-500 text-xs flex items-center gap-1 font-sans">
                    <Lock className="w-3.5 h-3.5" /> Privado
                  </span>
                )}
              </p>
            </div>

            {/* Envergadura */}
            <div className="athletic-card p-4 rounded-xl">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Envergadura</span>
              <p className="text-xl font-mono font-bold text-white">
                {athlete.wingspan !== null && athlete.wingspan !== undefined ? (
                  `${athlete.wingspan} cm`
                ) : (
                  <span className="text-gray-500 text-xs flex items-center gap-1 font-sans">
                    <Lock className="w-3.5 h-3.5" /> Privado
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Serves & Objectives */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="athletic-card p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                Tipos de Saque Executados
              </h3>
              {athlete.serve_types && athlete.serve_types.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {athlete.serve_types.map((serve) => (
                    <span
                      key={serve}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                    >
                      {serve}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">Nenhum saque cadastrado.</p>
              )}
            </div>

            <div className="athletic-card p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                Objetivos e Metas
              </h3>
              {athlete.goals ? (
                <p className="text-xs text-gray-300 leading-relaxed italic bg-black/40 p-4 rounded-xl border border-emerald-950/80">
                  "{athlete.goals}"
                </p>
              ) : (
                <p className="text-xs text-gray-500 italic flex items-center gap-1.5 p-4 rounded-xl bg-black/20">
                  <Lock className="w-4 h-4" /> Informação restrita pelo atleta ou ainda não cadastrada.
                </p>
              )}
            </div>
          </div>

          {/* Historical Evolution Charts */}
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Gráficos de Evolução Histórica
            </h3>
            {evaluations.length > 0 ? (
              <EvolutionCharts evaluations={evaluations} />
            ) : (
              <div className="athletic-card p-8 rounded-2xl text-center text-xs text-gray-400">
                O atleta optou por manter o histórico completo privado ou ainda possui apenas 1 avaliação registrada.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
