'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  LogOut,
  Settings,
  RefreshCw,
  Trash2,
  Activity,
  Flame,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function TimePage() {
  const router = useRouter();
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

  // Leave Team modal
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  // Manage Team modal (para o criador)
  const [showManageModal, setShowManageModal] = useState(false);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamDesc, setEditTeamDesc] = useState('');
  const [manageLoading, setManageLoading] = useState(false);
  const [manageError, setManageError] = useState<string | null>(null);
  const [manageSuccess, setManageSuccess] = useState<string | null>(null);

  // Copy link state
  const [linkCopied, setLinkCopied] = useState(false);

  async function loadData() {
    try {
      const authRes = await fetch('/api/auth/me');
      if (!authRes.ok) {
        router.push('/login?redirect=/time');
        return;
      }
      const authData = await authRes.json();
      setCurrentUser(authData.user);

      const teamRes = await fetch('/api/team');
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        setAthletes(teamData.athletes || []);
        setTeam(teamData.team || null);
        setInviteLink(teamData.inviteLink || null);
        setCurrentUserId(teamData.currentUserId || null);

        if (teamData.team) {
          setEditTeamName(teamData.team.name);
          setEditTeamDesc(teamData.team.description || '');
        }
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
      
      if (data.team) {
        setTeam(data.team);
        setInviteLink(data.inviteLink || null);
        setEditTeamName(data.team.name);
        setEditTeamDesc(data.team.description || '');
      }
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
      
      if (data.team) {
        setTeam(data.team);
      }
      setShowJoinModal(false);
      setJoinCode('');
      await loadData();
    } catch (err: any) {
      setJoinError(err.message || 'Erro ao entrar no time.');
    } finally {
      setJoinLoading(false);
    }
  }

  async function handleLeaveTeam() {
    setLeaveLoading(true);
    setLeaveError(null);
    try {
      const res = await fetch('/api/teams/leave', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao sair do time.');

      setShowLeaveModal(false);
      setTeam(null);
      setAthletes([]);
      setInviteLink(null);
      await loadData();
    } catch (err: any) {
      setLeaveError(err.message || 'Erro ao sair do time.');
    } finally {
      setLeaveLoading(false);
    }
  }

  async function handleUpdateTeam(e: React.FormEvent) {
    e.preventDefault();
    setManageLoading(true);
    setManageError(null);
    setManageSuccess(null);
    try {
      const res = await fetch('/api/teams/manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editTeamName, description: editTeamDesc }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar time.');

      setManageSuccess('Time atualizado com sucesso!');
      if (data.team) {
        setTeam(data.team);
      }
      setTimeout(() => {
        setShowManageModal(false);
        setManageSuccess(null);
      }, 1200);
      await loadData();
    } catch (err: any) {
      setManageError(err.message || 'Erro ao atualizar.');
    } finally {
      setManageLoading(false);
    }
  }

  async function handleRenewInviteCode() {
    if (!confirm('Deseja renovar o código de convite? O código anterior deixará de funcionar.')) return;
    setManageLoading(true);
    try {
      const res = await fetch('/api/teams/manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ renewCode: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao renovar código.');

      if (data.team) setTeam(data.team);
      if (data.inviteLink) setInviteLink(data.inviteLink);
      setManageSuccess('Novo código de convite gerado!');
      await loadData();
    } catch (err: any) {
      setManageError(err.message || 'Erro ao renovar código.');
    } finally {
      setManageLoading(false);
    }
  }

  async function handleKickMember(memberId: string, memberName: string) {
    if (!confirm(`Remover o atleta ${memberName} do elenco do time?`)) return;
    try {
      const res = await fetch('/api/teams/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao remover atleta.');

      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao remover atleta.');
    }
  }

  function copyLink() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    });
  }

  // Estatísticas Coletivas do Time
  const teamStats = useMemo(() => {
    if (athletes.length === 0) return null;

    const heights = athletes.filter(a => a.height && a.height > 0).map(a => a.height!);
    const avgHeight = heights.length > 0 ? Math.round(heights.reduce((a, b) => a + b, 0) / heights.length) : null;

    const jumps = athletes.filter(a => a.vertical_jump && a.vertical_jump > 0).map(a => a.vertical_jump!);
    const avgJump = jumps.length > 0 ? Math.round(jumps.reduce((a, b) => a + b, 0) / jumps.length) : null;

    const attacks = athletes.filter(a => a.reach_jumping && a.reach_jumping > 0).map(a => a.reach_jumping!);
    const maxAttack = attacks.length > 0 ? Math.max(...attacks) : null;

    return { avgHeight, avgJump, maxAttack, totalMembers: athletes.length };
  }, [athletes]);

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

  const isCaptain = team && currentUserId && (team.created_by === currentUserId);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070908] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-emerald-400">Carregando dados do time...</p>
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
          subtitle="TIME IFAL · Área coletiva dos atletas e gestão da equipe"
        />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">

          {/* ------------------------------------------------------------------ */}
          {/* SEM TIME: DUAS OPÇÕES BEM VISÍVEIS (CRIAR OU ENTRAR)               */}
          {/* ------------------------------------------------------------------ */}
          {!team ? (
            <div className="space-y-6">
              {/* Banner explicativo */}
              <div className="p-8 rounded-3xl bg-gradient-to-r from-[#0d1612] via-[#09120e] to-[#070908] border border-emerald-500/30 text-center shadow-2xl">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 shadow-neon">
                  <Shield className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide mb-2">
                  Você ainda não pertence a nenhum Time
                </h2>
                <p className="text-sm text-gray-400 max-w-lg mx-auto leading-relaxed">
                  Conecte-se com sua equipe para comparar métricas, acompanhar o elenco e evoluir coletivamente. Escolha uma das opções abaixo:
                </p>
              </div>

              {/* Dois cards de ação bem visíveis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Opção 1: Criar Time */}
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="group p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#0c1912] to-[#080d0a] border-2 border-emerald-500/40 hover:border-emerald-400 hover:shadow-neon transition-all text-left flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-black flex items-center justify-center mb-6 shadow-neon group-hover:scale-110 transition-transform">
                      <Plus className="w-8 h-8 stroke-[2.5]" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-1">
                      Opção 01
                    </span>
                    <h3 className="text-2xl font-black text-white uppercase tracking-wide mb-2">
                      CRIAR UM TIME
                    </h3>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      Crie um novo time agora, defina o nome e gere automaticamente um link de convite exclusivo para seus atletas entrarem direto.
                    </p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-emerald-950/80 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-2 group-hover:gap-3 transition-all">
                      Criar time agora <ArrowRight className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">Você será o capitão</span>
                  </div>
                </button>

                {/* Opção 2: Entrar em um Time */}
                <button
                  type="button"
                  onClick={() => setShowJoinModal(true)}
                  className="group p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#091219] to-[#07090c] border-2 border-sky-500/40 hover:border-sky-400 hover:shadow-[0_0_25px_rgba(56,189,248,0.2)] transition-all text-left flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="w-16 h-16 rounded-2xl bg-sky-500 text-black flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <UserPlus className="w-8 h-8 stroke-[2.5]" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-sky-400 block mb-1">
                      Opção 02
                    </span>
                    <h3 className="text-2xl font-black text-white uppercase tracking-wide mb-2">
                      ENTRAR EM UM TIME
                    </h3>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      Já possui um código de convite da sua equipe? Digite o código para ingressar imediatamente no elenco.
                    </p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-sky-950/80 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-sky-400 uppercase tracking-wider flex items-center gap-2 group-hover:gap-3 transition-all">
                      Inserir código <ArrowRight className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">Entrada instantânea</span>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* ---------------------------------------------------------------- */
            /* COM TIME: BANNER DO TIME + GESTÃO + ESTATÍSTICAS + ELENCO         */
            /* ---------------------------------------------------------------- */
            <div className="space-y-6">
              
              {/* Banner do Time */}
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0d1612] via-[#09120e] to-[#070908] border border-emerald-500/30 shadow-2xl">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5 mb-2">
                      <Trophy className="w-6 h-6 text-emerald-400" />
                      <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide">
                        {team.name}
                      </h2>
                      {isCaptain && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500 text-black text-[10px] font-black uppercase tracking-wider">
                          Capitão / Criador
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs sm:text-sm text-gray-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1.5">
                        Código de Convite: <strong className="font-mono text-emerald-300 font-bold text-sm">{team.code}</strong>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(team.code);
                            alert(`Código ${team.code} copiado com sucesso!`);
                          }}
                          className="p-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold"
                          title="Copiar código"
                        >
                          Copiar Código
                        </button>
                      </span>
                      <span>•</span>
                      <span>{athletes.length} Atleta{athletes.length !== 1 ? 's' : ''} no Elenco</span>
                      {team.description && (
                        <>
                          <span>•</span>
                          <span className="text-gray-400 italic">"{team.description}"</span>
                        </>
                      )}
                    </p>
                  </div>

                  {/* Botões de Ação do Time */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {isCaptain && (
                      <button
                        type="button"
                        onClick={() => setShowManageModal(true)}
                        className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white border border-emerald-950 hover:border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4 text-emerald-400" />
                        <span>Gerenciar Time</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowLeaveModal(true)}
                      className="px-4 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-950/80 text-red-300 border border-red-900/60 hover:border-red-600/80 text-xs font-bold transition-all flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4 text-red-400" />
                      <span>Sair do Time</span>
                    </button>
                  </div>
                </div>

                {/* Link de Convite Compartilhável */}
                {inviteLink && (
                  <div className="mt-6 pt-5 border-t border-emerald-950/60">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-emerald-400" /> Link de Convite para Novos Atletas
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#080d0a] border border-emerald-950/80 rounded-xl px-4 py-2.5 text-xs font-mono text-emerald-300 truncate">
                        {inviteLink}
                      </div>
                      <button
                        type="button"
                        onClick={copyLink}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          linkCopied
                            ? 'bg-emerald-500 text-black shadow-neon'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {linkCopied ? (
                          <><CheckCheck className="w-4 h-4" /> Copiado!</>
                        ) : (
                          <><Copy className="w-4 h-4" /> Copiar Link</>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1.5">
                      Envie para os outros jogadores do time. Ao criar a conta através do link, eles entram direto neste elenco.
                    </p>
                  </div>
                )}
              </div>

              {/* Estatísticas Coletivas do Time */}
              {teamStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="p-4 rounded-2xl bg-[#0a0f0c] border border-emerald-950/80">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Integrantes Ativos</span>
                    <span className="text-xl sm:text-2xl font-black text-white font-mono">{teamStats.totalMembers}</span>
                    <span className="text-[10px] text-gray-500 block mt-0.5">Atletas registrados</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#0a0f0c] border border-emerald-950/80">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Média de Altura</span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">
                      {teamStats.avgHeight ? `${teamStats.avgHeight} cm` : '--'}
                    </span>
                    <span className="text-[10px] text-gray-500 block mt-0.5">Elenco oficial</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#0a0f0c] border border-emerald-950/80">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Média de Salto</span>
                    <span className="text-xl sm:text-2xl font-black text-sky-400 font-mono">
                      {teamStats.avgJump ? `+${teamStats.avgJump} cm` : '--'}
                    </span>
                    <span className="text-[10px] text-gray-500 block mt-0.5">Impulsão líquida</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#0a0f0c] border border-emerald-950/80">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Maior Alcance</span>
                    <span className="text-xl sm:text-2xl font-black text-yellow-400 font-mono">
                      {teamStats.maxAttack ? `${teamStats.maxAttack} cm` : '--'}
                    </span>
                    <span className="text-[10px] text-gray-500 block mt-0.5">Em salto de ataque</span>
                  </div>
                </div>
              )}

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
                        type="button"
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-lg transition-colors ${
                          viewMode === 'grid' ? 'bg-emerald-500 text-black shadow-neon' : 'text-gray-400 hover:text-white'
                        }`}
                        title="Visualização em Grade"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
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
                    type="button"
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
                        type="button"
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
                    {athletes.length === 0 ? 'Nenhum atleta no elenco ainda' : 'Nenhum atleta encontrado'}
                  </h3>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    {athletes.length === 0
                      ? 'Compartilhe o link de convite acima para que os outros integrantes entrem no elenco.'
                      : 'Tente ajustar os termos da busca ou limpar o filtro por posição.'}
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredAthletes.map((athlete) => (
                    <div key={athlete.id} className="relative group">
                      <AthleteCard
                        athlete={athlete}
                        isCurrentUser={currentUserId === athlete.id}
                        onSelect={(ath) => setSelectedAthlete(ath)}
                      />
                      {/* Botão de remoção (visível apenas para o capitão e não em si próprio) */}
                      {isCaptain && athlete.id !== currentUserId && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleKickMember(athlete.id, athlete.name);
                          }}
                          className="absolute top-4 right-4 p-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-600/60 text-red-300 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          title="Remover atleta do time"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
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
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setSelectedAthlete(ath); }}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 transition-colors"
                                >
                                  Ver Detalhes
                                </button>
                                {isCaptain && ath.id !== currentUserId && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleKickMember(ath.id, ath.name);
                                    }}
                                    className="p-1 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800 transition-colors"
                                    title="Remover atleta"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0a0f0c] border border-emerald-500/40 rounded-3xl p-7 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-wide">Criar Novo Time</h3>
              </div>
              <button
                type="button"
                onClick={() => { setShowCreateModal(false); setCreateError(null); }}
                className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{createError}</span>
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
                  placeholder="Ex: Time IFAL Vôlei Principal"
                  required
                  minLength={2}
                  className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Descrição do Time (opcional)
                </label>
                <textarea
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  placeholder="Ex: Equipe de voleibol de alto rendimento masculino do IFAL Campus Maceió"
                  rows={3}
                  className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={createLoading}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm tracking-wider uppercase shadow-neon transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {createLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Criando Time...</>
                ) : (
                  <><Plus className="w-4 h-4" /> Confirmar e Criar Time</>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0a0f0c] border border-sky-500/40 rounded-3xl p-7 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-sky-400" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-wide">Entrar em um Time</h3>
              </div>
              <button
                type="button"
                onClick={() => { setShowJoinModal(false); setJoinError(null); }}
                className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {joinError && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{joinError}</span>
              </div>
            )}

            <form onSubmit={handleJoinTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Código de Convite do Time
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Ex: TIME-1234"
                  required
                  className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-sky-500 rounded-xl px-4 py-3 text-sm text-white font-mono tracking-widest focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors uppercase"
                />
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Insira o código alfanumérico fornecido pelo responsável do time.
                </p>
              </div>
              <button
                type="submit"
                disabled={joinLoading}
                className="w-full py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-extrabold text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {joinLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Verificando Código...</>
                ) : (
                  <><UserPlus className="w-4 h-4" /> Ingressar no Time</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: SAIR DO TIME                                                 */}
      {/* ------------------------------------------------------------------ */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0a0f0c] border border-red-600/40 rounded-3xl p-7 shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-red-400">
              <LogOut className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">Sair do Time</h3>
            </div>

            <p className="text-xs text-gray-300 mb-4 leading-relaxed">
              Você tem certeza de que deseja se desligar do time <strong className="text-white">{team?.name}</strong>?
              Suas avaliações individuais continuarão salvas em sua conta.
            </p>

            {leaveError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-600 text-red-300 text-xs">
                {leaveError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={leaveLoading}
                onClick={() => { setShowLeaveModal(false); setLeaveError(null); }}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={leaveLoading}
                onClick={handleLeaveTeam}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {leaveLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saindo...</>
                ) : (
                  <><LogOut className="w-4 h-4" /> Confirmar Saída</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: GERENCIAR TIME (CAPITÃO/CRIADOR)                             */}
      {/* ------------------------------------------------------------------ */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0a0f0c] border border-emerald-500/40 rounded-3xl p-7 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-wide">Gerenciar Time</h3>
              </div>
              <button
                type="button"
                onClick={() => { setShowManageModal(false); setManageError(null); setManageSuccess(null); }}
                className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {manageSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{manageSuccess}</span>
              </div>
            )}

            {manageError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500 text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>{manageError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Nome do Time
                </label>
                <input
                  type="text"
                  value={editTeamName}
                  onChange={(e) => setEditTeamName(e.target.value)}
                  required
                  className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Descrição
                </label>
                <textarea
                  value={editTeamDesc}
                  onChange={(e) => setEditTeamDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors resize-none"
                />
              </div>

              <div className="pt-2 border-t border-emerald-950 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={manageLoading}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider shadow-neon transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {manageLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Alterações'}
                </button>

                <button
                  type="button"
                  onClick={handleRenewInviteCode}
                  disabled={manageLoading}
                  className="w-full py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 border border-emerald-950 hover:border-emerald-500/30 text-xs font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Gerar Novo Código de Convite</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
