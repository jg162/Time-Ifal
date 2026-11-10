'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import { User, Profile, Position, POSITIONS, SERVE_TYPES, ServeType, LATERALITIES, Laterality, Evaluation } from '@/lib/types';
import { calculateAge } from '@/lib/calculations';
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
  ArrowRight,
  Upload,
  Trash2,
  Shield,
  Award,
  Check,
  Lock,
  Layers,
  ChevronRight
} from 'lucide-react';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
];

type ProfileTab = 'dados' | 'ficha' | 'foto';

export default function PerfilPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ProfileTab>('dados');
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

        // Normalização de data de nascimento para input date (YYYY-MM-DD)
        const rawBirthDate = data.profile?.birth_date || latestEv?.birth_date || '';
        const cleanBirthDate = rawBirthDate ? String(rawBirthDate).split('T')[0] : '';

        setFullName(data.profile?.full_name || data.user.name || '');
        setBirthDate(cleanBirthDate);
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
        setErrorMessage('Falha ao carregar os dados do atleta. Verifique sua conexão.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  // Cálculos de Recordes Pessoais
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, selecione uma foto válida da galeria (PNG, JPG, JPEG, WEBP).');
      return;
    }

    setUploadingImage(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onerror = () => {
      setErrorMessage('Erro ao ler a foto selecionada. Tente novamente.');
      setUploadingImage(false);
    };

    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => {
        setErrorMessage('Não foi possível processar a imagem selecionada.');
        setUploadingImage(false);
      };
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 400; // 400px garante ótima nitidez e arquivo leve (~30KB)
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
            setAvatarUrl(compressedDataUrl);
            setSuccessMessage('Foto carregada com sucesso! Clique em "Salvar alterações" para aplicar ao seu perfil.');
          }
        } catch (err) {
          console.error('Image compression error:', err);
          setErrorMessage('Não foi possível comprimir a foto. Escolha outra imagem menor.');
        } finally {
          setUploadingImage(false);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('O Nome Completo do atleta é obrigatório.');
      setSaving(false);
      return;
    }

    // Helper robusto para converter vírgula/ponto e metros para centímetros
    const parseNumber = (val: string, isDimension = false): number | null => {
      if (!val || !val.trim()) return null;
      const clean = val.trim().replace(',', '.');
      const num = parseFloat(clean);
      if (isNaN(num) || num <= 0) return null;
      // Se usuário digitou 1.85 ou 1.95 para altura/envergadura, converte para 185 cm
      if (isDimension && num < 3.0) return Math.round(num * 100);
      return Math.round(num * 10) / 10;
    };

    const parsedHeight = parseNumber(height, true);
    const parsedWeight = parseNumber(weight, false);
    const parsedWingspan = parseNumber(wingspan, true);

    if (height && parsedHeight === null) {
      setErrorMessage('Por favor, informe uma altura válida em centímetros (ex: 185 ou 1.85).');
      setSaving(false);
      return;
    }

    if (weight && parsedWeight === null) {
      setErrorMessage('Por favor, informe um peso corporal válido em kg (ex: 78.5 ou 78,5).');
      setSaving(false);
      return;
    }

    if (wingspan && parsedWingspan === null) {
      setErrorMessage('Por favor, informe uma envergadura válida em centímetros (ex: 190 ou 1.90).');
      setSaving(false);
      return;
    }

    try {
      const payload = {
        name: fullName.trim(),
        full_name: fullName.trim(),
        birth_date: birthDate ? birthDate.trim().split('T')[0] : null,
        height: parsedHeight,
        weight: parsedWeight,
        wingspan: parsedWingspan,
        preferred_position: position,
        laterality: laterality || null,
        practice_time: practiceTime.trim(),
        avatar_url: avatarUrl ? avatarUrl.trim() : null,
        serve_types: serveTypes,
        bio_goals: bioGoals.trim(),
      };

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao atualizar o perfil.');
      }

      setSuccessMessage('Perfil atualizado com sucesso no TIME IFAL!');
      if (user) {
        setUser({
          ...user,
          name: fullName.trim(),
          avatar_url: avatarUrl ? avatarUrl.trim() : null
        });
      }
      if (data.profile) {
        setProfile(data.profile);
      }

      // Auto-limpar mensagem de sucesso após 4 segundos
      setTimeout(() => {
        setSuccessMessage((prev) => (prev ? null : prev));
      }, 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar perfil.');
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

  const avatarDisplay = avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName || user?.name || 'atleta')}`;

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
          subtitle="TIME IFAL · Dados cadastrais, antropometria e desempenho físico"
        />

        <main className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-4xl mx-auto w-full pb-28 lg:pb-12">
          {/* MENSAGEM DE SUCESSO */}
          {successMessage && (
            <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/60 flex items-center gap-3 text-emerald-300 text-xs sm:text-sm shadow-neon animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="flex-1 font-medium">{successMessage}</span>
            </div>
          )}

          {/* MENSAGEM DE ERRO */}
          {errorMessage && (
            <div className="p-3.5 sm:p-4 rounded-xl bg-red-950/80 border border-red-500/60 flex items-center gap-3 text-red-300 text-xs sm:text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span className="flex-1 font-medium">{errorMessage}</span>
            </div>
          )}

          {/* CABEÇALHO RESUMO DO ATLETA (CARD ATLHÉTICO) */}
          <div className="athletic-card rounded-2xl p-4 sm:p-6 border border-emerald-500/30 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 relative z-10">
              {/* Foto com atalho para trocar */}
              <div className="relative group flex-shrink-0">
                <img
                  src={avatarDisplay}
                  alt={fullName || 'Atleta'}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-emerald-400 shadow-neon bg-emerald-950/40"
                />
                <button
                  type="button"
                  onClick={() => setActiveTab('foto')}
                  className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg transition-transform active:scale-95"
                  title="Alterar Foto"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Informações Centrais */}
              <div className="flex-1 text-center sm:text-left min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-lg sm:text-2xl font-black text-white tracking-wide truncate">
                    {fullName || 'Nome do Atleta'}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-950/90 text-emerald-300 border border-emerald-500/40">
                    {position}
                  </span>
                </div>

                <p className="text-xs text-gray-400 truncate">
                  {user?.email || 'atleta@timeifal.com.br'}
                </p>

                {/* Métricas Rápidas em Pílulas */}
                <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                  <div className="px-3 py-1 rounded-lg bg-black/40 border border-emerald-950/80 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-gray-400">Idade:</span>
                    <strong className="text-white font-mono">{calculatedAge !== null ? `${calculatedAge} anos` : '--'}</strong>
                  </div>

                  <div className="px-3 py-1 rounded-lg bg-black/40 border border-emerald-950/80 flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-gray-400">Altura:</span>
                    <strong className="text-white font-mono">{height ? `${height} cm` : '--'}</strong>
                  </div>

                  <div className="px-3 py-1 rounded-lg bg-black/40 border border-emerald-950/80 flex items-center gap-1.5">
                    <Weight className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-gray-400">Peso:</span>
                    <strong className="text-white font-mono">{weight ? `${weight} kg` : '--'}</strong>
                  </div>

                  {personalRecords && personalRecords.bestJump > 0 && (
                    <div className="px-3 py-1 rounded-lg bg-emerald-950/50 border border-emerald-500/40 flex items-center gap-1.5 text-emerald-300">
                      <Zap className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Salto:</span>
                      <strong className="font-mono font-bold">+{personalRecords.bestJump} cm</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Botão de Salvar Rápido no Topo (Desktop e Tablet) */}
              <div className="hidden sm:flex flex-col items-end gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider shadow-neon hover:shadow-neon-strong transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Salvando...' : 'Salvar Perfil'}</span>
                </button>
                <span className="text-[10px] text-gray-500">Dados protegidos</span>
              </div>
            </div>
          </div>

          {/* SELETOR DE ABAS RESPONSIVO (MOBILE & DESKTOP) */}
          <div className="flex rounded-xl bg-[#080c09] p-1 border border-emerald-950/80 text-xs font-bold gap-1 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('dados')}
              className={`flex-1 py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'dados'
                  ? 'bg-emerald-500 text-black shadow-neon font-black'
                  : 'text-gray-400 hover:text-white hover:bg-emerald-950/30'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Dados & Medidas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ficha')}
              className={`flex-1 py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'ficha'
                  ? 'bg-emerald-500 text-black shadow-neon font-black'
                  : 'text-gray-400 hover:text-white hover:bg-emerald-950/30'
              }`}
            >
              <Activity className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Ficha & Recordes</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('foto')}
              className={`flex-1 py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'foto'
                  ? 'bg-emerald-500 text-black shadow-neon font-black'
                  : 'text-gray-400 hover:text-white hover:bg-emerald-950/30'
              }`}
            >
              <Camera className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Foto & Avatar</span>
            </button>
          </div>

          {/* FORMULÁRIO PRINCIPAL */}
          <form onSubmit={handleSave} className="space-y-5">
            {/* ============================================================ */}
            {/* ABA 1: DADOS PESSOAIS & MEDIDAS BIOMÉTRICAS */}
            {/* ============================================================ */}
            {activeTab === 'dados' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* GRUPO 1: IDENTIFICAÇÃO DO ATLETA */}
                <div className="athletic-card rounded-2xl p-4 sm:p-7 space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-emerald-950/60">
                    <UserIcon className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs sm:text-sm font-bold text-gray-200 uppercase tracking-wider">
                      Identificação & Dados do Atleta
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Nome Completo */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Seu nome completo"
                        required
                        className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-gray-600"
                      />
                    </div>

                    {/* E-mail de Login */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-gray-500" /> E-mail (Conta)
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full bg-[#080c09]/50 border border-emerald-950/40 rounded-xl px-3.5 py-3 text-sm text-gray-500 cursor-not-allowed select-none"
                      />
                    </div>

                    {/* Data de Nascimento com Idade Automática */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                          Data de Nascimento
                        </label>
                        {calculatedAge !== null && (
                          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                            {calculatedAge} anos
                          </span>
                        )}
                      </div>
                      <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all [color-scheme:dark]"
                      />
                    </div>

                    {/* Posição em Quadra */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                        Posição Principal
                      </label>
                      <select
                        value={position}
                        onChange={(e) => setPosition(e.target.value as Position)}
                        className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                      >
                        {POSITIONS.map((pos) => (
                          <option key={pos} value={pos} className="bg-[#080c09] text-white">
                            {pos}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Lateralidade */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                        Lateralidade de Jogo
                      </label>
                      <select
                        value={laterality || ''}
                        onChange={(e) => setLaterality((e.target.value || null) as Laterality | null)}
                        className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                      >
                        <option value="" className="bg-[#080c09] text-gray-500">Não informado</option>
                        {LATERALITIES.map((lat) => (
                          <option key={lat} value={lat} className="bg-[#080c09] text-white">
                            {lat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tempo de Prática */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                        Tempo de Prática de Voleibol
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 2 anos, Desde 2022, Iniciante"
                        value={practiceTime}
                        onChange={(e) => setPracticeTime(e.target.value)}
                        className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-gray-600"
                      />
                    </div>
                  </div>
                </div>

                {/* GRUPO 2: MEDIDAS ANTROPOMÉTRICAS (FÍSICAS) */}
                <div className="athletic-card rounded-2xl p-4 sm:p-7 space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-emerald-950/60">
                    <Ruler className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs sm:text-sm font-bold text-gray-200 uppercase tracking-wider">
                      Medidas Antropométricas & Físicas
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {/* Altura */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Ruler className="w-3.5 h-3.5 text-emerald-400" /> Altura
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="Ex: 185"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl pl-3.5 pr-10 py-3 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-gray-600"
                        />
                        <span className="absolute right-3.5 top-3.5 text-xs font-bold text-emerald-400/80">cm</span>
                      </div>
                      <span className="text-[10px] text-gray-500 mt-1 block">Aceita ex: 185 ou 1.85</span>
                    </div>

                    {/* Peso */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Weight className="w-3.5 h-3.5 text-emerald-400" /> Peso Corporal
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="Ex: 78.5"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl pl-3.5 pr-10 py-3 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-gray-600"
                        />
                        <span className="absolute right-3.5 top-3.5 text-xs font-bold text-emerald-400/80">kg</span>
                      </div>
                      <span className="text-[10px] text-gray-500 mt-1 block">Aceita ex: 78.5 ou 78,5</span>
                    </div>

                    {/* Envergadura */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Maximize2 className="w-3.5 h-3.5 text-emerald-400" /> Envergadura
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="Ex: 192"
                          value={wingspan}
                          onChange={(e) => setWingspan(e.target.value)}
                          className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl pl-3.5 pr-10 py-3 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-gray-600"
                        />
                        <span className="absolute right-3.5 top-3.5 text-xs font-bold text-emerald-400/80">cm</span>
                      </div>
                      <span className="text-[10px] text-gray-500 mt-1 block">Distância braços abertos</span>
                    </div>
                  </div>
                </div>

                {/* GRUPO 3: CARACTERÍSTICAS & METAS */}
                <div className="athletic-card rounded-2xl p-4 sm:p-7 space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-emerald-950/60">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs sm:text-sm font-bold text-gray-200 uppercase tracking-wider">
                      Características Técnicas & Objetivos
                    </h3>
                  </div>

                  {/* Tipos de Saque */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                      Tipos de Saque Praticados (Toque para selecionar)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {SERVE_TYPES.map((serve) => {
                        const isChecked = serveTypes.includes(serve);
                        return (
                          <button
                            key={serve}
                            type="button"
                            onClick={() => toggleServe(serve)}
                            className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between gap-2 active:scale-98 ${
                              isChecked
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500 shadow-sm'
                                : 'bg-[#080c09] text-gray-400 border-emerald-950/80 hover:text-gray-200 hover:border-emerald-800/60'
                            }`}
                          >
                            <span className="truncate">{serve}</span>
                            {isChecked && <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Objetivos Pessoais */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                      Objetivos Pessoais e Aspirações no Voleibol
                    </label>
                    <textarea
                      rows={3}
                      value={bioGoals}
                      onChange={(e) => setBioGoals(e.target.value)}
                      placeholder="Ex: Aumentar a impulsão vertical, aperfeiçoar o passe e saque viagem, disputar competições pelo TIME IFAL..."
                      className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-gray-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* ABA 2: FICHA TÉCNICA & RECORDES PESSOAIS */}
            {/* ============================================================ */}
            {activeTab === 'ficha' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="athletic-card rounded-2xl p-4 sm:p-7 border border-emerald-500/30 shadow-xl space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-emerald-950/60 gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wide">
                          Ficha Técnica & Recordes de Voleibol
                        </h3>
                        <p className="text-xs text-gray-400">
                          Resumo do desempenho físico registrado em testes oficiais
                        </p>
                      </div>
                    </div>

                    <Link
                      href="/avaliacao"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-wider transition-all shadow-neon"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Nova Avaliação</span>
                    </Link>
                  </div>

                  {personalRecords ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* Maior Salto Líquido */}
                        <div className="p-3.5 sm:p-4 rounded-xl bg-black/50 border border-emerald-500/40">
                          <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">
                            Melhor Salto Vertical
                          </span>
                          <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                            +{personalRecords.bestJump} cm
                          </span>
                          <span className="text-[10px] text-gray-500 block mt-0.5">Impulsão líquida</span>
                        </div>

                        {/* Alcance no Salto */}
                        <div className="p-3.5 sm:p-4 rounded-xl bg-black/50 border border-emerald-950/80">
                          <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">
                            Maior Alcance Pulando
                          </span>
                          <span className="text-xl sm:text-2xl font-black text-white font-mono">
                            {personalRecords.bestReach} cm
                          </span>
                          <span className="text-[10px] text-gray-500 block mt-0.5">Toque máximo</span>
                        </div>

                        {/* Alcance de Ataque */}
                        <div className="p-3.5 sm:p-4 rounded-xl bg-black/50 border border-emerald-950/80">
                          <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">
                            Alcance de Ataque
                          </span>
                          <span className="text-xl sm:text-2xl font-black text-white font-mono">
                            {personalRecords.bestAttack ? `${personalRecords.bestAttack} cm` : '--'}
                          </span>
                          <span className="text-[10px] text-gray-500 block mt-0.5">Golpe de rede</span>
                        </div>

                        {/* Alcance de Bloqueio */}
                        <div className="p-3.5 sm:p-4 rounded-xl bg-black/50 border border-emerald-950/80">
                          <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">
                            Alcance de Bloqueio
                          </span>
                          <span className="text-xl sm:text-2xl font-black text-white font-mono">
                            {personalRecords.bestBlock ? `${personalRecords.bestBlock} cm` : '--'}
                          </span>
                          <span className="text-[10px] text-gray-500 block mt-0.5">Paredão defensivo</span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-black/30 border border-emerald-950/60 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
                        <span>
                          Total de avaliações: <strong className="text-emerald-300 font-mono font-bold">{personalRecords.totalEvaluations}</strong>
                        </span>
                        <span>
                          Último teste: <strong className="text-white">{personalRecords.latestDate ? new Date(personalRecords.latestDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Nenhuma'}</strong>
                        </span>
                        <Link href="/avaliacoes" className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1">
                          Histórico detalhado <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl bg-black/40 border border-emerald-950/80 text-center space-y-3">
                      <FileText className="w-10 h-10 text-gray-600 mx-auto" />
                      <h4 className="text-sm font-bold text-gray-300">
                        Nenhuma avaliação física registrada ainda
                      </h4>
                      <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                        Suas métricas de impulsão, alcance de ataque e salto líquido serão calculadas automaticamente após você registrar seu primeiro teste.
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
              </div>
            )}

            {/* ============================================================ */}
            {/* ABA 3: FOTO DE PERFIL & AVATARES */}
            {/* ============================================================ */}
            {activeTab === 'foto' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="athletic-card rounded-2xl p-4 sm:p-7 space-y-5">
                  <div className="flex items-center gap-2 pb-3 border-b border-emerald-950/60">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs sm:text-sm font-bold text-gray-200 uppercase tracking-wider">
                      Foto de Perfil & Avatar do Atleta
                    </h3>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Preview da foto */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={avatarDisplay}
                        alt="Preview"
                        className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-2 border-emerald-400 shadow-neon bg-emerald-950/40"
                      />
                    </div>

                    <div className="flex-1 space-y-4 text-center sm:text-left w-full">
                      <p className="text-xs text-gray-300 leading-relaxed">
                        Personalize sua foto no TIME IFAL. Você pode enviar uma foto da galeria do seu celular ou computador, ou escolher um avatar pré-definido.
                      </p>

                      {/* File input invisível para Galeria do celular ou do PC */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />

                      {/* Botões de Ação de Foto */}
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-neon disabled:opacity-50 cursor-pointer active:scale-95"
                        >
                          <Upload className="w-4 h-4" />
                          <span>{uploadingImage ? 'Processando foto...' : 'Escolher Foto da Galeria'}</span>
                        </button>

                        {avatarUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setAvatarUrl('');
                              setSuccessMessage('Foto removida. Clique em "Salvar Alterações" para confirmar.');
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 hover:bg-red-900/40 text-xs font-semibold transition-all cursor-pointer active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remover Foto</span>
                          </button>
                        )}
                      </div>

                      {/* Presets */}
                      <div className="pt-2">
                        <span className="text-[11px] font-semibold text-gray-400 block mb-2">
                          Ou escolha uma ilustração rápida:
                        </span>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          {AVATAR_PRESETS.map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setAvatarUrl(preset);
                                setSuccessMessage('Avatar selecionado! Clique em "Salvar Alterações" para confirmar.');
                              }}
                              className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all cursor-pointer active:scale-95 ${
                                avatarUrl === preset
                                  ? 'border-emerald-400 scale-110 shadow-neon'
                                  : 'border-emerald-950 opacity-60 hover:opacity-100 hover:border-emerald-700'
                              }`}
                            >
                              <img src={preset} alt="preset" className="w-full h-full object-cover" />
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const botUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName || 'novo')}`;
                              setAvatarUrl(botUrl);
                              setSuccessMessage('Avatar robô gerado! Clique em "Salvar Alterações" para confirmar.');
                            }}
                            className="px-3 py-2 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-xs font-bold text-emerald-400 hover:bg-emerald-900/60 active:scale-95 cursor-pointer"
                          >
                            Avatar Robô
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BOTÃO PRINCIPAL DE SALVAR (VISÍVEL E LIMPO EM QUALQUER TELA) */}
            <div className="pt-3 pb-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-emerald-950/60">
              <span className="text-xs text-gray-500 order-2 sm:order-1 text-center sm:text-left">
                Suas informações são salvas de forma segura e sincronizadas na nuvem.
              </span>

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm uppercase tracking-wider shadow-neon hover:shadow-neon-strong transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer active:scale-98 order-1 sm:order-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Salvando perfil...' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </form>
        </main>
      </div>

      {/* Barra de navegação inferior mobile */}
      <BottomNav />
    </div>
  );
}
