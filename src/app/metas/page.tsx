'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import ConfirmModal from '@/components/ConfirmModal';
import {
  User,
  Goal,
  GoalStatus,
  GOAL_METRIC_LABELS,
  GOAL_METRIC_UNITS,
} from '@/lib/types';
import {
  Target,
  PlusCircle,
  X,
  Trophy,
  Pencil,
  CheckCircle2,
  Ban,
  Trash2,
  Flag,
  CalendarDays,
  ListFilter,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface MetasResponse {
  goals: Goal[];
}

type Toast = { type: 'success' | 'error' | 'achievement'; message: string } | null;

type FilterStatus = 'todos' | GoalStatus;

const FILTERS: { key: FilterStatus; label: string }[] = [
  { key: 'todos', label: 'Todas' },
  { key: 'ativo', label: 'Ativas' },
  { key: 'concluido', label: 'Concluídas' },
  { key: 'cancelado', label: 'Canceladas' },
];

const STATUS_BADGE: Record<GoalStatus, { label: string; className: string }> = {
  ativo: {
    label: 'Ativa',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40',
  },
  concluido: {
    label: 'Concluída',
    className: 'bg-emerald-500 text-black border-emerald-500 font-black',
  },
  cancelado: {
    label: 'Cancelada',
    className: 'bg-white/[0.04] text-gray-400 border-gray-700',
  },
};

interface GoalFormState {
  title: string;
  description: string;
  metric_type: string; // '' = sem métrica
  target_value: string;
  deadline: string;
  progress_pct: string; // usado APENAS quando metric_type === 'tecnica'
}

const EMPTY_FORM: GoalFormState = {
  title: '',
  description: '',
  metric_type: '',
  target_value: '',
  deadline: '',
  progress_pct: '',
};

const formatNumber = (value: number): string =>
  Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 1 });

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
};

