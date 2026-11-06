'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { POSITIONS, SERVE_TYPES, LATERALITIES, Position, ServeType, Laterality } from '@/lib/types';
import { calculateAge, calculateVerticalJump, calculateBMI, getBMICategory, getJumpCategory } from '@/lib/calculations';
import { 
  Save, 
  Calendar, 
  User, 
  Ruler, 
  Weight, 
  Zap, 
  Activity, 
  Target, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Info
} from 'lucide-react';

interface EvaluationFormProps {
  initialData?: {
    full_name?: string;
    birth_date?: string;
    position?: Position;
    serve_types?: ServeType[];
    goals?: string;
    laterality?: Laterality | null;
    practice_time?: string;
  };
  onSuccess?: () => void;
}

export default function EvaluationForm({ initialData, onSuccess }: EvaluationFormProps) {
  const router = useRouter();

  const todayStr = new Date().toISOString().split('T')[0];

  // Form states
  const [evaluationDate, setEvaluationDate] = useState<string>(todayStr);
  const [fullName, setFullName] = useState<string>(initialData?.full_name || '');
  const [birthDate, setBirthDate] = useState<string>(initialData?.birth_date || '');
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [reachStanding, setReachStanding] = useState<string>('');
  const [reachJumping, setReachJumping] = useState<string>('');
  const [wingspan, setWingspan] = useState<string>('');
  const [seatedHeight, setSeatedHeight] = useState<string>('');
  const [attackReach, setAttackReach] = useState<string>('');
  const [blockReach, setBlockReach] = useState<string>('');
  const [position, setPosition] = useState<Position>(initialData?.position || 'Ponteiro');
  const [serveTypes, setServeTypes] = useState<ServeType[]>(initialData?.serve_types || ['Flutuante pulando']);
  const [laterality, setLaterality] = useState<Laterality | null>(initialData?.laterality ?? null);
  const [practiceTime, setPracticeTime] = useState<string>(initialData?.practice_time || '');
  const [goals, setGoals] = useState<string>(initialData?.goals || '');
  const [notes, setNotes] = useState<string>('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-calculated reactive metrics
  const calculatedAge = calculateAge(birthDate, evaluationDate);
  const numStanding = parseFloat(reachStanding) || 0;
  const numJumping = parseFloat(reachJumping) || 0;
  const numSeated = parseFloat(seatedHeight) || 0;
  const numAttack = parseFloat(attackReach) || 0;
  const numBlock = parseFloat(blockReach) || 0;
  const calculatedVerticalJump = calculateVerticalJump(numStanding, numJumping);
  const numWeight = parseFloat(weight) || 0;
  const numHeight = parseFloat(height) || 0;
  const calculatedBMI = calculateBMI(numWeight, numHeight);
  const bmiCategory = getBMICategory(calculatedBMI);
  const jumpCategory = getJumpCategory(calculatedVerticalJump);

  // Toggle serve types multi-select
  const toggleServe = (serve: ServeType) => {
    if (serveTypes.includes(serve)) {
      setServeTypes(serveTypes.filter((s) => s !== serve));
    } else {
      setServeTypes([...serveTypes, serve]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    if (!fullName.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.');
      return;
    }
    if (!birthDate) {
      setErrorMessage('Por favor, informe a data de nascimento.');
      return;
    }
    if (!weight || numWeight <= 0) {
      setErrorMessage('Por favor, informe um peso válido em kg.');
      return;
    }
    if (!height || numHeight <= 0) {
      setErrorMessage('Por favor, informe uma altura válida em cm.');
      return;
    }
    if (!reachStanding || numStanding <= 0) {
      setErrorMessage('Por favor, informe o alcance vertical parado em cm.');
      return;
    }
    if (!reachJumping || numJumping <= 0) {
      setErrorMessage('Por favor, informe o alcance vertical pulando em cm.');
      return;
    }
    if (numJumping < numStanding) {
      setErrorMessage('O alcance vertical pulando deve ser maior ou igual ao alcance vertical parado.');
      return;
    }
    if (!wingspan || parseFloat(wingspan) <= 0) {
      setErrorMessage('Por favor, informe a envergadura em cm.');
      return;
    }
    if (seatedHeight.trim() && numSeated <= 0) {
      setErrorMessage('Por favor, informe uma altura sentado válida em cm.');
      return;
    }
    if (attackReach.trim() && numAttack <= 0) {
      setErrorMessage('Por favor, informe um alcance de ataque válido em cm.');
      return;
    }
    if (blockReach.trim() && numBlock <= 0) {
      setErrorMessage('Por favor, informe um alcance de bloqueio válido em cm.');
      return;
    }
    if (serveTypes.length === 0) {
      setErrorMessage('Selecione ao menos um tipo de saque que você pratica.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluation_date: evaluationDate,
          full_name: fullName.trim(),
          birth_date: birthDate,
          weight: numWeight,
          height: numHeight,
          reach_standing: numStanding,
          reach_jumping: numJumping,
          wingspan: parseFloat(wingspan),
          seated_height: numSeated > 0 ? numSeated : null,
          attack_reach: numAttack > 0 ? numAttack : null,
          block_reach: numBlock > 0 ? numBlock : null,
          laterality: laterality ?? null,
          practice_time: practiceTime.trim(),
          position,
          serve_types: serveTypes,
          goals: goals.trim(),
          notes: notes.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar avaliação.');
      }

      setSuccessMessage('Avaliação física registrada com sucesso no banco de dados!');
      
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/avaliacoes');
          router.refresh();
        }
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao salvar avaliação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Alert Messages */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/50 flex items-start gap-3 text-red-300 text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
          <p>{errorMessage}</p>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex items-start gap-3 text-emerald-300 text-sm animate-in fade-in shadow-neon">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
          <div>
            <p className="font-bold">{successMessage}</p>
            <p className="text-xs text-emerald-400/80 mt-0.5">Redirecionando para seu histórico de evolução...</p>
          </div>
        </div>
      )}

      {/* SECTION 1: DATA DA AVALIAÇÃO & DADOS PESSOAIS */}
      <div className="athletic-card rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-emerald-950/60">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-wide uppercase">
              1. Dados Pessoais do Atleta
            </h3>
            <p className="text-xs text-gray-400">
              Identificação e cálculo automático de idade conforme a data de nascimento.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Data da Avaliação */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Data do Registro *
            </label>
            <div className="relative">
              <input
                type="date"
                value={evaluationDate}
                onChange={(e) => setEvaluationDate(e.target.value)}
                required
                className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Data em que o teste físico foi realizado.</p>
          </div>

          {/* Nome Completo */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Nome Completo do Atleta *
            </label>
            <input
              type="text"
              placeholder="Ex: Matheus Santos"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>

          {/* Data de Nascimento */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Data de Nascimento *
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
              className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>

          {/* Idade Calculada Automaticamente */}
          <div className="sm:col-span-2 flex items-center">
            <div className="w-full p-4 rounded-xl bg-black/40 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-400 block uppercase">
                  Idade Calculada Automaticamente
                </span>
                <span className="text-xs text-emerald-400/80">
                  {birthDate ? `Baseada em ${new Date(birthDate + 'T00:00:00').toLocaleDateString('pt-BR')}` : 'Informe a data de nascimento'}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-emerald-400">
                  {birthDate ? calculatedAge : '--'}
                </span>
                <span className="text-xs font-bold text-gray-400">anos</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: MEDIDAS FÍSICAS */}
      <div className="athletic-card rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-emerald-950/60">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Ruler className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-wide uppercase">
              2. Medidas Físicas e Antropométricas
            </h3>
            <p className="text-xs text-gray-400">
              Medidas corporais e alcances verticais utilizados para cálculo do Salto e IMC.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Peso */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Peso Corporal (kg) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="30"
                max="200"
                placeholder="Ex: 85.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
                className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors font-mono"
              />
              <span className="absolute right-4 top-3 text-xs font-bold text-gray-500">kg</span>
            </div>
          </div>

          {/* Altura */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Altura (cm) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="100"
                max="240"
                placeholder="Ex: 195"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                required
                className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors font-mono"
              />
              <span className="absolute right-4 top-3 text-xs font-bold text-gray-500">cm</span>
            </div>
          </div>

          {/* Envergadura */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Envergadura (cm) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="100"
                max="260"
                placeholder="Ex: 200"
                value={wingspan}
                onChange={(e) => setWingspan(e.target.value)}
                required
                className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors font-mono"
              />
              <span className="absolute right-4 top-3 text-xs font-bold text-gray-500">cm</span>
            </div>
          </div>

          {/* Alcance Vertical Parado */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Alcance Vertical Parado (cm) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="150"
                max="320"
                placeholder="Ex: 248"
                value={reachStanding}
                onChange={(e) => setReachStanding(e.target.value)}
                required
                className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors font-mono"
              />
              <span className="absolute right-4 top-3 text-xs font-bold text-gray-500">cm</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Braço estendido sem saltar.</p>
          </div>

          {/* Alcance Vertical Pulando */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Alcance Vertical Pulando (cm) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="180"
                max="390"
                placeholder="Ex: 342"
                value={reachJumping}
                onChange={(e) => setReachJumping(e.target.value)}
                required
                className="w-full bg-[#09120c] border border-emerald-500/50 focus:border-emerald-400 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 transition-colors font-mono font-bold shadow-neon"
              />
              <span className="absolute right-4 top-3 text-xs font-bold text-emerald-400">cm</span>
            </div>
            <p className="text-[11px] text-emerald-400/70 mt-1">Ponto mais alto tocado com corrida de ataque ou salto do bloqueio.</p>
          </div>

          {/* Altura Sentado (Opcional) */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Altura Sentado (cm)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="60"
                max="130"
                placeholder="Ex: 100"
                value={seatedHeight}
                onChange={(e) => setSeatedHeight(e.target.value)}
                className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors font-mono"
              />
              <span className="absolute right-4 top-3 text-xs font-bold text-gray-500">cm</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Da superfície do banco ao topo da cabeça, sentado ereto (opcional).</p>
          </div>

          {/* Alcance de Ataque (Novo campo voleibol) */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${
              attackReach ? 'text-emerald-400' : 'text-gray-300'
            }`}>
              <Zap className="w-3.5 h-3.5" /> Alcance de Ataque (cm)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="100"
                max="420"
                placeholder="Ex: 350"
                value={attackReach}
                onChange={(e) => setAttackReach(e.target.value)}
                className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-colors font-mono ${
                  attackReach
                    ? 'bg-[#09120c] border border-emerald-500/50 focus:border-emerald-400 text-white font-bold shadow-neon focus:ring-emerald-400'
                    : 'bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 text-white focus:ring-emerald-500'
                }`}
              />
              <span className={`absolute right-4 top-3 text-xs font-bold ${attackReach ? 'text-emerald-400' : 'text-gray-500'}`}>cm</span>
            </div>
            <p className={`text-[11px] mt-1 ${attackReach ? 'text-emerald-400/70' : 'text-gray-500'}`}>
              Toque máximo na bola com corrida de ataque (opcional).
            </p>
          </div>

          {/* Alcance de Bloqueio (Novo campo voleibol) */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${
              blockReach ? 'text-emerald-400' : 'text-gray-300'
            }`}>
              <Zap className="w-3.5 h-3.5" /> Alcance de Bloqueio (cm)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="100"
                max="420"
                placeholder="Ex: 346"
                value={blockReach}
                onChange={(e) => setBlockReach(e.target.value)}
                className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-colors font-mono ${
                  blockReach
                    ? 'bg-[#09120c] border border-emerald-500/50 focus:border-emerald-400 text-white font-bold shadow-neon focus:ring-emerald-400'
                    : 'bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 text-white focus:ring-emerald-500'
                }`}
              />
              <span className={`absolute right-4 top-3 text-xs font-bold ${blockReach ? 'text-emerald-400' : 'text-gray-500'}`}>cm</span>
            </div>
            <p className={`text-[11px] mt-1 ${blockReach ? 'text-emerald-400/70' : 'text-gray-500'}`}>
              Toque máximo acima da rede com os dois braços erguidos (opcional).
            </p>
          </div>
        </div>

        {/* CÁLCULOS AUTOMÁTICOS EM TEMPO REAL */}
        <div className="mt-8 pt-6 border-t border-emerald-950/60">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Resultados dos Cálculos Automáticos
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box Salto Vertical */}
            <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-400 uppercase font-semibold block">
                  Salto Vertical (Impulsão)
                </span>
                <span className="text-[11px] text-gray-500">
                  Alcance Pulando ({numJumping}cm) − Alcance Parado ({numStanding}cm)
                </span>
                {calculatedVerticalJump > 0 && (
                  <div className="mt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${jumpCategory.color}`}>
                      Classificação: {jumpCategory.label}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <span className="text-3xl font-black font-mono text-emerald-400">
                  {calculatedVerticalJump > 0 ? `+${calculatedVerticalJump}` : '0'}
                </span>
                <span className="text-xs font-bold text-gray-400 block">cm</span>
              </div>
            </div>

            {/* Box IMC */}
            <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-400 uppercase font-semibold block">
                  Índice de Massa Corporal (IMC)
                </span>
                <span className="text-[11px] text-gray-500">
                  Peso ({numWeight}kg) ÷ [Altura ({numHeight / 100}m)]²
                </span>
                {calculatedBMI > 0 && (
                  <div className="mt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${bmiCategory.color}`}>
                      {bmiCategory.label}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <span className="text-3xl font-black font-mono text-white">
                  {calculatedBMI > 0 ? calculatedBMI : '0'}
                </span>
                <span className="text-xs font-bold text-gray-400 block">kg/m²</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: POSIÇÃO & TIPO DE SAQUE */}
      <div className="athletic-card rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-emerald-950/60">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-wide uppercase">
              3. Informações Técnicas e Posição
            </h3>
            <p className="text-xs text-gray-400">
              Posição tática em quadra e modalidades de saque dominadas pelo jogador.
            </p>
          </div>
        </div>

        {/* Posição + Lateralidade + Tempo de Prática */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-5 items-end">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
              Posição Principal em Quadra *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {POSITIONS.map((pos) => {
                const isSelected = position === pos;
                return (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setPosition(pos)}
                    className={`py-3 px-3 rounded-xl text-xs font-bold transition-all border text-center ${
                      isSelected
                        ? 'bg-emerald-500 text-black border-emerald-400 shadow-neon scale-[1.02]'
                        : 'bg-[#080c09] text-gray-300 border-emerald-950/80 hover:border-emerald-500/40 hover:text-white'
                    }`}
                  >
                    {pos}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
              Lateralidade de Jogo
            </label>
            <div className="grid grid-cols-3 gap-3">
              {LATERALITIES.map((lat) => {
                const isSelected = laterality === lat;
                return (
                  <button
                    key={lat}
                    type="button"
                    onClick={() => setLaterality(lat)}
                    className={`py-3 px-3 rounded-xl text-xs font-bold transition-all border text-center ${
                      isSelected
                        ? 'bg-emerald-500 text-black border-emerald-400 shadow-neon scale-[1.02]'
                        : 'bg-[#080c09] text-gray-300 border-emerald-950/80 hover:border-emerald-500/40 hover:text-white'
                    }`}
                  >
                    {lat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tempo de Prática */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
            Tempo de Prática do Voleibol
          </label>
          <input
            type="text"
            placeholder="Ex: 3 anos"
            value={practiceTime}
            onChange={(e) => setPracticeTime(e.target.value)}
            className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
          <p className="text-[11px] text-gray-500 mt-1">Há quanto tempo você joga vôlei (ex: "3 anos", "desde 2021").</p>
        </div>

        {/* Tipo de Saque (Multi-select) */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
            Tipo de Saque (Pode marcar mais de uma opção) *
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Selecione todas as modalidades de saque que você executa nos treinos e jogos:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {SERVE_TYPES.map((serve) => {
              const isChecked = serveTypes.includes(serve);
              return (
                <button
                  key={serve}
                  type="button"
                  onClick={() => toggleServe(serve)}
                  className={`flex items-center justify-between p-3 rounded-xl text-xs font-semibold border transition-all text-left ${
                    isChecked
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500 shadow-sm'
                      : 'bg-[#080c09] text-gray-400 border-emerald-950/80 hover:border-emerald-900 hover:text-gray-200'
                  }`}
                >
                  <span>{serve}</span>
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                      isChecked ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-gray-600 bg-transparent'
                    }`}
                  >
                    {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 4: OBJETIVOS E DIFICULDADES */}
      <div className="athletic-card rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-emerald-950/60">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-wide uppercase">
              4. Metas, Objetivos e Dificuldades
            </h3>
            <p className="text-xs text-gray-400">
              Campo aberto para expressar aspirações técnicas, físicos e pontos de atenção.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
            Objetivos no Voleibol *
          </label>
          <textarea
            rows={4}
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            placeholder="Escreva livremente seus objetivos, dificuldades atuais, pontos técnicos a aprimorar (ex: impulsão, precisão de saque, ataque contra bloqueio) e metas para as próximas competições..."
            className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl p-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors leading-relaxed"
          />
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Observações Gerais do Avaliador ou Atleta (Opcional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Avaliação realizada no início da pré-temporada após treino de força."
            className="w-full bg-[#080c09] border border-emerald-950/80 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* SUBMIT BUTTON */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-400" />
          <span>Ao salvar, os dados ficarão associados permanentemente à sua conta sem sobrescrever avaliações anteriores.</span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm sm:text-base tracking-wider uppercase shadow-neon-strong hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          <span>{loading ? 'SALVANDO AVALIAÇÃO...' : 'SALVAR AVALIAÇÃO'}</span>
        </button>
      </div>
    </form>
  );
}
