'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, PlusCircle, ClipboardList, Users } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Início', href: '/dashboard', icon: Home },
    { name: 'Perfil', href: '/perfil', icon: User },
    { name: 'Avaliar', href: '/avaliacao', icon: PlusCircle, highlight: true },
    { name: 'Histórico', href: '/avaliacoes', icon: ClipboardList },
    { name: 'Time', href: '/time', icon: Users },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#080c09]/95 backdrop-blur-xl border-t border-emerald-950/80 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] flex items-center justify-around lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
      {navItems.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;

        if (item.highlight) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center -mt-5 group"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-green-400 p-0.5 shadow-neon hover:scale-105 active:scale-95 transition-all flex items-center justify-center">
                <div className="w-full h-full bg-[#0a0f0c] rounded-full flex items-center justify-center">
                  <Icon className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 mt-0.5 tracking-tight">
                {item.name}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
              active
                ? 'text-emerald-400 font-bold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${active ? 'bg-emerald-950/60 shadow-neon' : ''}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className={`text-[10px] tracking-tight mt-0.5 ${active ? 'font-bold text-emerald-400' : 'font-medium'}`}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