export default function MetasPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('todos');
  const [toast, setToast] = useState<Toast>(null);

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GoalFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete modal state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Status action in-flight
  const [statusTargetId, setStatusTargetId] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error' | 'achievement', message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 4200);
  };

  const fetchGoals = async () => {
    try {
      const authRes = await fetch('/api/auth/me');
      if (!authRes.ok) {
        router.push('/login');
        return;
      }
      const authData = await authRes.json();
      setUser(authData.user);

      const res = await fetch('/api/metas');
      if (res.ok) {
        const data: MetasResponse = await res.json();
        setGoals(data.goals || []);
      } else {
        showToast('error', 'Não foi possível carregar suas metas.');
      }
    } catch (err: any) {
      console.error('Error fetching goals:', err);
      showToast('error', 'Erro de conexão ao carregar metas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOperationSuccess = (message: string, data?: any) => {
    showToast('success', message);
    if (data?.unlockedNow && Array.isArray(data.unlockedNow) && data.unlockedNow.length > 0) {
      showToast('achievement', 'Nova conquista desbloqueada!');
    }
    fetchGoals();
  };

  // ---- Form handlers ----
  const openCreateForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setFormOpen(true);
  };

  const openEditForm = (goal: Goal) => {
    setEditingId(goal.id);
    setForm({
      title: goal.title,
      description: goal.description || '',
      metric_type: goal.metric_type || '',
      target_value: goal.target_value !== null ? String(goal.target_value) : '',
      deadline: goal.deadline || '',
      progress_pct: goal.metric_type === 'tecnica' ? String(goal.progress_pct ?? 0) : '',
    });
    setFormError('');
    setFormOpen(true);
  };

  const handleSaveGoal = async () => {
    if (!form.title.trim()) {
      setFormError('Informe um título para a meta.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (editingId) {
        const body: Record<string, any> = {
          title: form.title.trim(),
          description: form.description,
          metric_type: form.metric_type,
          target_value: form.target_value === '' ? undefined : form.target_value,
          deadline: form.deadline || null,
        };
        if (form.metric_type === 'tecnica') {
          body.progress_pct = form.progress_pct === '' ? 0 : Number(form.progress_pct);
        }
        const res = await fetch(`/api/metas/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Falha ao atualizar a meta.');
        }
        setFormOpen(false);
        handleOperationSuccess('Meta atualizada com sucesso!', data);
      } else {
        const res = await fetch('/api/metas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description,
            metric_type: form.metric_type || null,
            target_value: form.target_value === '' ? null : form.target_value,
            deadline: form.deadline || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Falha ao cadastrar a meta.');
        }
        setFormOpen(false);
        handleOperationSuccess('Meta cadastrada com sucesso!', data);
      }
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar a meta.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (goal: Goal, status: GoalStatus) => {
    setStatusTargetId(goal.id);
    try {
      const res = await fetch(`/api/metas/${goal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao atualizar o status.');
      }
      handleOperationSuccess(
        status === 'concluido' ? 'Meta concluída! Parabéns! 🎉' : 'Meta cancelada.',
        data
      );
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao atualizar o status da meta.');
    } finally {
      setStatusTargetId(null);
    }
  };

  // ---- Delete handlers ----
  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/metas/${deleteTargetId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao excluir a meta.');
      }
      setDeleteTargetId(null);
      handleOperationSuccess('Meta excluída com sucesso.');
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao excluir a meta.');
      setDeleteTargetId(null);
    } finally {
      setDeleting(false);
    }
  };

  // ---- Derived ----
  const counts: Record<FilterStatus, number> = {
    todos: goals.length,
    ativo: goals.filter((g) => g.status === 'ativo').length,
    concluido: goals.filter((g) => g.status === 'concluido').length,
    cancelado: goals.filter((g) => g.status === 'cancelado').length,
  };

  const filteredGoals = filter === 'todos' ? goals : goals.filter((g) => g.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070908] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-emerald-400">Carregando suas metas...</p>
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
          title="Minhas Metas"
          subtitle="Defina objetivos, acompanhe a progressão e desbloqueie conquistas"
        />

        <main className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Header Action Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#0d1612] via-[#09120e] to-[#070908] border border-emerald-500/30">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide">
                  Metas & Objetivos
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-300">
                <span className="text-emerald-400 font-bold font-mono">{counts.ativo}</span> meta(s)
                ativa(s) • <span className="text-emerald-400 font-bold font-mono">{counts.concluido}</span>{' '}
                concluída(s)
              </p>
            </div>

            <button
              onClick={openCreateForm}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs sm:text-sm tracking-wide uppercase shadow-neon hover:shadow-neon-strong transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nova Meta</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-gray-500 uppercase font-bold mr-1">
              <ListFilter className="w-3.5 h-3.5" />
              Filtrar:
            </span>
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  filter === f.key
                    ? 'bg-emerald-500 text-black border-emerald-500 shadow-neon'
                    : 'bg-[#090d0b] text-gray-400 border-emerald-950 hover:border-emerald-500/40 hover:text-white'
                }`}
              >
                {f.label}
                <span
                  className={`ml-1.5 font-mono ${
                    filter === f.key ? 'text-black/70' : 'text-emerald-500/70'
                  }`}
                >
                  ({counts[f.key]})
                </span>
              </button>
            ))}
          </div>

          {/* Goals List */}
          {filteredGoals.length === 0 ? (
            <div className="athletic-card rounded-3xl p-10 sm:p-14 text-center border-dashed">
              {goals.length === 0 ? (
                <>
                  <Target className="w-14 h-14 text-emerald-500/40 mx-auto mb-4 animate-pulse" />
                  <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wide">
                    Nenhuma meta cadastrada
                  </h3>
                  <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
                    Cadastre sua primeira meta e comece a transformar seus objetivos em recordes.
                  </p>
                  <button
                    onClick={openCreateForm}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wide shadow-neon transition-all"
                  >
                    <Flag className="w-4 h-4" />
                    <span>Cadastrar Primeira Meta</span>
                  </button>
                </>
              ) : (
                <>
                  <ListFilter className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-300">
                    Nenhuma meta com este status.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredGoals.map((goal) => {
                const unit = goal.metric_type ? GOAL_METRIC_UNITS[goal.metric_type] : '';
                const metricLabel = goal.metric_type
                  ? GOAL_METRIC_LABELS[goal.metric_type]
                  : null;
                const badge = STATUS_BADGE[goal.status];
                const pct = Math.max(0, Math.min(100, goal.progress_pct || 0));

                return (
                  <div
                    key={goal.id}
                    className={`athletic-card rounded-2xl p-5 sm:p-6 flex flex-col gap-4 ${
                      goal.status === 'concluido'
                        ? 'border-emerald-500/50'
                        : goal.status === 'cancelado'
                          ? 'opacity-70'
                          : ''
                    }`}
                  >
                    {/* Header: title + status badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-base sm:text-lg font-black text-white tracking-wide truncate">
                          {goal.title}
                        </h3>
                        {metricLabel && (
                          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">
                            {metricLabel}
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wide shrink-0 ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    {/* Description */}
                    {goal.description && (
                      <p className="text-xs sm:text-sm text-gray-400 leading-relaxed line-clamp-3">
                        {goal.description}
                      </p>
                    )}

                    {/* Values */}
                    {(goal.current_value !== null || goal.target_value !== null) && (
                      <div className="flex items-center gap-2 font-mono text-sm flex-wrap">
                        <span className="text-gray-500 uppercase text-[10px] font-sans font-bold">
                          Atual:
                        </span>
                        <span className="text-white font-bold">
                          {goal.current_value !== null ? formatNumber(goal.current_value) : '—'}
                          {unit && <span className="text-[10px] text-gray-400 ml-0.5">{unit}</span>}
                        </span>
                        <span className="text-emerald-500">→</span>
                        <span className="text-gray-500 uppercase text-[10px] font-sans font-bold">
                          Desejado:
                        </span>
                        <span className="text-emerald-300 font-extrabold">
                          {goal.target_value !== null ? formatNumber(goal.target_value) : '—'}
                          {unit && <span className="text-[10px] text-emerald-500 ml-0.5">{unit}</span>}
                        </span>
                      </div>
                    )}

                    {/* Progress bar */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">
                          Progresso
                        </span>
                        <span className="text-xs font-mono font-black text-emerald-400">{pct}%</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-[#080d0a] border border-emerald-950/80 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-neon transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="flex items-center gap-4 text-[11px] text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        Criada: {formatDate(goal.created_at)}
                      </span>
                      {goal.deadline && (
                        <span className="flex items-center gap-1 text-gray-400">
                          <Flag className="w-3 h-3 text-emerald-500" />
                          Prazo: <span className="font-semibold text-gray-300">{formatDate(goal.deadline)}</span>
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-950/60 flex-wrap">
                      <button
                        onClick={() => openEditForm(goal)}
                        className="p-2 rounded-xl text-gray-400 hover:text-emerald-400 hover:bg-emerald-950/40 border border-transparent hover:border-emerald-500/30 transition-colors"
                        title="Editar meta"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {goal.status === 'ativo' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(goal, 'concluido')}
                            disabled={statusTargetId === goal.id}
                            className="p-2 rounded-xl text-gray-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/30 transition-colors disabled:opacity-40"
                            title="Concluir meta"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(goal, 'cancelado')}
                            disabled={statusTargetId === goal.id}
                            className="p-2 rounded-xl text-gray-400 hover:text-amber-400 hover:bg-amber-950/20 border border-transparent hover:border-amber-900/30 transition-colors disabled:opacity-40"
                            title="Cancelar meta"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setDeleteTargetId(goal.id)}
                        className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-900/30 transition-colors"
                        title="Excluir meta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Create/Edit Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#0e1411] border border-emerald-950/80 rounded-2xl p-6 shadow-2xl shadow-black/80"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setFormOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-3 mb-6">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {editingId ? <Pencil className="w-6 h-6" /> : <Trophy className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingId ? 'Editar Meta' : 'Nova Meta'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {editingId
                    ? 'Atualize os dados e acompanhe seu progresso.'
                    : 'Defina um objetivo e transforme em recordes.'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Título */}
              <div>
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wide block mb-1.5">
                  Título <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex.: Batizar 3,05m no bloqueio"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#090d0b] border border-emerald-950 focus:border-emerald-500 focus:outline-none text-sm text-white placeholder:text-gray-600 transition-colors"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wide block mb-1.5">
                  Descrição
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Detalhe o objetivo, como pretende alcançá-lo, etc."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#090d0b] border border-emerald-950 focus:border-emerald-500 focus:outline-none text-sm text-white placeholder:text-gray-600 resize-none transition-colors"
                />
              </div>

              {/* Métrica */}
              <div>
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wide block mb-1.5">
                  Métrica <span className="text-gray-500 normal-case font-medium">(opcional)</span>
                </label>
                <select
                  value={form.metric_type}
                  onChange={(e) => setForm({ ...form, metric_type: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#090d0b] border border-emerald-950 hover:border-emerald-500/40 focus:border-emerald-500 focus:outline-none text-sm text-white font-semibold cursor-pointer transition-colors"
                >
                  <option value="" className="bg-[#090d0b]">
                    Sem métrica (objetivo livre)
                  </option>
                  {Object.entries(GOAL_METRIC_LABELS).map(([key, label]) => (
                    <option key={key} value={key} className="bg-[#090d0b]">
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Valor desejado (somente com métrica) */}
              {form.metric_type && (
                <div>
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wide block mb-1.5">
                    Valor desejado{' '}
                    {GOAL_METRIC_UNITS[form.metric_type] && (
                      <span className="text-emerald-400">
                        ({GOAL_METRIC_UNITS[form.metric_type]})
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={form.target_value}
                    onChange={(e) => setForm({ ...form, target_value: e.target.value })}
                    placeholder="Ex.: 305"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#090d0b] border border-emerald-950 focus:border-emerald-500 focus:outline-none text-sm text-white font-mono placeholder:text-gray-600 transition-colors"
                  />
                </div>
              )}

              {/* Prazo */}
              <div>
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wide block mb-1.5">
                  Prazo <span className="text-gray-500 normal-case font-medium">(opcional)</span>
                </label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#090d0b] border border-emerald-950 focus:border-emerald-500 focus:outline-none text-sm text-white transition-colors [color-scheme:dark]"
                />
              </div>

              {/* Progresso manual (apenas métrica técnica) */}
              {editingId && form.metric_type === 'tecnica' && (
                <div>
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wide block mb-1.5">
                    Progresso manual <span className="text-emerald-400">(0–100%)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.progress_pct}
                    onChange={(e) => setForm({ ...form, progress_pct: e.target.value })}
                    placeholder="Ex.: 50"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#090d0b] border border-emerald-950 focus:border-emerald-500 focus:outline-none text-sm text-white font-mono placeholder:text-gray-600 transition-colors"
                  />
                </div>
              )}

              {/* Form error */}
              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/30 border border-red-900/50 text-xs text-red-300 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveGoal}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-neon transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="Excluir esta Meta?"
        message="Esta ação é permanente e removerá a meta do seu histórico. Deseja realmente prosseguir?"
        confirmText="Sim, Excluir Meta"
        cancelText="Cancelar"
        isDanger={true}
        isLoading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTargetId(null)}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div
            className={`p-4 rounded-2xl border shadow-2xl flex items-start gap-3 ${
              toast.type === 'error'
                ? 'bg-[#1a0d0d] border-red-900/60 text-red-200'
                : toast.type === 'achievement'
                  ? 'bg-[#0d1612] border-amber-500/50 text-amber-200'
                  : 'bg-[#0d1612] border-emerald-500/50 text-emerald-200'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            ) : toast.type === 'achievement' ? (
              <Sparkles className="w-5 h-5 shrink-0 text-amber-400 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            )}
            <span className="text-sm font-semibold leading-snug">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
