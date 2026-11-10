'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import EvaluationForm from '@/components/EvaluationForm';
import { User, Profile } from '@/lib/types';
import { ClipboardList, Sparkles } from 'lucide-react';

export default function AvaliacaoPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setUser(data.user);
        setProfile(data.profile);
      } catch (err) {
        console.error('Error loading athlete auth:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070908] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-emerald-400">Carregando formulário de avaliação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070908] text-white flex">
      <Sidebar
        currentUser={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(true)}
          currentUser={user}
          title="Minha Avaliação"
          subtitle="Registro de características físicas, técnicas e objetivos esportivos"
        />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">
          {/* Header Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#0a120e] to-[#070908] border border-emerald-500/30 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ClipboardList className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide">
                  Formulário de Avaliação Física
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-300">
                Preencha os testes corporais e impulsão. Os cálculos de idade, salto vertical e IMC são realizados automaticamente.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cálculo Automático</span>
            </div>
          </div>

          {/* Form */}
          <EvaluationForm
            initialData={{
              full_name: profile?.full_name || user?.name || '',
              birth_date: profile?.birth_date || '',
              height: profile?.height,
              weight: profile?.weight,
              wingspan: profile?.wingspan,
              position: profile?.preferred_position || 'Ponteiro',
              serve_types: profile?.serve_types || ['Flutuante pulando'],
              goals: profile?.bio_goals || '',
            }}
            onSuccess={() => {
              router.push('/avaliacoes');
              router.refresh();
            }}
          />
        </main>
      </div>
    </div>
  );
}
