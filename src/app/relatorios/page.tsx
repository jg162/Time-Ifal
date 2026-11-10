'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  FileCheck2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Target,
  Calendar,
  Loader2,
} from 'lucide-react';
import jsPDF from 'jspdf';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { Evaluation, Goal, User, Profile } from '@/lib/types';

interface RelatoriosData {
  user: User | null;
  profile: Profile | null;
  evaluations: Evaluation[];
  goals: Goal[];
}

const GREEN: [number, number, number] = [0, 230, 118];
const DARK: [number, number, number] = [10, 14, 12];
const GRAY_TEXT: [number, number, number] = [110, 120, 115];

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  return isNaN(d.getTime()) ? String(iso) : d.toLocaleDateString('pt-BR');
}

export default function RelatoriosPage() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RelatoriosData>({ user: null, profile: null, evaluations: [], goals: [] });
  const [generating, setGenerating] = useState<'full' | 'resumo' | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const authRes = await fetch('/api/auth/me');
        if (!authRes.ok) {
          router.push('/login');
          return;
        }
        const authData = await authRes.json();

        const [evalRes, goalsRes] = await Promise.all([
          fetch('/api/evaluations'),
          fetch('/api/metas'),
        ]);
        const evaluations = evalRes.ok ? (await evalRes.json()).evaluations ?? [] : [];
        const goals = goalsRes.ok ? (await goalsRes.json()).goals ?? [] : [];

        setData({ user: authData.user, profile: authData.profile, evaluations, goals });
      } catch (err) {
        console.error('Erro ao carregar dados do relatório:', err);
        setMessage({ type: 'error', text: 'Erro ao carregar seus dados. Tente novamente.' });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const summary = useMemo(() => {
    const evals = data.evaluations;
    const latest = evals.length > 0 ? evals[evals.length - 1] : null;
    return {
      latest,
      evalCount: evals.length,
      activeGoals: data.goals.filter(g => g.status === 'ativo').length,
      completedGoals: data.goals.filter(g => g.status === 'concluido').length,
    };
  }, [data]);

  // ---------------- PDF ----------------

  function header(doc: jsPDF, subtitle: string) {
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    // Header bar preto com detalhe verde (identidade da plataforma)
    doc.setFillColor(...DARK);
    doc.rect(0, 0, W, 26, 'F');
    doc.setFillColor(...GREEN);
    doc.rect(0, 26, W, 1.2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('TIME IFAL', 14, 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(160, 235, 195);
    doc.text('RELATORIO DE AVALIACAO FISICA DO ATLETA — PLATAFORMA DE ACOMPANHAMENTO ESPORTIVO', 14, 18.5);

    // subtitle (título da seção "capa" interna)
    if (subtitle) {
      doc.setTextColor(GREEN[0], GREEN[1], GREEN[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(subtitle, 14, 34);
    }
    return { W, H };
  }

  function sectionTitle(doc: jsPDF, y: number, title: string): number {
    const W = doc.internal.pageSize.getWidth();
    doc.setFillColor(238, 240, 238);
    doc.rect(14, y, W - 28, 7.5, 'F');
    doc.setFillColor(...GREEN);
    doc.rect(14, y, 1.2, 7.5, 'F');
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(title.toUpperCase(), 18, y + 5.2);
    return y + 7.5;
  }

  function infoLine(doc: jsPDF, x: number, y: number, label: string, value: string): number {
    doc.setTextColor(...GRAY_TEXT);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(label.toUpperCase(), x, y, { maxWidth: 40 });
    doc.setTextColor(25, 30, 27);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(value || '-', x, y + 4.6, { maxWidth: 55 });
    return y + 10;
  }

  function footer(doc: jsPDF) {
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setDrawColor(225, 228, 225);
      doc.line(14, H - 10, W - 14, H - 10);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...GRAY_TEXT);
      doc.text(
        `Gerado automaticamente pela plataforma TIME IFAL em ${new Date().toLocaleDateString('pt-BR')}`,
        14,
        H - 5.5
      );
      doc.text(`Pagina ${i} de ${pages}`, W - 30, H - 5.5);
    }
  }

  function evolutionChart(doc: jsPDF, startY: number, evals: Evaluation[]): number {
    const W = doc.internal.pageSize.getWidth();
    const left = 20;
    const right = W - 20;
    const top = startY + 8;
    const chartH = 55;
    const bottom = top + chartH;

    if (evals.length === 0) return startY + 10;

    // Escolhe a métrica com mais pontos registrados
    const metricChoices: { label: string; get: (e: Evaluation) => number | null }[] = [
      { label: 'Salto Vertical (cm)', get: (e) => e.vertical_jump },
      { label: 'Alcance de Ataque (cm)', get: (e) => e.attack_reach },
      { label: 'Alcance Vertical Pulando (cm)', get: (e) => e.reach_jumping },
      { label: 'Altura (cm)', get: (e) => e.height },
    ];
    let chosen = metricChoices[0];
    let chosenLen = evals.filter(e => chosen.get(e) !== null).length;
    for (const m of metricChoices) {
      const len = evals.filter(e => m.get(e) !== null).length;
      if (len > chosenLen) {
        chosen = m;
        chosenLen = len;
      }
    }

    const points = evals
      .map(e => ({ date: e.evaluation_date, value: chosen.get(e) }))
      .filter((p): p is { date: string; value: number } => p.value !== null);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    doc.text(`Grafico de Evolucao — ${chosen.label}`, 14, startY + 5);

    doc.setDrawColor(225, 228, 225);
    doc.setLineWidth(0.3);
    for (let i = 0; i <= 4; i++) {
      const gy = top + (chartH / 4) * i;
      doc.line(left, gy, right, gy);
    }
    doc.line(left, top, left, bottom);

    if (points.length === 1) {
      doc.setFillColor(...GREEN);
      doc.circle((left + right) / 2, (top + bottom) / 2, 1.4, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...GRAY_TEXT);
      doc.text(`Valor: ${points[0].value.toFixed(1)} (1 registro)`, left, bottom + 8);
      return bottom + 14;
    }

    const values = points.map(p => p.value);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const pad = Math.max(2, (maxV - minV) * 0.1);
    const vMin = minV - pad;
    const vMax = maxV + pad;

    const stepX = (right - left) / (points.length - 1);
    const toY = (v: number) => bottom - ((v - vMin) / Math.max(vMax - vMin, 0.001)) * chartH;
    const toX = (i: number) => left + stepX * i;

    // Linha verde
    doc.setDrawColor(...GREEN);
    doc.setLineWidth(0.9);
    for (let i = 0; i < points.length - 1; i++) {
      doc.line(toX(i), toY(points[i].value), toX(i + 1), toY(points[i + 1].value));
    }
    // pontos
    doc.setFillColor(...GREEN);
    for (let i = 0; i < points.length; i++) {
      doc.circle(toX(i), toY(points[i].value), 1.2, 'F');
    }

    // eixo X: máximo ~8 rótulos de datas
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY_TEXT);
    const labelEvery = Math.ceil(points.length / 8);
    for (let i = 0; i < points.length; i += labelEvery) {
      doc.text(fmtDate(points[i].date).slice(0, 5), toX(i) - 4, bottom + 5);
    }
    // máximo/mínimo do eixo Y
    doc.text(maxV.toFixed(0), left - 8, top + 2);
    doc.text(vMin.toFixed(0), left - 8, bottom);

    return bottom + 14;
  }

  async function generateReport(kind: 'full' | 'resumo') {
    const { user, profile, evaluations, goals } = data;
    if (!user) return;
    if (evaluations.length === 0) {
      setMessage({ type: 'error', text: 'Cadastre pelo menos uma avaliação antes de gerar o relatório.' });
      return;
    }

    setGenerating(kind);
    setMessage(null);

    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const latest = evaluations[evaluations.length - 1];
      const first = evaluations[0];
      const evalsForChart = kind === 'resumo' ? [latest] : [...evaluations].sort((a, b) => a.evaluation_date.localeCompare(b.evaluation_date));

      header(doc, kind === 'full' ? 'Relatorio Completo do Atleta' : 'Resumo da Ultima Avaliacao');
      let y = 34; // base após o cabeçalho

      // Identificação
      y += 6;
      y = sectionTitle(doc, y, '1. Informações Pessoais');
      y += 3;
      const twoColX = [14, W / 2 + 6];
      // Coluna 1
      infoLine(doc, twoColX[0], y, 'Nome completo', profile?.full_name || user.name);
      infoLine(doc, twoColX[0], y + 10, 'Data de nascimento', fmtDate(profile?.birth_date || latest.birth_date));
      infoLine(doc, twoColX[0], y + 20, 'Idade (na ultima avaliacao)', `${latest.age} anos`);
      // Coluna 2
      infoLine(doc, twoColX[1], y, 'Posição', latest.position);
      infoLine(doc, twoColX[1], y + 10, 'Lateralidade', latest.laterality || profile?.laterality || 'Não informado');
      infoLine(doc, twoColX[1], y + 20, 'Tempo de prática', latest.practice_time || profile?.practice_time || 'Não informado');
      y += 30;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...GRAY_TEXT);
      doc.text(`Tipos de saque: ${(latest.serve_types || []).join(', ') || 'Não informado'}`, 14, y);
      y += 6;
      doc.text(`Data da emissão: ${new Date().toLocaleDateString('pt-BR')}`, 14, y);
      y += 8;

      // Última avaliação
      y = sectionTitle(doc, y, '2. Resultados da Última Avaliação');
      y += 3;
      infoLine(doc, twoColX[0], y, 'Peso', `${latest.weight.toFixed(1)} kg`);
      infoLine(doc, twoColX[1], y, 'Altura', `${latest.height.toFixed(1)} cm`);
      infoLine(doc, twoColX[0], y + 10, 'IMC*', `${latest.bmi.toFixed(1)}`);
      infoLine(doc, twoColX[1], y + 10, 'Envergadura', `${latest.wingspan.toFixed(1)} cm`);
      infoLine(doc, twoColX[0], y + 20, 'Altura sentado', latest.seated_height ? `${latest.seated_height.toFixed(1)} cm` : '—');
      infoLine(doc, twoColX[1], y + 20, 'Data da avaliação', fmtDate(latest.evaluation_date));
      infoLine(doc, twoColX[0], y + 30, 'Alcance vertical parado', `${latest.reach_standing.toFixed(1)} cm`);
      infoLine(doc, twoColX[1], y + 30, 'Alcance vertical pulando', `${latest.reach_jumping.toFixed(1)} cm`);
      infoLine(doc, twoColX[0], y + 40, 'SALTO VERTICAL (calculado)', `+${latest.vertical_jump.toFixed(1)} cm`);
      infoLine(doc, twoColX[1], y + 40, 'Alcance de bloqueio', latest.block_reach ? `${latest.block_reach.toFixed(1)} cm` : '—');
      infoLine(doc, twoColX[0], y + 50, 'ALCANCE DE ATAQUE', latest.attack_reach ? `${latest.attack_reach.toFixed(1)} cm` : '—');
      y += 62;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...GRAY_TEXT);
      doc.text('*IMC (Índice de Massa Corporal) = peso (kg) / altura (m)^2. Salto Vertical = alcance pulando - alcance parado.', 14, y);
      y += 8;

      if (kind === 'resumo') {
        y = evolutionChart(doc, y, evalsForChart);
      } else {
        // Tabela de evolução (linha por avaliação)
        y = sectionTitle(doc, y, '3. Histórico de Evolução');
        y += 3;

        const headers = ['Data', 'Salto', 'Parado', 'Pulando', 'Ataque', 'Bloqueio', 'Altura', 'Peso', 'IMC'];
        const colWidths = [24, 17, 17, 17, 17, 19, 17, 15, 13];
        const drawRow = (vals: string[], opts?: { bold?: boolean; header?: boolean }) => {
          let x = 14;
          const h = 6.4;
          if (opts?.header) {
            doc.setFillColor(...DARK);
            doc.rect(14, y, colWidths.reduce((a, b) => a + b, 0), h, 'F');
            doc.setTextColor(...GREEN);
          } else if (opts?.bold) {
            doc.setFillColor(238, 240, 238);
            doc.rect(14, y, colWidths.reduce((a, b) => a + b, 0), h, 'F');
            doc.setTextColor(...DARK);
          } else {
            doc.setTextColor(60, 68, 64);
          }
          doc.setFont('helvetica', opts?.header || opts?.bold ? 'bold' : 'normal');
          doc.setFontSize(6.8);
          vals.forEach((v, i) => {
            doc.text(v, x + 1.5, y + 4.3);
            x += colWidths[i];
          });
          y += h;
        };

        drawRow(headers, { header: true });
        doc.setFontSize(6.6);
        evalsForChart.forEach((ev, idx) => {
          const row = [
            fmtDate(ev.evaluation_date),
            `+${ev.vertical_jump.toFixed(1)}`,
            ev.reach_standing.toFixed(1),
            ev.reach_jumping.toFixed(1),
            ev.attack_reach ? ev.attack_reach.toFixed(1) : '—',
            ev.block_reach ? ev.block_reach.toFixed(1) : '—',
            ev.height.toFixed(1),
            ev.weight.toFixed(1),
            ev.bmi.toFixed(1),
          ];
          if (y > doc.internal.pageSize.getHeight() - 24) {
            footer(doc);
            doc.addPage();
            header(doc, '');
            y = 34;
            drawRow(headers, { header: true });
          }
          drawRow(row, { bold: idx === evalsForChart.length - 1 });
        });

        y += 4;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...GRAY_TEXT);
        const diff = (a: number | null | undefined, b: number | null | undefined) =>
          a != null && b != null ? `${b >= a ? '+' : ''}${((b as number) - (a as number)).toFixed(1)} cm` : '—';
        const diffKg = (a: number | null | undefined, b: number | null | undefined) =>
          a != null && b != null ? `${b >= a ? '+' : ''}${((b as number) - (a as number)).toFixed(1)} kg` : '—';
        doc.text(
          `Diferenca entre a primeira e a ultima avaliacao: Salto ${diff(first.vertical_jump, latest.vertical_jump)} | ` +
          `Ataque ${diff(first.attack_reach, latest.attack_reach)} | ` +
          `Bloqueio ${diff(first.block_reach, latest.block_reach)} | ` +
          `Altura ${diff(first.height, latest.height)} | Peso ${diffKg(first.weight, latest.weight)}`,
          14,
          y,
          { maxWidth: W - 28 }
        );
        y += 10;

        // Gráfico é adicionado no fim do relatório completo
        if (y > doc.internal.pageSize.getHeight() - 90) {
          footer(doc);
          doc.addPage();
          header(doc, '');          y = 34;
          y += 2;
        }
        y = evolutionChart(doc, y, evalsForChart);

        // Metas
        if (y > doc.internal.pageSize.getHeight() - 70) {
          footer(doc);
          doc.addPage();
          header(doc, '');          y = 34;
          y += 2;
        }
        y = sectionTitle(doc, y, '4. Metas Cadastradas');
        y += 3;
        if (goals.length === 0) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(...GRAY_TEXT);
          doc.text('Nenhuma meta cadastrada.', 14, y);
          y += 6;
        } else {
          for (const g of goals) {
            if (y > doc.internal.pageSize.getHeight() - 26) {
              footer(doc);
              doc.addPage();
              header(doc, '');              y = 34;
              y += 2;
            }
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(25, 30, 27);
            const statusLabel = g.status === 'ativo' ? 'Ativa' : g.status === 'concluido' ? 'Concluida' : 'Cancelada';
            doc.text(`- ${g.title} [${statusLabel}]`, 14, y);
            y += 4.5;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(...GRAY_TEXT);
            const progressBlocks = Math.round(g.progress_pct / 10);
            const bar = '#'.repeat(progressBlocks) + '-'.repeat(10 - progressBlocks);
            const currentTxt = g.current_value != null ? `${g.current_value.toFixed(1)}` : '—';
            const targetTxt = g.target_value != null ? `${g.target_value.toFixed(1)}` : '—';
            const metricLabel = g.metric_type ? ` (${g.metric_type})` : '';
            doc.text(`  Progresso ${bar} ${g.progress_pct}% | Atual: ${currentTxt} | Desejado: ${targetTxt}${metricLabel} | Prazo: ${g.deadline ? fmtDate(g.deadline) : 'sem prazo'}`, 14, y, { maxWidth: W - 28 });
            if (g.description) {
              y += 4.5;
              doc.text(`  ${g.description}`, 14, y, { maxWidth: W - 28 });
            }
            y += 7;
          }
        }
      }

      footer(doc);
      const stamp = new Date().toISOString().slice(0, 10);
      const name = (profile?.full_name || user.name).toLowerCase().replace(/[^a-z0-9]+/g, '-');
      doc.save(kind === 'full' ? `volley-performance-time-ifal-${name}-completo-${stamp}.pdf` : `volley-performance-time-ifal-${name}-resumo-${stamp}.pdf`);
      setMessage({ type: 'success', text: 'Relatório PDF gerado com sucesso!' });
    } catch (err: any) {
      console.error('Erro ao gerar PDF:', err);
      setMessage({ type: 'error', text: err?.message || 'Erro ao gerar o relatório PDF.' });
    } finally {
      setGenerating(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070908] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-emerald-400">Preparando seus relatórios...</p>
        </div>
      </div>
    );
  }

  const semAvaliacoes = summary.evalCount === 0;

  return (
    <div className="min-h-screen bg-[#070908] text-white flex">
      <Sidebar currentUser={data.user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(true)}
          currentUser={data.user}
          title="Relatórios"
          subtitle="Gere um PDF individual com seu desempenho completo"
        />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full">
          {message && (
            <div
              className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
                message.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-neon'
                  : 'bg-red-950/60 border-red-500/50 text-red-300'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* O que o relatório contém */}
          <div className="athletic-card rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-emerald-950/60">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-wide">
                  Relatório Individual em PDF
                </h3>
                <p className="text-xs text-gray-400">
                  Documento com identidade preta e verde, gerado a partir dos dados reais da sua conta.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Avaliações', value: summary.evalCount, icon: ClipboardList },
                { label: 'Metas ativas', value: summary.activeGoals, icon: Target },
                { label: 'Metas concluídas', value: summary.completedGoals, icon: CheckCircle2 },
                { label: 'Última avaliação', value: summary.latest ? fmtDate(summary.latest.evaluation_date).slice(0, 5) : '—', icon: Calendar },
              ].map((item) => (
                <div key={item.label} className="p-3.5 rounded-xl bg-black/40 border border-emerald-950/80 text-center">
                  <item.icon className="w-4 h-4 mx-auto mb-1.5 text-emerald-400" />
                  <span className="block text-lg font-black font-mono text-white">{item.value}</span>
                  <span className="block text-[10px] text-gray-400 uppercase font-semibold mt-0.5">{item.label}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400 leading-relaxed mb-6">
              O relatório contém: <span className="text-emerald-300">informações pessoais</span>, medidas físicas, resultados
              das avaliações, <span className="text-emerald-300">tabela comparativa de evolução</span> (primeira x última),
              metas cadastradas e um <span className="text-emerald-300">gráfico de desempenho</span> desenhado no PDF.
            </p>

            {semAvaliacoes && (
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-sm mb-5">
                <p className="font-bold mb-1">Nenhuma avaliação registrada</p>
                <p className="text-xs">
                  Cadastre sua primeira avaliação física para liberar a geração de relatórios.{' '}
                  <Link href="/avaliacao" className="text-emerald-300 underline font-semibold">Ir ao formulário</Link>
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => generateReport('full')}
                disabled={generating !== null || semAvaliacoes}
                className="flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-neon-strong transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
              >
                {generating === 'full' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                <span>{generating === 'full' ? 'Gerando PDF...' : 'Relatório Completo'}</span>
              </button>

              <button
                onClick={() => generateReport('resumo')}
                disabled={generating !== null || semAvaliacoes}
                className="flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-[#0f1512] hover:bg-[#152017] text-emerald-300 border border-emerald-950 hover:border-emerald-500/40 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                {generating === 'resumo' ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileCheck2 className="w-5 h-5" />}
                <span>{generating === 'resumo' ? 'Gerando PDF...' : 'Resumo da Última Avaliação'}</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
