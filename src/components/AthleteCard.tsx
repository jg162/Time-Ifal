import React from 'react';
import Link from 'next/link';
import { TeamAthlete } from '@/lib/types';
import { Lock, ArrowUpRight, Award, Zap, Ruler } from 'lucide-react';

interface AthleteCardProps {
  athlete: TeamAthlete;
  onSelect?: (athlete: TeamAthlete) => void;
  isCurrentUser?: boolean;
}

export default function AthleteCard({ athlete, onSelect, isCurrentUser }: AthleteCardProps) {
  const positionColors: Record<string, string> = {
    'Levantador': 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40',
    'Central': 'bg-amber-950/60 text-amber-300 border-amber-500/40',
    'Líbero': 'bg-blue-950/60 text-blue-300 border-blue-500/40',
    'Ponteiro': 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40',
    'Oposto': 'bg-purple-950/60 text-purple-300 border-purple-500/40',
  };

  return (
    <div
      onClick={() => onSelect && onSelect(athlete)}
      className="athletic-card relative rounded-2xl p-5 cursor-pointer group flex flex-col justify-between"
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={athlete.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(athlete.name)}`}
                alt={athlete.name}
                className="w-13 h-13 w-12 h-12 rounded-xl object-cover border border-emerald-500/40 bg-emerald-950/30 group-hover:border-emerald-400 transition-colors shadow-sm"
              />
              {isCurrentUser && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-black" title="Você" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors truncate max-w-[150px] sm:max-w-[180px]">
                  {athlete.name}
                </h4>
                {isCurrentUser && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40">
                    Você
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {athlete.age ? `${athlete.age} anos` : 'Idade ñ informada'}
              </p>
            </div>
          </div>

          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border tracking-wide ${positionColors[athlete.position] || 'bg-gray-800 text-gray-300 border-gray-700'}`}>
            {athlete.position}
          </span>
        </div>

        {/* Physical Measurements Grid */}
        <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-black/40 border border-emerald-950/80 mb-3 text-xs">
          {/* Altura */}
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Altura</span>
            <span className="font-mono font-bold text-white text-sm">
              {athlete.height !== null && athlete.height !== undefined ? (
                `${athlete.height} cm`
              ) : (
                <span className="text-gray-500 text-xs font-mono">--</span>
              )}
            </span>
          </div>

          {/* Peso */}
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Peso</span>
            <span className="font-mono font-bold text-white text-sm">
              {athlete.weight !== null && athlete.weight !== undefined ? (
                `${athlete.weight} kg`
              ) : (
                <span className="text-gray-500 text-xs font-mono">--</span>
              )}
            </span>
          </div>

          {/* Alcance Parado */}
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Alcance Parado</span>
            <span className="font-mono font-bold text-white text-sm">
              {athlete.reach_standing !== null && athlete.reach_standing !== undefined ? (
                `${athlete.reach_standing} cm`
              ) : (
                <span className="text-gray-500 text-xs font-mono">--</span>
              )}
            </span>
          </div>

          {/* Alcance Pulando */}
          <div className="flex flex-col">
            <span className="text-[10px] text-emerald-400 uppercase font-bold flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" /> Alcance Pulando
            </span>
            <span className="font-mono font-extrabold text-emerald-300 text-sm">
              {athlete.reach_jumping !== null && athlete.reach_jumping !== undefined ? (
                `${athlete.reach_jumping} cm`
              ) : (
                <span className="text-gray-500 text-xs font-mono">--</span>
              )}
            </span>
          </div>

          {/* Envergadura */}
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Envergadura</span>
            <span className="font-mono font-bold text-white text-sm">
              {athlete.wingspan !== null && athlete.wingspan !== undefined ? (
                `${athlete.wingspan} cm`
              ) : (
                <span className="text-gray-500 text-xs font-mono">--</span>
              )}
            </span>
          </div>

          {/* Salto Vertical Calculado */}
          <div className="flex flex-col">
            <span className="text-[10px] text-sky-400 uppercase font-semibold">Salto Vertical</span>
            <span className="font-mono font-bold text-sky-300 text-sm">
              {athlete.vertical_jump !== null && athlete.vertical_jump !== undefined ? (
                `+${athlete.vertical_jump} cm`
              ) : (
                <span className="text-gray-500 text-xs font-mono">--</span>
              )}
            </span>
          </div>
        </div>

        {/* Mastered Serves Preview */}
        {athlete.serve_types && athlete.serve_types.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {athlete.serve_types.slice(0, 2).map((s) => (
              <span key={s} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-900/40">
                {s}
              </span>
            ))}
            {athlete.serve_types.length > 2 && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-gray-500 bg-white/[0.03]">
                +{athlete.serve_types.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Action Link */}
      <div className="pt-2 border-t border-emerald-950/60 flex items-center justify-between text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
        <span>Ver perfil e avaliações</span>
        <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </div>
  );
}
