'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import EvolutionCharts from '@/components/EvolutionCharts';
import ConfirmModal from '@/components/ConfirmModal';
import { User, Evaluation } from '@/lib/types';
import { getBMICategory, getJumpCategory } from '@/lib/calculations';
import { 
  ClipboardList, 
  PlusCircle, 
  Calendar, 
  Trash2, 
  Zap, 
  Ruler, 
  Weight, 
  Maximize2, 
  Target,
  Clock,
  Sparkles
} from 'lucide-react';

export default function AvaliacoesPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

  // Deletion modal state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEvaluations = async () => {
    try {
      const authRes = await fetch('/api/auth/me');
      if (!authRes.ok) {
        router.push('/login');
        return;
      }
      const authData = await authRes.json();
      setUser(authData.user);

      const evalRes = await fetch('/api/evaluations');
      if (evalRes.ok) {
        const evalData = await evalRes.json();
        setEvaluations(evalData.evaluations || []);
      }
    } catch (err) {
      console.error('Error fetching evaluations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, [router]);

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/evaluations/${deleteTargetId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Falha ao excluir avaliação.');
      }
      setEvaluations(evaluations.filter((ev) => ev.id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir avaliação.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070908] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-emerald-400">Carregando histórico de avaliações...</p>
        </div>
      </div>
    );
  }

  // Reverse to show newest evaluations first in the history table
  const reversedEvaluations = [...evaluations].reverse();

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
          title="Minhas Avaliações"
          subtitle="Histórico completo e análise comparativa de evolução"
        />

        <main className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Header Action Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#0d1612] via-[#09120e] to-[#070908] border border-emerald-500/30">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ClipboardList className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide">
                  Histórico & Progressão
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-300">
                Você possui <span className="text-emerald-400 font-bold font-mono">{evaluations.length}</span> avaliações físicas salvas no banco de dados.
              </p>
            </div>

            <Link
              href="/avaliacao"
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs sm:text-sm tracking-wide uppercase shadow-neon hover:shadow-neon-strong transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nova Avaliação</span>
            </Link>
          </div>

          {/* EVOLUTION CHARTS */}
          <div>
            <EvolutionCharts evaluations={evaluations} />
          </div>

          {/* HISTORICAL TIMELINE LIST */}
          <div className="athletic-card rounded-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-emerald-950/60">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white tracking-wide uppercase">
                  Registros de Avaliações ({evaluations.length})
                </h3>
              </div>
              <span className="text-xs text-gray-400">Ordenado por data decrescente</span>
            </div>

            {reversedEvaluations.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-300 mb-1">Nenhuma avaliação encontrada</p>
                <p className="text-xs text-gray-500 mb-4">Clique no botão abaixo para registrar seu primeiro teste.</p>
                <Link
                  href="/avaliacao"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs uppercase shadow-neon"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Cadastrar Avaliação</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {reversedEvaluations.map((ev, index) => {
                  const d = new Date(ev.evaluation_date + 'T00:00:00');
                  const dateStr = !isNaN(d.getTime())
                    ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
                    : ev.evaluation_date;

                  const bmiCat = getBMICategory(ev.bmi);
                  const jumpCat = getJumpCategory(ev.vertical_jump);

                  return (
                    <div
                      key={ev.id}
                      className="p-5 rounded-2xl bg-black/40 border border-emerald-950 hover:border-emerald-500/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      {/* Left: Date & Header */}
                      <div className="space-y-1.5 min-w-[220px]">
                        <div className="flex items-center gap-2">
                          <span className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                            <Calendar className="w-4 h-4" />
                          </span>
                          <div>
                            <span className="text-sm font-black text-white block">
                              {dateStr}
                            </span>
                            <span className="text-xs text-gray-400">
                              Idade no teste: {ev.age} anos • {ev.position}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Measurements Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 flex-1 text-xs">
                        {/* Altura */}
                        <div className="p-2.5 rounded-xl bg-[#080d0a] border border-emerald-950/80">
                          <span className="text-[10px] text-gray-500 uppercase block font-semibold">Altura</span>
                          <span className="font-mono font-bold text-white text-sm">{ev.height} cm</span>
                        </div>

                        {/* Peso & IMC */}
                        <div className="p-2.5 rounded-xl bg-[#080d0a] border border-emerald-950/80">
                          <span className="text-[10px] text-gray-500 uppercase block font-semibold">Peso (IMC)</span>
                          <span className="font-mono font-bold text-white text-sm">
                            {ev.weight} kg <span className="text-[10px] text-gray-400">({ev.bmi})</span>
                          </span>
                        </div>

                        {/* Alcance Parado */}
                        <div className="p-2.5 rounded-xl bg-[#080d0a] border border-emerald-950/80">
                          <span className="text-[10px] text-gray-500 uppercase block font-semibold">Alcance Parado</span>
                          <span className="font-mono font-bold text-white text-sm">{ev.reach_standing} cm</span>
                        </div>

                        {/* Alcance Pulando */}
                        <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                          <span className="text-[10px] text-emerald-400 uppercase block font-bold flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5" /> Alcance Pulando
                          </span>
                          <span className="font-mono font-extrabold text-emerald-300 text-sm">
                            {ev.reach_jumping} cm
                          </span>
                        </div>

                        {/* Salto Vertical */}
                        <div className="p-2.5 rounded-xl bg-[#080d0a] border border-emerald-950/80">
                          <span className="text-[10px] text-sky-400 uppercase block font-semibold">Salto Líquido</span>
                          <span className="font-mono font-black text-sky-300 text-sm">
                            +{ev.vertical_jump} cm
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center justify-end gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-emerald-950">
                        <button
                          onClick={() => setDeleteTargetId(ev.id)}
                          className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-900/30 transition-colors"
                          title="Excluir esta avaliação"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="Excluir Avaliação Física?"
        message="Esta ação é permanente e removerá este registro do seu histórico e dos cálculos de evolução. Deseja realmente prosseguir?"
        confirmText="Sim, Excluir Registro"
        cancelText="Cancelar"
        isDanger={true}
        isLoading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
