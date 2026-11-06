'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { User, Profile, Position, POSITIONS, SERVE_TYPES, ServeType, LATERALITIES, Laterality } from '@/lib/types';
import { 
  User as UserIcon, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Camera, 
  Activity, 
  Calendar,
  Sparkles,
  Zap
} from 'lucide-react';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
];

export default function PerfilPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [position, setPosition] = useState<Position>('Ponteiro');
  const [laterality, setLaterality] = useState<Laterality | null>(null);
  const [practiceTime, setPracticeTime] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [serveTypes, setServeTypes] = useState<ServeType[]>(['Flutuante pulando']);
  const [bioGoals, setBioGoals] = useState('');

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }

        const data = await res.json();
        setUser(data.user);
        setProfile(data.profile);

        setFullName(data.profile?.full_name || data.user.name || '');
        setBirthDate(data.profile?.birth_date || '');
        setPosition(data.profile?.preferred_position || 'Ponteiro');
        setLaterality(data.profile?.laterality ?? null);
        setPracticeTime(data.profile?.practice_time || '');
        setAvatarUrl(data.user.avatar_url || '');
        setServeTypes(data.profile?.serve_types || ['Flutuante pulando']);
        setBioGoals(data.profile?.bio_goals || '');
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const toggleServe = (serve: ServeType) => {
    if (serveTypes.includes(serve)) {
      setServeTypes(serveTypes.filter((s) => s !== serve));
    } else {
      setServeTypes([...serveTypes, serve]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          full_name: fullName,
          birth_date: birthDate,
          preferred_position: position,
          laterality: laterality ?? undefined,
          practice_time: practiceTime,
          avatar_url: avatarUrl,
          serve_types: serveTypes,
          bio_goals: bioGoals,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao atualizar perfil.');
      }

      setSuccessMessage('Perfil atualizado com sucesso!');
      if (user) {
        setUser({ ...user, name: fullName, avatar_url: avatarUrl });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070908] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-emerald-400">Carregando perfil...</p>
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
          title="Meu Perfil"
          subtitle="Gerencie suas informações cadastrais e dados de jogador"
        />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full">
          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex items-center gap-3 text-emerald-300 text-sm shadow-neon">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/50 flex items-center gap-3 text-red-300 text-sm">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* AVATAR SECTION */}
            <div className="athletic-card rounded-2xl p-6 sm:p-8">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" /> Foto de Perfil / Avatar
              </h3>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <img
                  src={avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName || 'atleta')}`}
                  alt="Avatar"
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-400 shadow-neon bg-emerald-950/30"
                />

                <div className="flex-1 space-y-3 text-center sm:text-left">
                  <p className="text-xs text-gray-300">
                    Escolha um dos avatares esportivos ou insira a URL da sua foto:
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    {AVATAR_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatarUrl(preset)}
                        className={`w-10 h-10 rounded-xl overflow-hidden border transition-all ${
                          avatarUrl === preset ? 'border-emerald-400 scale-110 shadow-neon' : 'border-gray-700 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={preset} alt="preset" className="w-full h-full object-cover" />
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setAvatarUrl(`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName || 'novo')}`)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-[10px] font-bold text-emerald-400 hover:bg-emerald-900/50"
                    >
                      Avatar Robótico
                    </button>
                  </div>

                  <input
                    type="url"
                    placeholder="Ou cole a URL direta de uma imagem personalizada"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* PERSONAL DATA */}
            <div className="athletic-card rounded-2xl p-6 sm:p-8 space-y-5">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-emerald-400" /> Informações do Jogador
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    E-mail (Login)
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-[#080c09]/50 border border-emerald-950/40 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Posição em Quadra
                  </label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value as Position)}
                    className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {POSITIONS.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Lateralidade de Jogo
                  </label>
                  <select
                    value={laterality || ''}
                    onChange={(e) => setLaterality((e.target.value || null) as Laterality | null)}
                    className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">Não informado</option>
                    {LATERALITIES.map((lat) => (
                      <option key={lat} value={lat}>
                        {lat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Tempo de Prática do Voleibol
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 3 anos"
                    value={practiceTime}
                    onChange={(e) => setPracticeTime(e.target.value)}
                    className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Saques */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Tipos de Saque Praticados
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SERVE_TYPES.map((serve) => {
                    const isChecked = serveTypes.includes(serve);
                    return (
                      <button
                        key={serve}
                        type="button"
                        onClick={() => toggleServe(serve)}
                        className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-left ${
                          isChecked
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500 shadow-sm'
                            : 'bg-[#080c09] text-gray-400 border-emerald-950/80 hover:text-gray-200'
                        }`}
                      >
                        {serve}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Objetivos */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Objetivos Gerais e Metas de Voleibol
                </label>
                <textarea
                  rows={3}
                  value={bioGoals}
                  onChange={(e) => setBioGoals(e.target.value)}
                  placeholder="Seus objetivos gerais de evolução técnica, física e aspirações no voleibol..."
                  className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl p-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* SAVE BUTTON */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm uppercase tracking-wider shadow-neon hover:shadow-neon-strong transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Salvando...' : 'Atualizar Perfil'}</span>
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
