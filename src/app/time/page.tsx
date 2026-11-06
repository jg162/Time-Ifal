'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import AthleteCard from '@/components/AthleteCard';
import AthleteModal from '@/components/AthleteModal';
import { User, TeamAthlete, Position, POSITIONS } from '@/lib/types';
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
  ChevronDown
} from 'lucide-react';

export default function TimePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [athletes, setAthletes] = useState<TeamAthlete[]>([]);

  // Filtering & Sorting states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('TODOS');
  const [sortBy, setSortBy] = useState<string>('reach_desc'); // reach_desc, height_desc, height_asc, jump_desc, name_asc, updated_desc
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal detail state
  const [selectedAthlete, setSelectedAthlete] = useState<TeamAthlete | null>(null);

  useEffect(() => {
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
        }
      } catch (err) {
        console.error('Error loading team data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filter and sort athletes
  const filteredAthletes = useMemo(() => {
    return athletes
      .filter((athlete) => {
        const matchesName = athlete.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPosition = selectedPosition === 'TODOS' || athlete.position === selectedPosition;
        return matchesName && matchesPosition;
      })
      .sort((a, b) => {
        if (sortBy === 'height_desc') {
          return (b.height || 0) - (a.height || 0);
        }
        if (sortBy === 'height_asc') {
          return (a.height || 999) - (b.height || 999);
        }
        if (sortBy === 'reach_desc') {
          return (b.reach_jumping || 0) - (a.reach_jumping || 0);
        }
        if (sortBy === 'jump_desc') {
          return (b.vertical_jump || 0) - (a.vertical_jump || 0);
        }
        if (sortBy === 'name_asc') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'updated_desc') {
          return (b.last_updated || '').localeCompare(a.last_updated || '');
        }
        return 0;
      });
  }, [athletes, searchQuery, selectedPosition, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070908] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-emerald-400">Carregando elenco do TIME IFAL · VOLLEY PERFORMANCE...</p>
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
          {/* Header Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0d1612] via-[#09120e] to-[#070908] border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide">
                  Elenco Coletivo de Voleibol
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-300">
                Visualize os dados físicos e técnicos dos outros atletas cadastrados na plataforma.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{athletes.length} Atletas Cadastrados</span>
            </div>
          </div>

          {/* SEARCH, FILTERS & SORTING CONTROLS */}
          <div className="athletic-card rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              {/* Search input */}
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

              {/* Sort By Select */}
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

                {/* View Mode Toggle (Grid / Table) */}
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

          {/* ATHLETES LISTING (GRID OR TABLE) */}
          {filteredAthletes.length === 0 ? (
            <div className="athletic-card rounded-2xl p-12 text-center">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">Nenhum atleta encontrado</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Tente ajustar os termos da busca ou limpar o filtro por posição.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAthletes.map((athlete) => (
                <AthleteCard
                  key={athlete.id}
                  athlete={athlete}
                  isCurrentUser={currentUser?.id === athlete.id}
                  onSelect={(ath) => setSelectedAthlete(ath)}
                />
              ))}
            </div>
          ) : (
            /* Table View */
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
                              {currentUser?.id === ath.id && (
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
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAthlete(ath);
                            }}
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
        </main>
      </div>

      {/* ATHLETE MODAL DETAIL */}
      <AthleteModal
        athlete={selectedAthlete}
        onClose={() => setSelectedAthlete(null)}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}
