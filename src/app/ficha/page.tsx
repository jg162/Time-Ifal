'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { User, Profile, Evaluation, Goal } from '@/lib/types';
import { getBMICategory, getJumpCategory } from '@/lib/calculations';
import {
  FileText,
  Printer,
  Share2,
  Trophy,
  Award,
  Zap,
  TrendingUp,
  Ruler,
  Weight,
  Target,
  Sparkles,
  Calendar,
  Lock,
  ArrowRight,
  Shield,
  CheckCircle2,
  Copy,
  ChevronRight,
  Flame,
  ArrowUpRight
} from 'lucide-react';

export default function FichaTecnicaPage() {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [latestEval, setLatestEval] = useState<Evaluation | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const authRes = await fetch('/api/auth/me');
        if (!authRes.ok) {
          router.push('/login');
          return;
        }

        const authData = await authRes.json();
        setUser(authData.user);
        setProfile(authData.profile);
        setLatestEval(authData.latestEvaluation);

        const [evalRes, goalsRes] = await Promise.all([
          fetch('/api/evaluations'),
          fetch('/api/metas')
        ]);

        if (evalRes.ok) {
          const evalData = await evalRes.json();
          setEvaluations(evalData.evaluations || []);
        }

        if (goalsRes.ok) {
          const goalsData = await goalsRes.json();
          setGoals(goalsData.goals || []);
        }
      } catch (err) {
        console.error('Error loading athlete technical sheet:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  // Cálculos de Recordes Pessoais Históricos
  const personalRecords = React.useMemo(() => {
    if (evaluations.length === 0) return null;

    let bestJump = { val: 0, date: '' };
    let bestAttack = { val: 0, date: '' };
    let bestBlock = { val: 0, date: '' };
    let bestWingspan = { val: 0, date: '' };
    let bestReach = { val: 0, date: '' };

    for (const ev of evaluations) {
      if (ev.vertical_jump && ev.vertical_jump > bestJump.val) {
        bestJump = { val: ev.vertical_jump, date: ev.evaluation_date };
      }
      if (ev.attack_reach && ev.attack_reach > bestAttack.val) {
        bestAttack = { val: ev.attack_reach, date: ev.evaluation_date };
      }
      if (ev.block_reach && ev.block_reach > bestBlock.val) {
        bestBlock = { val: ev.block_reach, date: ev.evaluation_date };
      }
      if (ev.wingspan && ev.wingspan > bestWingspan.val) {
        bestWingspan = { val: ev.wingspan, date: ev.evaluation_date };
      }
      if (ev.reach_jumping && ev.reach_jumping > bestReach.val) {
        bestReach = { val: ev.reach_jumping, date: ev.evaluation_date };
      }
    }

    return { bestJump, bestAttack, bestBlock, bestWingspan, bestReach };
  }, [evaluations]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/ficha`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070908] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-emerald-400 uppercase tracking-widest">
            Gerando Ficha Técnica do Atleta...
          </p>
        </div>
      </div>
    );
  }

  const bmiCat = latestEval ? getBMICategory(latestEval.bmi) : null;
  const jumpCat = latestEval ? getJumpCategory(latestEval.vertical_jump) : null;

  return (
    <div className="min-h-screen bg-[#070908] text-white flex">
      <div className="print:hidden">
        <Sidebar
          currentUser={user}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <div className="print:hidden">
          <Navbar
            onToggleSidebar={() => setSidebarOpen(true)}
            currentUser={user}
            title="Ficha Técnica"
            subtitle="Documento individual consolidado com dados físicos, recordes e metas"
          />
        </div>

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full">
          
          {/* Action Bar (oculto na impressão) */}
          <div className="print:hidden flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#0a0f0c] border border-emerald-950/80">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-bold text-white uppercase tracking-wider">Ficha Técnica Oficial</span>
              <span className="text-xs text-gray-400">({evaluations.length} avaliações registradas)</span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleShare}
                className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-white border border-emerald-950 hover:border-emerald-500/30 transition-all flex items-center gap-1.5"
              >
                {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copiado!' : 'Compartilhar'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider shadow-neon transition-all flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Exportar em PDF</span>
              </button>
            </div>
          </div>

          {/* =============================================================== */}
          {/* FICHA TÉCNICA A4 PRINTABLE CANVAS                              */}
          {/* =============================================================== */}
          <div 
            ref={printRef}
            className="rounded-3xl bg-[#080d0a] border border-emerald-500/30 p-6 sm:p-10 space-y-8 shadow-2xl print:border-none print:p-0 print:bg-white print:text-black"
          >
            {/* Header da Ficha */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-emerald-950/80 print:border-gray-300">
              <div className="flex items-center gap-5">
                <img
                  src={user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user?.name || 'atleta')}`}
                  alt={user?.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-emerald-400 shadow-neon print:shadow-none print:border-gray-400"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h1 className="text-2xl sm:text-3xl font-black text-white print:text-black tracking-tight uppercase">
                      {user?.name}
                    </h1>
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 print:bg-gray-100 print:text-black print:border-gray-300">
                      {latestEval?.position || profile?.preferred_position || 'Ponteiro'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-300 print:text-gray-700 font-medium">
                    TIME IFAL · VOLLEY PERFORMANCE · VOLEIBOL DE ALTO RENDIMENTO
                  </p>
                  <p className="text-xs text-gray-400 print:text-gray-500 mt-1">
                    Última avaliação oficial: {latestEval?.evaluation_date ? new Date(latestEval.evaluation_date + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem avaliações'}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right text-xs space-y-1 text-gray-400 print:text-gray-600">
                <p className="font-mono text-[11px]">DOCUMENTO TÉCNICO ESPORTIVO</p>
                <p>Data de Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
                <p className="text-emerald-400 print:text-gray-800 font-bold">Status: Atleta Ativo</p>
              </div>
            </div>

            {/* SEÇÃO 1: DADOS PESSOAIS & ESPORTIVOS */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-emerald-400 print:text-gray-800 uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-4 h-4" /> 1. Dados Pessoais e Esportivos
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-[#0a0f0c] print:bg-gray-50 border border-emerald-950 print:border-gray-200">
                  <span className="text-[10px] uppercase text-gray-400 print:text-gray-500 font-semibold block">Idade</span>
                  <span className="text-base font-bold text-white print:text-black font-mono">
                    {latestEval?.age ? `${latestEval.age} anos` : 'Não calculada'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0a0f0c] print:bg-gray-50 border border-emerald-950 print:border-gray-200">
                  <span className="text-[10px] uppercase text-gray-400 print:text-gray-500 font-semibold block">Posição Principal</span>
                  <span className="text-base font-bold text-white print:text-black">
                    {latestEval?.position || profile?.preferred_position || 'Ponteiro'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0a0f0c] print:bg-gray-50 border border-emerald-950 print:border-gray-200">
                  <span className="text-[10px] uppercase text-gray-400 print:text-gray-500 font-semibold block">Lateralidade</span>
                  <span className="text-base font-bold text-white print:text-black">
                    {latestEval?.laterality || profile?.laterality || 'Destro'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0a0f0c] print:bg-gray-50 border border-emerald-950 print:border-gray-200">
                  <span className="text-[10px] uppercase text-gray-400 print:text-gray-500 font-semibold block">Tempo de Prática</span>
                  <span className="text-base font-bold text-white print:text-black">
                    {profile?.practice_time || '2 a 4 anos'}
                  </span>
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: MEDIDAS ANTROPOMÉTRICAS E ALCANCES */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-emerald-400 print:text-gray-800 uppercase tracking-widest flex items-center gap-2">
                <Ruler className="w-4 h-4" /> 2. Medidas Físicas e Alturas Oficiais
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-[#0a0f0c] print:bg-gray-50 border border-emerald-950 print:border-gray-200">
                  <span className="text-[10px] uppercase text-gray-400 print:text-gray-500 font-semibold block">Altura</span>
                  <span className="text-xl font-black text-white print:text-black font-mono">
                    {latestEval?.height ? `${latestEval.height} cm` : '--'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0a0f0c] print:bg-gray-50 border border-emerald-950 print:border-gray-200">
                  <span className="text-[10px] uppercase text-gray-400 print:text-gray-500 font-semibold block">Peso & IMC</span>
                  <span className="text-xl font-black text-white print:text-black font-mono">
                    {latestEval?.weight ? `${latestEval.weight} kg` : '--'}
                  </span>
                  {bmiCat && <span className="text-[10px] text-gray-400 print:text-gray-600 block mt-0.5">{bmiCat.label} ({latestEval?.bmi})</span>}
                </div>
                <div className="p-3.5 rounded-xl bg-[#0a0f0c] print:bg-gray-50 border border-emerald-950 print:border-gray-200">
                  <span className="text-[10px] uppercase text-gray-400 print:text-gray-500 font-semibold block">Envergadura</span>
                  <span className="text-xl font-black text-white print:text-black font-mono">
                    {latestEval?.wingspan ? `${latestEval.wingspan} cm` : '--'}
                  </span>
                  {latestEval?.height && latestEval?.wingspan && (
                    <span className="text-[10px] text-emerald-400 print:text-gray-700 block mt-0.5">
                      Envergadura {latestEval.wingspan >= latestEval.height ? `+${(latestEval.wingspan - latestEval.height).toFixed(0)}cm` : `${(latestEval.wingspan - latestEval.height).toFixed(0)}cm`}
                    </span>
                  )}
                </div>
                <div className="p-3.5 rounded-xl bg-[#0a0f0c] print:bg-gray-50 border border-emerald-950 print:border-gray-200">
                  <span className="text-[10px] uppercase text-gray-400 print:text-gray-500 font-semibold block">Alcance Parado</span>
                  <span className="text-xl font-black text-white print:text-black font-mono">
                    {latestEval?.reach_standing ? `${latestEval.reach_standing} cm` : '--'}
                  </span>
                  <span className="text-[10px] text-gray-400 print:text-gray-500 block mt-0.5">Braço estendido</span>
                </div>
              </div>

              {/* Impulsão e Alcances de Rede (Destaques) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/60 to-emerald-900/20 print:bg-gray-100 border border-emerald-500/40 print:border-gray-300">
                  <span className="text-[10px] uppercase text-emerald-300 print:text-gray-700 font-bold block">Salto Vertical Líquido</span>
                  <span className="text-2xl font-black text-emerald-300 print:text-black font-mono">
                    {latestEval?.vertical_jump ? `+${latestEval.vertical_jump} cm` : '--'}
                  </span>
                  <span className="text-[10px] text-emerald-400/90 print:text-gray-600 block mt-1">
                    {jumpCat?.label || 'Impulsão líquida'}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-[#0a0f0c] print:bg-gray-100 border border-emerald-950 print:border-gray-300">
                  <span className="text-[10px] uppercase text-gray-400 print:text-gray-600 font-bold block">Alcance de Ataque</span>
                  <span className="text-2xl font-black text-white print:text-black font-mono">
                    {latestEval?.attack_reach ? `${latestEval.attack_reach} cm` : latestEval?.reach_jumping ? `${latestEval.reach_jumping} cm` : '--'}
                  </span>
                  <span className="text-[10px] text-gray-400 print:text-gray-600 block mt-1">Altura de golpe em salto</span>
                </div>
                <div className="p-4 rounded-xl bg-[#0a0f0c] print:bg-gray-100 border border-emerald-950 print:border-gray-300">
                  <span className="text-[10px] uppercase text-gray-400 print:text-gray-600 font-bold block">Alcance de Bloqueio</span>
                  <span className="text-2xl font-black text-white print:text-black font-mono">
                    {latestEval?.block_reach ? `${latestEval.block_reach} cm` : '--'}
                  </span>
                  <span className="text-[10px] text-gray-400 print:text-gray-600 block mt-1">Invasão sobre a rede</span>
                </div>
              </div>
            </div>

            {/* SEÇÃO 3: MEUS RECORDES PESSOAIS HISTÓRICOS */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-emerald-400 print:text-gray-800 uppercase tracking-widest flex items-center gap-2">
                <Flame className="w-4 h-4 text-emerald-400 print:text-black" /> 3. Meus Recordes Pessoais Históricos (All-Time)
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-[#0a0f0c] print:bg-gray-50 border border-emerald-950 print:border-gray-200">
                  <span className="text-[10px] uppercase text-gray-400 print:text-gray-500 font-semibold block">Maior Salto</span>
                  <span className="text-lg font-black text-emerald-400 print:text-black font-mono">
                    {personalRecords?.bestJump.val ? `+${personalRecords.bestJump.val} cm` : '--'}
                  </span>
                  {personalRecords?.bestJump.date && (
                    <span className="text-[9px] text-gray-500 print:text-gray-600 block mt-0.5">
                      {new Date(personalRecords.bestJump.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
                <div className="p-3.5 rounded-xl bg-[#0a0f0c] print:bg-gray-50 border border-emerald-950 print:border-gray-200">
                  <span className="text-[10px] uppercase text-gray-400 print:text-gray-500 font-semibold block">Maior Alcance Ataque</span>
                  <span className="text-lg font-black text-white print:text-black font-mono">
                    {personalRecords?.bestAttack.val ? `${personalRecords.bestAttack.val} cm` : personalRecords?.bestReach.val ? `${personalRecords.bestReach.val} cm` : '--'}
                  </span>
                  {personalRecords?.bestAttack.date && (
                    <span className="text-[9px] text-gray-500 print:text-gray-600 block mt-0.5">
                      {new Date(personalRecords.bestAttack.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
                <div className="p-3.5 rounded-xl bg-[#0a0f0c] print:bg-gray-50 border border-emerald-950 print:border-gray-200">
                  <span className="text-[10px] uppercase text-gray-400 print:text-gray-500 font-semibold block">Maior Bloqueio</span>
                  <span className="text-lg font-black text-white print:text-black font-mono">
                    {personalRecords?.bestBlock.val ? `${personalRecords.bestBlock.val} cm` : '--'}
                  </span>
                  {personalRecords?.bestBlock.date && (
                    <span className="text-[9px] text-gray-500 print:text-gray-600 block mt-0.5">
                      {new Date(personalRecords.bestBlock.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
                <div className="p-3.5 rounded-xl bg-[#0a0f0c] print:bg-gray-50 border border-emerald-950 print:border-gray-200">
                  <span className="text-[10px] uppercase text-gray-400 print:text-gray-500 font-semibold block">Maior Envergadura</span>
                  <span className="text-lg font-black text-white print:text-black font-mono">
                    {personalRecords?.bestWingspan.val ? `${personalRecords.bestWingspan.val} cm` : '--'}
                  </span>
                  {personalRecords?.bestWingspan.date && (
                    <span className="text-[9px] text-gray-500 print:text-gray-600 block mt-0.5">
                      {new Date(personalRecords.bestWingspan.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* SEÇÃO 4: HABILIDADES TÉCNICAS E OBJETIVOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#0a0f0c] print:bg-gray-50 border border-emerald-950 print:border-gray-200">
                <span className="text-[10px] uppercase text-gray-400 print:text-gray-600 font-bold block mb-2">Saques Praticados</span>
                <div className="flex flex-wrap gap-1.5">
                  {(latestEval?.serve_types || profile?.serve_types || ['Flutuante pulando']).map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-950 print:bg-white text-emerald-300 print:text-black border border-emerald-500/30 print:border-gray-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0a0f0c] print:bg-gray-50 border border-emerald-950 print:border-gray-200">
                <span className="text-[10px] uppercase text-gray-400 print:text-gray-600 font-bold block mb-2">Metas em Andamento ({goals.length})</span>
                {goals.length === 0 ? (
                  <p className="text-xs text-gray-500 print:text-gray-600 italic">Nenhuma meta ativa cadastrada no momento.</p>
                ) : (
                  <div className="space-y-1.5">
                    {goals.slice(0, 3).map((g) => (
                      <div key={g.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-300 print:text-gray-800 truncate">{g.title}</span>
                        <span className="text-emerald-400 print:text-black font-mono font-bold">{g.progress_pct}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Assinatura / Rodapé da Ficha */}
            <div className="pt-8 border-t border-emerald-950/80 print:border-gray-300 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 print:text-gray-600">
              <p>VOLLEY PERFORMANCE · IFAL Campus Maceió · Certificação Eletrônica de Avaliação Física</p>
              <div className="print:block hidden text-right">
                <p>Assinatura do Atleta: ___________________________</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
