'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, Activity, PlusCircle, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  currentUser?: {
    name: string;
    email: string;
    avatar_url?: string | null;
  } | null;
  title?: string;
  subtitle?: string;
}

export default function Navbar({ onToggleSidebar, currentUser, title, subtitle }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-[#080a09]/80 backdrop-blur-md border-b border-emerald-950/40 px-4 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 rounded-lg text-gray-400 hover:text-white hover:bg-emerald-950/30 lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Page Title Context */}
        <div>
          <h1 className="text-lg lg:text-xl font-bold text-white flex items-center gap-2">
            {title || 'Painel do Atleta'}
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-3 h-3" /> Conectado
            </span>
          </h1>
          {subtitle && (
            <p className="text-xs text-gray-400 hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick New Evaluation */}
        <Link
          href="/avaliacao"
          className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-500 text-black font-semibold text-xs tracking-wide hover:bg-emerald-400 transition-colors shadow-neon"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Avaliar</span>
        </Link>

        {/* Athlete Avatar Preview */}
        {currentUser && (
          <Link href="/perfil" className="flex items-center gap-2.5 p-1 rounded-full hover:bg-white/[0.04] transition-colors">
            <img
              src={currentUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentUser.name)}`}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full border border-emerald-500/40 object-cover"
            />
          </Link>
        )}
      </div>
    </header>
  );
}
