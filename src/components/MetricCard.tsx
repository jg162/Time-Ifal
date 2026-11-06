import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    color?: string;
  };
  highlight?: boolean;
}

export default function MetricCard({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  badge,
  highlight = false,
}: MetricCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 group ${
        highlight
          ? 'bg-gradient-to-br from-emerald-950/70 via-[#0d1511] to-[#070908] border-emerald-500/50 shadow-neon'
          : 'bg-[#0f1411]/80 backdrop-blur-md border-emerald-950/70 hover:border-emerald-500/30 hover:shadow-card'
      }`}
    >
      {/* Background glow accent */}
      {highlight && (
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
      )}

      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
          {title}
        </span>
        <div
          className={`p-2.5 rounded-xl border ${
            highlight
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-neon'
              : 'bg-white/[0.03] text-emerald-400 border-white/[0.05] group-hover:border-emerald-500/30'
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
          {value !== null && value !== undefined && value !== '' ? value : '--'}
        </span>
        {unit && <span className="text-sm font-medium text-emerald-400">{unit}</span>}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        {subtitle && (
          <p className="text-xs text-gray-400 truncate">
            {subtitle}
          </p>
        )}
        {badge && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
              badge.color || 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );
}
