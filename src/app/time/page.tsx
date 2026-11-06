'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import AthleteCard from '@/components/AthleteCard';
import AthleteModal from '@/components/AthleteModal';
import { User, TeamAthlete, Team, Position, POSITIONS } from '@/lib/types';
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  LayoutGrid,
  Table as TableIcon,
  Lock,
  Zap,
  Ruler,
  Weight,
  Sparkles,
  ChevronDown,
  Plus,
  Link2,
  Copy,
  CheckCheck,
  UserPlus,
  Trophy,
  ArrowRight,
  X,
  Loader2,
  Shield,
} from 'lucide-react';

export default function TimePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [athletes, setAthletes] = useState<TeamAthlete[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Filtering & Sorting states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('TODOS');
  const [sortBy, setSortBy] = useState<string>('reach_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal detail state
  const [selectedAthlete, setSelectedAthlete] = useState<TeamAthlete | null>(null);

  // Create Team modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Join Team modal
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Copy link state
  const [linkCopied, setLinkCopied] = useState(false);

  async function loadData() {
    try {
      const authRes = await fetch('/api/auth/me');
      if (authRes.ok) {
        const authData = await authRes.json();
        setCurrentUser(authData.user);
      }

      const teamRes = await fetch('/api/team');
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        setAthletes(teamData.athletes || []);
        setTeam(teamData.team || null);
        setInviteLink(teamData.inviteLink || null);
        setCurrentUserId(teamData.currentUserId || null);
      }
    } catch (err) {
      console.error('Error loading team data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName, description: newTeamDesc }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar time.');
      setShowCreateModal(false);
      setNewTeamName('');
      setNewTeamDesc('');
      await loadData();
    } catch (err: any) {
      setCreateError(err.message || 'Erro ao criar time.');
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleJoinTeam(e: React.FormEvent) {
    e.preventDefault();
    setJoinError(null);
    setJoinLoading(true);
    try {
      const res = await fetch('/api/teams/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao entrar no time.');
      setShowJoinModal(false);
      setJoinCode('');
      await loadData();
    } catch (err: any) {
      setJoinError(err.message || 'Erro ao entrar no time.');
    } finally {
      setJoinLoading(false);
    }
  }

  function copyLink() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    });
  }

  // Filter and sort athletes
  const filteredAthletes = useMemo(() => {
    return athletes
      .filter((athlete) => {
        const matchesName = athlete.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPosition = selectedPosition === 'TODOS' || athlete.position === selectedPosition;
        return matchesName && matchesPosition;
      })
      .sort((a, b) => {
        if (sortBy === 'height_desc') return (b.height || 0) - (a.height || 0);
        if (sortBy === 'height_asc') return (a.height || 999) - (b.height || 999);
        if (sortBy === 'reach_desc') return (b.reach_jumping || 0) - (a.reach_jumping || 0);
        if (sortBy === 'jump_desc') return (b.vertical_jump || 0) - (a.vertical_jump || 0);
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'updated_desc') return (b.last_updated || '').localeCompare(a.last_updated || '');
        return 0;
      });
  }, [athletes, searchQuery, selectedPosition, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070908] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-emerald-400">Carregando elenco...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070908] text-white flex">
      <Sidebar
        currentUser={currentUser}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(true)}
          currentUser={currentUser}
          title="Time"
          subtitle="Área coletiva dos atletas do TIME IFAL · VOLLEY PERFORMANCE"
        />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">

          {/* ------------------------------------------------------------------ */}
          {/* SEM TIME: opções de criar ou entrar                                 */}
          {/* ------------------------------------------------------------------ */}
          {!team ? (
            <div className="space-y-6">
              {/* Banner explicativo */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0d1612] via-[#09120e] to-[#070908] border border-emerald-500/30 text-center">
                <Shield className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h2 className="text-2xl font-black text-white uppercase tracking-wide mb-2">
                  Você ainda não está em um Time
                </h2>
                <p className="text-sm text-gray-400 max-w-md mx-auto">
                  Crie um time e gere um link de convite para seus atletas, ou insira um código para entrar em um time existente.
                </p>
              </div>

              {/* Dois cards de ação */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Criar Time */}
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="group p-8 rounded-3xl bg-[#0a0f0c] border border-emerald-500/30 hover:border-emerald-400 hover:bg-[#0d1710] transition-all text-left flex flex-col gap-4"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                    <Plus className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-wide mb-1">Criar Time</h3>
                    <p className="text-xs text-gray-400">
                      Crie seu time, defina o nome e compartilhe o link de convite com seus atletas.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 mt-auto group-hover:gap-2.5 transition-all">
                    Criar agora <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>

                {/* Entrar em um Time */}
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="group p-8 rounded-3xl bg-[#0a0f0c] border border-emerald-950/80 hover:border-emerald-500/40 hover:bg-[#0d1710] transition-all text-left flex flex-col gap-4"
                >
                  <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center group-hover:bg-sky-500/20 transition-colors">
                    <UserPlus className="w-7 h-7 text-sky-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-wide mb-1">Entrar em um Time</h3>
                    <p className="text-xs text-gray-400">
                      Já recebeu um código de convite? Insira-o aqui para entrar direto no time.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 mt-auto group-hover:gap-2.5 transition-all">
                    Entrar com código <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              </div>
            </div>
          ) : (
            /* ---------------------------------------------------------------- */
            /* COM TIME: banner do time + lista de atletas                      */
            /* ---------------------------------------------------------------- */
            <div className="space-y-6">
              {/* Banner do Time */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0d1612] via-[#09120e] to-[#070908] border border-emerald-500/30">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="w-5 h-5 text-emerald-400" />
                      <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide">
                        {team.name}
                      </h2>
                    </div>
                    <p className="text-xs text-gray-400">
                      Código do time: <span className="font-mono font-bold text-emerald-300">{team.code}</span>
                    </p>
                    {team.description && (
                      <p className="text-xs text-gray-400 mt-1">{team.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex-shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{athletes.length} Atleta{athletes.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Link de Convite */}
                {inviteLink && (
                  <div className="mt-4 pt-4 border-t border-emerald-950/60">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1">
                      <Link2 className="w-3 h-3" /> Link de convite
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#080d0a] border border-emerald-950/80 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 truncate">
                        {inviteLink}
                      </div>
                      <button
                        onClick={copyLink}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          linkCopied
                            ? 'bg-emerald-500 text-black'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {linkCopied ? (
                          <><CheckCheck className="w-3.5 h-3.5" /> Copiado!</>
                        ) : (
                          <><Copy className="w-3.5 h-3.5" /> Copiar</>
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1.5">
                      Compartilhe este link para que novos atletas entrem direto no seu time ao se cadastrar.
                    </p>
                  </div>
                )}
              </div>

              {/* SEARCH, FILTERS & SORTING CONTROLS */}
              <div className="athletic-card rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Pesquisar atleta pelo nome..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#080d0a] border border-emerald-950/80 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-semibold whitespace-nowrap hidden sm:inline flex items-center gap-1">
                      <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
                      Organizar por:
                    </span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-[#080d0a] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none font-semibold cursor-pointer"
                    >
                      <option value="reach_desc">Alcance Pulando (Maior primeiro)</option>
                      <option value="jump_desc">Salto Vertical (+cm)</option>
                      <option value="height_desc">Altura (Maior primeiro)</option>
                      <option value="height_asc">Altura (Menor primeiro)</option>
                      <option value="name_asc">Nome (A - Z)</option>
                      <option value="updated_desc">Última Atualização</option>
                    </select>

                    <div className="flex items-center bg-[#080d0a] p-1 rounded-xl border border-emerald-950/80">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-lg transition-colors ${
                          viewMode === 'grid' ? 'bg-emerald-500 text-black shadow-neon' : 'text-gray-400 hover:text-white'
                        }`}
                        title="Visualização em Grade"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('table')}
                        className={`p-1.5 rounded-lg transition-colors ${
                          viewMode === 'table' ? 'bg-emerald-500 text-black shadow-neon' : 'text-gray-400 hover:text-white'
                        }`}
                        title="Visualização em Tabela"
                      >
                        <TableIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Position Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
                  <span className="text-[11px] font-bold uppercase text-gray-500 mr-2 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-emerald-400" /> Posição:
                  </span>
                  <button
                    onClick={() => setSelectedPosition('TODOS')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      selectedPosition === 'TODOS'
                        ? 'bg-emerald-500 text-black shadow-neon'
                        : 'bg-[#080d0a] text-gray-400 border border-emerald-950/80 hover:text-white hover:border-emerald-500/30'
                    }`}
                  >
                    Todos ({athletes.length})
                  </button>
                  {POSITIONS.map((pos) => {
                    const count = athletes.filter((a) => a.position === pos).length;
                    const isSelected = selectedPosition === pos;
                    return (
                      <button
                        key={pos}
                        onClick={() => setSelectedPosition(pos)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                          isSelected
                            ? 'bg-emerald-500 text-black shadow-neon'
                            : 'bg-[#080d0a] text-gray-400 border border-emerald-950/80 hover:text-white hover:border-emerald-500/30'
                        }`}
                      >
                        {pos} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ATHLETES LISTING */}
              {filteredAthletes.length === 0 ? (
                <div className="athletic-card rounded-2xl p-12 text-center">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white mb-1">
                    {athletes.length === 0 ? 'Nenhum atleta no time ainda' : 'Nenhum atleta encontrado'}
                  </h3>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    {athletes.length === 0
                      ? 'Compartilhe o link de convite acima para que outros atletas entrem no seu time.'
                      : 'Tente ajustar os termos da busca ou limpar o filtro por posição.'}
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredAthletes.map((athlete) => (
                    <AthleteCard
                      key={athlete.id}
                      athlete={athlete}
                      isCurrentUser={currentUserId === athlete.id}
                      onSelect={(ath) => setSelectedAthlete(ath)}
                    />
                  ))}
                </div>
              ) : (
                <div className="athletic-card rounded-2xl overflow-hidden border border-emerald-950">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#090d0b] border-b border-emerald-950/80 text-gray-400 uppercase text-[10px] tracking-wider font-semibold">
                        <tr>
                          <th className="py-3.5 px-4">Atleta</th>
                          <th className="py-3.5 px-4">Posição</th>
                          <th className="py-3.5 px-4">Idade</th>
                          <th className="py-3.5 px-4">Altura</th>
                          <th className="py-3.5 px-4">Peso</th>
                          <th className="py-3.5 px-4">Alcance Parado</th>
                          <th className="py-3.5 px-4 text-emerald-400">Alcance Pulando</th>
                          <th className="py-3.5 px-4">Salto</th>
                          <th className="py-3.5 px-4">Envergadura</th>
                          <th className="py-3.5 px-4 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-950/40 text-gray-300">
                        {filteredAthletes.map((ath) => (
                          <tr
                            key={ath.id}
                            onClick={() => setSelectedAthlete(ath)}
                            className="hover:bg-emerald-950/20 cursor-pointer transition-colors"
                          >
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={ath.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(ath.name)}`}
                                  alt={ath.name}
                                  className="w-8 h-8 rounded-lg object-cover border border-emerald-500/30"
                                />
                                <div>
                                  <span className="font-bold text-white block">{ath.name}</span>
                                  {currentUserId === ath.id && (
                                    <span className="text-[10px] text-emerald-400 font-semibold">(Você)</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-white">{ath.position}</td>
                            <td className="py-3.5 px-4">{ath.age ? `${ath.age}a` : '--'}</td>
                            <td className="py-3.5 px-4 font-mono font-bold text-white">
                              {ath.height ? `${ath.height} cm` : <Lock className="w-3 h-3 text-gray-500" />}
                            </td>
                            <td className="py-3.5 px-4 font-mono">
                              {ath.weight ? `${ath.weight} kg` : <Lock className="w-3 h-3 text-gray-500" />}
                            </td>
                            <td className="py-3.5 px-4 font-mono">
                              {ath.reach_standing ? `${ath.reach_standing} cm` : <Lock className="w-3 h-3 text-gray-500" />}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-extrabold text-emerald-300">
                              {ath.reach_jumping ? `${ath.reach_jumping} cm` : <Lock className="w-3 h-3 text-gray-500" />}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-sky-300 font-bold">
                              {ath.vertical_jump ? `+${ath.vertical_jump} cm` : <Lock className="w-3 h-3 text-gray-500" />}
                            </td>
                            <td className="py-3.5 px-4 font-mono">
                              {ath.wingspan ? `${ath.wingspan} cm` : <Lock className="w-3 h-3 text-gray-500" />}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedAthlete(ath); }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 transition-colors"
                              >
                                Ver Detalhes
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ATHLETE MODAL DETAIL */}
      <AthleteModal
        athlete={selectedAthlete}
        onClose={() => setSelectedAthlete(null)}
        currentUserId={currentUserId ?? currentUser?.id}
      />

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: CRIAR TIME                                                   */}
      {/* ------------------------------------------------------------------ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0a0f0c] border border-emerald-500/40 rounded-3xl p-7 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-wide">Criar Time</h3>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setCreateError(null); }}
                className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Nome do Time *
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Ex: Time IFAL Vôlei"
                  required
                  minLength={2}
                  className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  placeholder="Ex: Time de vôlei de alto rendimento do IFAL"
                  rows={2}
                  className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={createLoading}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm tracking-wider uppercase shadow-neon transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {createLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</>
                ) : (
                  <><Plus className="w-4 h-4" /> Criar Time</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: ENTRAR EM UM TIME                                            */}
      {/* ------------------------------------------------------------------ */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0a0f0c] border border-sky-500/30 rounded-3xl p-7 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-sky-400" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-wide">Entrar em um Time</h3>
              </div>
              <button
                onClick={() => { setShowJoinModal(false); setJoinError(null); }}
                className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {joinError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs">
                {joinError}
              </div>
            )}

            <form onSubmit={handleJoinTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Código de Convite
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Ex: VOLL-1234"
                  required
                  className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-sky-500 rounded-xl px-4 py-3 text-sm text-white font-mono tracking-widest focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors"
                />
                <p className="text-[10px] text-gray-500 mt-1.5">
                  O código está no link de convite que você recebeu.
                </p>
              </div>
              <button
                type="submit"
                disabled={joinLoading}
                className="w-full py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-extrabold text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {joinLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</>
                ) : (
                  <><UserPlus className="w-4 h-4" /> Entrar no Time</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
