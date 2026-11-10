import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicCardBySlug } from '@/lib/db';
import { getAchievementDef } from '@/lib/achievements';
import { AthleteCardData } from '@/lib/types';
import {
  Ruler,
  Maximize2,
  Zap,
  Target,
  Shield,
  BadgeCheck,
  Medal,
  CreditCard,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface CartaoPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: CartaoPageProps): Promise<Metadata> {
  const data = await getPublicCardBySlug(params.slug);
  return {
    title: data
      ? `${data.name} • Carteirinha TIME IFAL`
      : 'Carteirinha pública • TIME IFAL',
  };
}

export default async function CartaoPublicoPage({ params }: CartaoPageProps) {
  const data = await getPublicCardBySlug(params.slug);
  if (!data) notFound();

  const athlete = data as AthleteCardData & { slug: string };
  const name = athlete.name || 'Atleta';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const formatStat = (value: number | null): string =>
    typeof value === 'number' && !isNaN(value) ? `${value} cm` : '—';

  const statItems = [
    { label: 'Altura', value: athlete.height, icon: Ruler },
    { label: 'Envergadura', value: athlete.wingspan, icon: Maximize2 },
    { label: 'Salto Vertical', value: athlete.vertical_jump, icon: Zap },
    { label: 'Alcance de Ataque', value: athlete.attack_reach, icon: Target },
    { label: 'Alcance de Bloqueio', value: athlete.block_reach, icon: Shield },
  ];

  const achievements = (athlete.unlocked_achievements || [])
    .map((a) => getAchievementDef(a.key))
    .filter(Boolean)
    .slice(0, 4);

  const formatDate = (value: string | null): string => {
    if (!value) return '';
    const d = new Date(value + 'T00:00:00');
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-[#070908] text-white flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl space-y-4">
        {/* ============ CARTÃO DE ATLETA ============ */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-black via-[#0d1512] to-[#07110b] shadow-card">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Logo + selo verificado */}
          <div className="relative flex items-center justify-between px-6 sm:px-8 py-5 border-b border-emerald-500/20 gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <CreditCard className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-emerald-400 truncate">
                TIME IFAL
              </span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/70 text-emerald-300 border border-emerald-400/50 text-[10px] sm:text-xs font-black uppercase tracking-wider whitespace-nowrap">
              <BadgeCheck className="w-3.5 h-3.5" /> Atleta Verificado
            </span>
          </div>

          {/* Identidade (RGPD: nunca mostrar data de nascimento, apenas idade) */}
          <div className="relative flex flex-col sm:flex-row items-center gap-5 px-6 sm:px-8 py-6">
            <div className="shrink-0">
              {athlete.avatar_url ? (
                <img
                  src={athlete.avatar_url}
                  alt={`Foto de ${name}`}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-neon"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-emerald-950/60 border-2 border-emerald-500/50 shadow-neon flex items-center justify-center text-3xl font-black text-emerald-300 font-mono">
                  {initials || 'VP'}
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide truncate">
                {name}
              </h1>
              <div className="mt-2 flex flex-wrap justify-center sm:justify-start items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider">
                  {athlete.position || 'Atleta'}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-lg bg-white/[0.04] text-gray-300 border border-white/10 text-xs font-semibold">
                  {athlete.age ? `${athlete.age} anos` : 'Idade —'}
                </span>
                {athlete.evaluation_date && (
                  <span className="inline-flex items-center px-3 py-1 rounded-lg bg-white/[0.04] text-gray-400 border border-white/10 text-[10px] font-mono">
                    Última avaliação: {formatDate(athlete.evaluation_date)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="relative grid grid-cols-2 sm:grid-cols-5 gap-3 px-6 sm:px-8 pb-6">
            {statItems.map((stat) => (
              <div
                key={stat.label}
                className="p-3 rounded-xl bg-black/40 border border-emerald-950/80"
              >
                <span className="flex items-center gap-1 text-[10px] text-gray-500 uppercase font-semibold">
                  <stat.icon className="w-3 h-3 text-emerald-500" />
                  {stat.label}
                </span>
                <span className="mt-1 block font-mono font-bold text-white text-sm">
                  {formatStat(stat.value)}
                </span>
              </div>
            ))}
          </div>

          {/* Conquistas desbloqueadas */}
          {achievements.length > 0 && (
            <div className="relative px-6 sm:px-8 pb-6">
              <div className="flex flex-wrap gap-2">
                {achievements.map((def) => (
                  <span
                    key={def!.key}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-xs font-semibold text-emerald-300"
                  >
                    <Medal className="w-3.5 h-3.5" /> {def!.title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé discreto */}
        <p className="text-center text-[11px] text-gray-500">
          Carteirinha pública de atleta • TIME IFAL ·{' '}
          <Link
            href="/login"
            className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
          >
            Faça login para ver mais atletas
          </Link>
        </p>
      </div>
    </div>
  );
}
