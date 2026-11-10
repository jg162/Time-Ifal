'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { TeamAthlete, Evaluation } from '@/lib/types';
import { X, Lock, Zap, Calendar, Target, Shield, ArrowRight, Activity } from 'lucide-react';
import EvolutionCharts from './EvolutionCharts';

interface AthleteModalProps {
  athlete: TeamAthlete | null;
  onClose: () => void;
  currentUserId?: string | null;
}

export default function AthleteModal({ athlete, onClose, currentUserId }: AthleteModalProps) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!athlete) return;
    setLoading(true);
    fetch(`/api/team/${athlete.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.evaluations) {
          setEvaluations(data.evaluations);
        }
      })
      .catch((err) => console.error('Error fetching athlete details:', err))
      .finally(() => setLoading(false));
  }, [athlete]);

  if (!athlete) return null;

  const isSelf = currentUserId === athlete.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-[#0a0e0c] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/40 my-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-emerald-950/60">
          <img
            src={athlete.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(athlete.name)}`}
            alt={athlete.name}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-neon"
          />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-2xl font-black text-white tracking-wide">
                {athlete.name}
              </h2>
              {isSelf && (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/40">
                  Seu Perfil
                </span>
              )}
              <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                {athlete.position}
              </span>
            </div>
            <p className="text-sm text-gray-400 flex items-center gap-3">
              <span>{athlete.age ? `${athlete.age} anos` : 'Idade ñ informada'}</span>
              <span>•</span>
              <span className="text-emerald-400/80 font-medium">TIME IFAL</span>
              {athlete.last_updated && (
                <>
                  <span>•</span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Atualizado em {athlete.last_updated}
                  </span>
                </>
              )}
            </p>
          </div>

          <Link
            href={`/time/${athlete.id}`}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-950 hover:border-emerald-500/40 transition-colors"
          >
            <span>Página Completa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Physical Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 my-6">
          {/* Altura */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-950/80">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Altura</span>
            <p className="text-lg font-mono font-bold text-white">
              {athlete.height !== null && athlete.height !== undefined ? (
                `${athlete.height} cm`
              ) : (
                <span className="text-gray-500 text-xs font-mono">--</span>
              )}
            </p>
          </div>

          {/* Peso */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-950/80">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Peso</span>
            <p className="text-lg font-mono font-bold text-white">
              {athlete.weight !== null && athlete.weight !== undefined ? (
                `${athlete.weight} kg`
              ) : (
                <span className="text-gray-500 text-xs font-mono">--</span>
              )}
            </p>
          </div>

          {/* Alcance Parado */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-950/80">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Alcance Parado</span>
            <p className="text-lg font-mono font-bold text-white">
              {athlete.reach_standing !== null && athlete.reach_standing !== undefined ? (
                `${athlete.reach_standing} cm`
              ) : (
                <span className="text-gray-500 text-xs font-mono">--</span>
              )}
            </p>
          </div>

          {/* Alcance Pulando */}
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 shadow-neon">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
              <Zap className="w-3 h-3" /> Alcance Pulando
            </span>
            <p className="text-lg font-mono font-extrabold text-emerald-300">
              {athlete.reach_jumping !== null && athlete.reach_jumping !== undefined ? (
                `${athlete.reach_jumping} cm`
              ) : (
                <span className="text-gray-500 text-xs font-mono">--</span>
              )}
            </p>
          </div>

          {/* Salto Vertical */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-950/80">
            <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider block mb-1">Salto Vertical</span>
            <p className="text-lg font-mono font-bold text-sky-300">
              {athlete.vertical_jump !== null && athlete.vertical_jump !== undefined ? (
                `+${athlete.vertical_jump} cm`
              ) : (
                <span className="text-gray-500 text-xs font-mono">--</span>
              )}
            </p>
          </div>

          {/* Envergadura */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-950/80">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Envergadura</span>
            <p className="text-lg font-mono font-bold text-white">
              {athlete.wingspan !== null && athlete.wingspan !== undefined ? (
                `${athlete.wingspan} cm`
              ) : (
                <span className="text-gray-500 text-xs font-mono">--</span>
              )}
            </p>
          </div>
        </div>

        {/* Technical Info & Serves */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Saques */}
          <div className="athletic-card p-4 rounded-xl">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" /> Tipos de Saque Dominados
            </h4>
            {athlete.serve_types && athlete.serve_types.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {athlete.serve_types.map((serve) => (
                  <span
                    key={serve}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                  >
                    {serve}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">Nenhum saque cadastrado.</p>
            )}
          </div>

          {/* Objetivos */}
          <div className="athletic-card p-4 rounded-xl">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-400" /> Objetivos e Metas
            </h4>
            {athlete.goals ? (
              <p className="text-xs text-gray-300 leading-relaxed italic bg-black/30 p-2.5 rounded-lg border border-emerald-950/60">
                "{athlete.goals}"
              </p>
            ) : (
              <p className="text-xs text-gray-500 italic">
                Nenhum objetivo cadastrado no momento.
              </p>
            )}
          </div>
        </div>

        {/* Evolução Histórica */}
        <div className="mt-6">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" /> Histórico de Evolução
          </h4>
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">Carregando histórico do atleta...</div>
          ) : evaluations.length > 0 ? (
            <EvolutionCharts evaluations={evaluations} />
          ) : (
            <div className="p-6 rounded-xl bg-black/40 border border-emerald-950 text-center text-xs text-gray-400">
              O atleta ainda não possui avaliações físicas registradas.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
