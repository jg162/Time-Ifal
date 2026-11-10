'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { User, Profile, Position, POSITIONS, SERVE_TYPES, ServeType, LATERALITIES, Laterality, Evaluation } from '@/lib/types';
import { calculateAge, calculateBMI, getBMICategory, getJumpCategory } from '@/lib/calculations';
import { 
  User as UserIcon, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Camera, 
  Activity, 
  Calendar,
  Sparkles,
  Zap,
  Ruler,
  Weight,
  Maximize2,
  FileText,
  PlusCircle,
  Clock,
  ArrowRight
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
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

  // Form states
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [wingspan, setWingspan] = useState<string>('');
  const [position, setPosition] = useState<Position>('Ponteiro');
  const [laterality, setLaterality] = useState<Laterality | null>(null);
  const [practiceTime, setPracticeTime] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [serveTypes, setServeTypes] = useState<ServeType[]>(['Flutuante pulando']);
  const [bioGoals, setBioGoals] = useState('');

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Idade calculada automaticamente a partir da data de nascimento
  const calculatedAge = useMemo(() => {
    if (!birthDate) return null;
    return calculateAge(birthDate);
  }, [birthDate]);

  useEffect(() => {
    async function loadData() {
      try {
        const [authRes, evalRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/evaluations')
        ]);

        if (!authRes.ok) {
          router.push('/login');
          return;
        }

        const data = await authRes.json();
        setUser(data.user);
        setProfile(data.profile);

        let userEvals: Evaluation[] = [];
        if (evalRes.ok) {
          const evalData = await evalRes.json();
          userEvals = evalData.evaluations || [];
          setEvaluations(userEvals);
        }

        const latestEv = userEvals.length > 0 ? userEvals[userEvals.length - 1] : null;

        setFullName(data.profile?.full_name || data.user.name || '');
        setBirthDate(data.profile?.birth_date || latestEv?.birth_date || '');
        setHeight(data.profile?.height != null ? String(data.profile.height) : (latestEv?.height != null ? String(latestEv.height) : ''));
        setWeight(data.profile?.weight != null ? String(data.profile.weight) : (latestEv?.weight != null ? String(latestEv.weight) : ''));
        setWingspan(data.profile?.wingspan != null ? String(data.profile.wingspan) : (latestEv?.wingspan != null ? String(latestEv.wingspan) : ''));
        setPosition(data.profile?.preferred_position || latestEv?.position || 'Ponteiro');
        setLaterality(data.profile?.laterality ?? latestEv?.laterality ?? null);
        setPracticeTime(data.profile?.practice_time || latestEv?.practice_time || '');
        setAvatarUrl(data.user.avatar_url || '');
        setServeTypes(data.profile?.serve_types || latestEv?.serve_types || ['Flutuante pulando']);
        setBioGoals(data.profile?.bio_goals || latestEv?.goals || '');
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  // Cálculos de Recordes Pessoais (Ficha Técnica Incorporada)
  const personalRecords = useMemo(() => {
    if (evaluations.length === 0) return null;

    let bestJump = 0;
    let bestReach = 0;
    let bestAttack = 0;
    let bestBlock = 0;

    for (const ev of evaluations) {
      if (ev.vertical_jump && ev.vertical_jump > bestJump) bestJump = ev.vertical_jump;
      if (ev.reach_jumping && ev.reach_jumping > bestReach) bestReach = ev.reach_jumping;
      if (ev.attack_reach && ev.attack_reach > bestAttack) bestAttack = ev.attack_reach;
      if (ev.block_reach && ev.block_reach > bestBlock) bestBlock = ev.block_reach;
    }

    const latest = evaluations[evaluations.length - 1];

    return {
      bestJump,
      bestReach,
      bestAttack: bestAttack > 0 ? bestAttack : null,
      bestBlock: bestBlock > 0 ? bestBlock : null,
      totalEvaluations: evaluations.length,
      latestDate: latest?.evaluation_date || null,
      latestBmi: latest?.bmi || null,
    };
  }, [evaluations]);

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

    const parsedHeight = height ? parseFloat(height) : null;
    const parsedWeight = weight ? parseFloat(weight) : null;
    const parsedWingspan = wingspan ? parseFloat(wingspan) : null;

    if (parsedHeight !== null && (isNaN(parsedHeight) || parsedHeight <= 0)) {
      setErrorMessage('Por favor, informe uma altura válida em centímetros.');
      setSaving(false);
      return;
    }

    if (parsedWeight !== null && (isNaN(parsedWeight) || parsedWeight <= 0)) {
      setErrorMessage('Por favor, informe um peso corporal válido em kg.');
      setSaving(false);
      return;
    }

    if (parsedWingspan !== null && (isNaN(parsedWingspan) || parsedWingspan <= 0)) {
      setErrorMessage('Por favor, informe uma envergadura válida em centímetros.');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          full_name: fullName.trim(),
          birth_date: birthDate || null,
          height: parsedHeight,
          weight: parsedWeight,
          wingspan: parsedWingspan,
          preferred_position: position,
          laterality: laterality ?? undefined,
          practice_time: practiceTime.trim(),
          avatar_url: avatarUrl.trim() || undefined,
          serve_types: serveTypes,
          bio_goals: bioGoals.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao atualizar perfil.');
      }

      setSuccessMessage('Perfil do atleta atualizado com sucesso no banco de dados!');
      if (user) {
        setUser({ ...user, name: fullName.trim(), avatar_url: avatarUrl.trim() });
      }
      if (data.profile) {
        setProfile(data.profile);
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
          <p className="text-sm font-semibold text-emerald-400">Carregando perfil do atleta...</p>
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
          subtitle="TIME IFAL · Dados cadastrais, antropométricos e ficha técnica do atleta"
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

          {/* FICHA TÉCNICA E DESEMPENHO DO ATLETA (INCORPORADA) */}
          <div className="athletic-card rounded-2xl p-6 sm:p-8 border border-emerald-500/30 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-emerald-950/60 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-wide">
                    Ficha Técnica & Recordes Pessoais
                  </h3>
                  <p className="text-xs text-gray-400">
                    Resumo do desempenho físico registrado nas avaliações do atleta
                  </p>
                </div>
              </div>

              <Link
                href="/avaliacao"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nova Avaliação</span>
              </Link>
            </div>

            {personalRecords ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Maior Salto Líquido */}
                  <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/30">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">
                      Melhor Salto Vertical
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                      +{personalRecords.bestJump} cm
                    </span>
                    <span className="text-[10px] text-gray-500 block mt-0.5">Impulsão líquida</span>
                  </div>

                  {/* Alcance no Salto */}
                  <div className="p-4 rounded-xl bg-black/40 border border-emerald-950/80">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">
                      Maior Alcance Pulando
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-white font-mono">
                      {personalRecords.bestReach} cm
                    </span>
                    <span className="text-[10px] text-gray-500 block mt-0.5">Toque máximo</span>
                  </div>

                  {/* Alcance de Ataque */}
                  <div className="p-4 rounded-xl bg-black/40 border border-emerald-950/80">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">
                      Alcance de Ataque
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-white font-mono">
                      {personalRecords.bestAttack ? `${personalRecords.bestAttack} cm` : '--'}
                    </span>
                    <span className="text-[10px] text-gray-500 block mt-0.5">Golpe de ataque</span>
                  </div>

                  {/* Alcance de Bloqueio */}
                  <div className="p-4 rounded-xl bg-black/40 border border-emerald-950/80">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">
                      Alcance de Bloqueio
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-white font-mono">
                      {personalRecords.bestBlock ? `${personalRecords.bestBlock} cm` : '--'}
                    </span>
                    <span className="text-[10px] text-gray-500 block mt-0.5">Rede</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/30 border border-emerald-950/60 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
                  <span>
                    Total de testes salvos: <strong className="text-emerald-300 font-mono font-bold">{personalRecords.totalEvaluations}</strong>
                  </span>
                  <span>
                    Última avaliação: <strong className="text-white">{personalRecords.latestDate ? new Date(personalRecords.latestDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Nenhuma'}</strong>
                  </span>
                  <Link href="/avaliacoes" className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1">
                    Ver histórico completo <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-black/40 border border-emerald-950/80 text-center">
                <FileText className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-gray-300 mb-1">
                  Nenhuma avaliação física registrada ainda
                </h4>
                <p className="text-xs text-gray-500 max-w-md mx-auto mb-4 leading-relaxed">
                  Suas métricas oficiais de voleibol (salto vertical líquido, recordes de alcance de ataque e bloqueio) serão calculadas automaticamente assim que você registrar sua primeira avaliação física.
                </p>
                <Link
                  href="/avaliacao"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-wider shadow-neon transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Cadastrar Primeira Avaliação</span>
                </Link>
              </div>
            )}
          </div>

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

            {/* DADOS PESSOAIS E BIOMÉTRICOS */}
            <div className="athletic-card rounded-2xl p-6 sm:p-8 space-y-5">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-emerald-400" /> Informações do Atleta
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Nome Completo */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* E-mail de Login */}
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

                {/* Data de Nascimento */}
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

                {/* Idade Calculada Automaticamente */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Idade Calculada Automaticamente
                  </label>
                  <div className="w-full bg-[#080c09]/50 border border-emerald-950/40 rounded-xl px-4 py-3 text-sm text-white flex items-center justify-between">
                    <span className="text-gray-400 text-xs">
                      {birthDate ? 'Calculada em tempo real' : 'Informe sua data de nascimento'}
                    </span>
                    <span className="font-bold font-mono text-emerald-400">
                      {calculatedAge !== null ? `${calculatedAge} anos` : 'Pendente'}
                    </span>
                  </div>
                </div>

                {/* Altura */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-emerald-400" /> Altura (cm)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Ex: 195"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                    <span className="absolute right-4 top-3 text-xs font-bold text-gray-500">cm</span>
                  </div>
                </div>

                {/* Peso */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Weight className="w-3.5 h-3.5 text-emerald-400" /> Peso Corporal (kg)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 85.0"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                    <span className="absolute right-4 top-3 text-xs font-bold text-gray-500">kg</span>
                  </div>
                </div>

                {/* Envergadura */}
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5 text-emerald-400" /> Envergadura (cm)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Ex: 202"
                      value={wingspan}
                      onChange={(e) => setWingspan(e.target.value)}
                      className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                    <span className="absolute right-4 top-3 text-xs font-bold text-gray-500">cm</span>
                  </div>
                </div>

                {/* Posição em Quadra */}
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

                {/* Lateralidade */}
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

                {/* Tempo de Prática */}
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

              {/* Tipos de Saque */}
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

              {/* Objetivos Pessoais */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Objetivos Pessoais e Metas no Voleibol
                </label>
                <textarea
                  rows={3}
                  value={bioGoals}
                  onChange={(e) => setBioGoals(e.target.value)}
                  placeholder="Seus objetivos gerais de evolução técnica, impulsão e aspirações no voleibol..."
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