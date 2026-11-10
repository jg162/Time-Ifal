'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  ClipboardList,
  User,
  Users,
  Settings,
  LogOut,
  PlusCircle,
  Zap,
  Trophy,
  ArrowLeftRight,
  TrendingUp,
  Target,
  Medal,
  CreditCard,
  FileText,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  currentUser?: {
    name: string;
    email: string;
    avatar_url?: string | null;
  } | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ currentUser, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
      router.push('/login');
    }
  };

  const navItems: { name: string; href: string; icon: React.ElementType }[] = [
    { name: 'Início', href: '/dashboard', icon: Home },
    { name: 'Meu perfil', href: '/perfil', icon: User },
    { name: 'Nova avaliação', href: '/avaliacao', icon: PlusCircle },
    { name: 'Minhas avaliações', href: '/avaliacoes', icon: ClipboardList },
    { name: 'Time', href: '/time', icon: Users },
  ];

  const isItemActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0a0d0b] border-r border-emerald-950/60 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="p-6 border-b border-emerald-950/40 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group" onClick={onClose}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 p-0.5 shadow-neon flex items-center justify-center">
              <div className="w-full h-full bg-[#0a0d0b] rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl tracking-wider text-white">TIME</span>
                <span className="font-black text-xl tracking-wider text-emerald-400">IFAL</span>
              </div>
              <p className="text-[10px] tracking-widest text-emerald-500/80 font-bold uppercase">
                Vôlei de Alto Rendimento
              </p>
            </div>
          </Link>
        </div>

        {/* Quick Action Button */}
        <div className="px-5 pt-6 pb-2">
          <Link
            href="/avaliacao"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-400 text-black font-bold text-sm tracking-wide shadow-neon hover:shadow-neon-strong transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>NOVA AVALIAÇÃO</span>
          </Link>
        </div>

        {/* Navigation Items (Menu Principal Simplificado) */}
        <div className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          <p className="px-3 pb-1 text-[11px] font-bold tracking-wider text-gray-500 uppercase">
            Menu Principal
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(0,230,118,0.15)] font-semibold'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-emerald-400' : 'text-gray-500 group-hover:text-emerald-400'
                  }`} />
                  <span>{item.name}</span>
                </div>
                {isActive && (
                  <div className="w-1.5 h-4 rounded-full bg-emerald-400 shadow-neon" />
                )}
              </Link>
            );
          })}
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-emerald-950/40 bg-[#070908]/80">
          {currentUser && (
            <Link
              href="/perfil"
              onClick={onClose}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-colors mb-2 group"
            >
              <img
                src={currentUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentUser.name)}`}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full border border-emerald-500/30 object-cover bg-emerald-950/30"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
                  {currentUser.name}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {currentUser.email}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-all border border-transparent hover:border-red-900/30"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}
