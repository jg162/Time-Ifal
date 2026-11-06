'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  Users, 
  ArrowRight, 
  Trophy, 
  Activity, 
  Ruler, 
  FileText, 
  Lock, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  CheckCircle2, 
  BarChart3, 
  Target, 
  QrCode,
  Shield,
  X
} from 'lucide-react';

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: 'Como é calculada a impulsão vertical líquida do atleta?',
      a: 'A impulsão vertical é obtida através da subtração do alcance vertical parado (em extensão unipodal ou bipodal com braço estendido) do alcance vertical máximo em salto com passada de ataque. O sistema faz essa conta em tempo real com precisão de milímetros.'
    },
    {
      q: 'Atletas menores de idade possuem privacidade e proteção de dados?',
      a: 'Sim. Em conformidade com a LGPD e as diretrizes do ECA, os dados biométricos de cada atleta podem ser configurados como privados (peso, altura, envergadura, metas). Apenas o próprio atleta ou treinador autorizado tem acesso aos detalhes restritos, e a data de nascimento completa não é exposta publicamente.'
    },
    {
      q: 'Como funciona a criação e o link de convite do Time?',
      a: 'Qualquer capitão ou comissão técnica pode criar um time na área TIME e receber um link de convite único (ex: /cadastro?team=VOLL-1234). Ao compartilhar esse link, os atletas que criarem conta já entram automaticamente no elenco do time.'
    },
    {
      q: 'Posso exportar meu histórico e gerar relatórios em PDF?',
      a: 'Sim. A plataforma conta com exportação completa em formato JSON para backup, além de geração de Ficha Técnica e Relatórios Periódicos em PDF de alta qualidade com a identidade visual do vôlei.'
    },
    {
      q: 'Como funciona a Carteirinha Digital do Atleta?',
      a: 'Você pode ativar sua carteirinha pública nas configurações para gerar um link único com slug personalizado e QR code verificável, facilitando a apresentação para olheiros, federações e comissões técnicas.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#070908] text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-black">
      {/* Background Accent Gradients */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent pointer-events-none blur-3xl -z-10" />

      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-[#070908]/90 backdrop-blur-md px-4 sm:px-8 lg:px-12 py-4 border-b border-emerald-950/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 p-0.5 shadow-neon flex items-center justify-center">
            <div className="w-full h-full bg-[#0a0d0b] rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg sm:text-xl tracking-wider text-white">VOLLEY</span>
              <span className="font-black text-lg sm:text-xl tracking-wider text-emerald-400">PERFORMANCE</span>
            </div>
            <p className="text-[9px] sm:text-[10px] tracking-widest text-emerald-500/80 font-bold uppercase">
              Time IFAL · Alto Rendimento
            </p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-gray-300">
          <a href="#como-funciona" className="hover:text-emerald-400 transition-colors">Como Funciona</a>
          <a href="#demonstracao" className="hover:text-emerald-400 transition-colors">Demonstração</a>
          <a href="#rankings" className="hover:text-emerald-400 transition-colors">Rankings</a>
          <a href="#faq" className="hover:text-emerald-400 transition-colors">Dúvidas</a>
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs sm:text-sm tracking-wide shadow-neon transition-all hover:scale-105"
          >
            Criar Conta
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-24 w-full">
        
        {/* ================================================================= */}
        {/* HERO SECTION */}
        {/* ================================================================= */}
        <section className="flex flex-col items-center text-center pt-4 sm:pt-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-6 shadow-neon">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Plataforma Oficial de Avaliação e Desempenho Físico</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-5xl leading-tight sm:leading-none mb-6">
            AVALIAÇÃO, EVOLUÇÃO E CIÊNCIA DO ESPORTE PARA O <span className="text-emerald-400 glow-green">VOLEIBOL</span>
          </h1>

          <p className="text-gray-300 text-sm sm:text-lg max-w-2xl leading-relaxed mb-8">
            Monitore impulsão vertical, alcance de ataque e bloqueio, envergadura, histórico de testes antropométricos e rankings com privacidade e precisão profissional.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              href="/cadastro"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm sm:text-base tracking-wider uppercase shadow-neon-strong hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <span>CADASTRAR ATLETA</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#0f1512] hover:bg-[#16201b] text-white border border-emerald-950 hover:border-emerald-500/40 font-bold text-sm sm:text-base tracking-wide transition-all"
            >
              Acessar Painel
            </Link>
          </div>

          {/* Quick Metrics Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-12 w-full max-w-4xl">
            <div className="p-4 rounded-2xl bg-[#0a0f0c] border border-emerald-950/80 text-left">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Impulsão Líquida</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">+68 cm</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">Média de salto da equipe</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#0a0f0c] border border-emerald-950/80 text-left">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Alcance de Ataque</span>
              <span className="text-xl sm:text-2xl font-black text-white font-mono">335 cm</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">Ponto mais alto em rede</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#0a0f0c] border border-emerald-950/80 text-left">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Privacidade Total</span>
              <span className="text-xl sm:text-2xl font-black text-sky-400 font-mono">LGPD</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">Controle individual de dados</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#0a0f0c] border border-emerald-950/80 text-left">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Carteirinha Digital</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">QR Code</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">Verificação pública rápida</span>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* DEMONSTRAÇÃO VISUAL / DASHBOARD & FICHA PREVIEW */}
        {/* ================================================================= */}
        <section id="demonstracao" className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Interface Profissional</span>
            <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight mt-1">
              Demonstração do Painel & Ficha Técnica
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">
              Veja uma prévia dos componentes que os atletas e treinadores utilizam no dia a dia.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Mockup do Dashboard */}
            <div className="lg:col-span-7 p-6 rounded-3xl bg-[#0a0f0c] border border-emerald-500/30 flex flex-col justify-between shadow-2xl">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-emerald-950/80 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center font-black text-emerald-400 text-lg">
                      IF
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white">João Guilherme (Atleta Exemplo)</h3>
                      <p className="text-xs text-gray-400 flex items-center gap-1.5">
                        <span className="text-emerald-400 font-bold">Ponteiro Passador</span> • 18 anos • TIME IFAL
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                    Atleta Titular
                  </span>
                </div>

                {/* Métricas do Mockup */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                  <div className="p-3.5 rounded-xl bg-[#070908] border border-emerald-950">
                    <span className="text-[10px] text-gray-400 uppercase block font-semibold">Alcance de Ataque</span>
                    <span className="text-lg font-black text-emerald-300 font-mono">328 cm</span>
                    <span className="text-[9px] text-emerald-400 block">+6 cm vs. última</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#070908] border border-emerald-950">
                    <span className="text-[10px] text-gray-400 uppercase block font-semibold">Salto Vertical</span>
                    <span className="text-lg font-black text-sky-400 font-mono">+64 cm</span>
                    <span className="text-[9px] text-sky-300 block">Classificação: Ótimo</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#070908] border border-emerald-950">
                    <span className="text-[10px] text-gray-400 uppercase block font-semibold">Envergadura</span>
                    <span className="text-lg font-black text-white font-mono">194 cm</span>
                    <span className="text-[9px] text-gray-400 block">Índice: +6 cm altura</span>
                  </div>
                </div>

                {/* Gráfico Simulado */}
                <div className="p-4 rounded-xl bg-[#070908] border border-emerald-950/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Progressão do Salto Vertical (Últimos 6 meses)
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">+8 cm total</span>
                  </div>
                  <div className="h-24 w-full flex items-end gap-2 pt-2">
                    <div className="flex-1 bg-emerald-950/80 hover:bg-emerald-500/30 rounded-t h-[55%] transition-all relative group">
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-gray-400 font-mono hidden group-hover:block">56cm</span>
                    </div>
                    <div className="flex-1 bg-emerald-950/80 hover:bg-emerald-500/30 rounded-t h-[65%] transition-all relative group">
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-gray-400 font-mono hidden group-hover:block">58cm</span>
                    </div>
                    <div className="flex-1 bg-emerald-950/80 hover:bg-emerald-500/30 rounded-t h-[72%] transition-all relative group">
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-gray-400 font-mono hidden group-hover:block">60cm</span>
                    </div>
                    <div className="flex-1 bg-emerald-950/80 hover:bg-emerald-500/30 rounded-t h-[80%] transition-all relative group">
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-gray-400 font-mono hidden group-hover:block">62cm</span>
                    </div>
                    <div className="flex-1 bg-emerald-500 rounded-t h-[95%] shadow-neon transition-all relative group">
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-emerald-300 font-mono">64cm</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-[9px] text-gray-500 mt-2 font-mono">
                    <span>Jan</span>
                    <span>Mar</span>
                    <span>Mai</span>
                    <span>Jul</span>
                    <span>Set</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-emerald-950/60 flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Atualização em tempo real sem sobrescrever avaliações
                </span>
                <Link href="/cadastro" className="font-bold text-white hover:text-emerald-400">
                  Experimentar →
                </Link>
              </div>
            </div>

            {/* Mockup da Ficha Técnica / Carteirinha */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-gradient-to-b from-[#0e1712] to-[#080d0a] border border-emerald-500/40 flex flex-col justify-between shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <QrCode className="w-40 h-40 text-emerald-400" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">Ficha Técnica Oficial</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">ID: VP-IFAL-2026</span>
                </div>

                <div className="space-y-3 relative z-10">
                  <div className="p-3 rounded-xl bg-black/60 border border-emerald-950/80">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Dados Biométricos</span>
                    <div className="grid grid-cols-2 gap-2 mt-1.5 text-xs">
                      <div><span className="text-gray-500">Altura:</span> <span className="font-bold text-white">188 cm</span></div>
                      <div><span className="text-gray-500">Peso:</span> <span className="font-bold text-white">78 kg</span></div>
                      <div><span className="text-gray-500">Alcance Parado:</span> <span className="font-bold text-white">245 cm</span></div>
                      <div><span className="text-gray-500">Alcance Pulando:</span> <span className="font-bold text-emerald-300">328 cm</span></div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/60 border border-emerald-950/80">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Habilidades Técnicas</span>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-500/30 text-[10px] text-emerald-300 font-bold">Viagem</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-500/30 text-[10px] text-emerald-300 font-bold">Flutuante</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-500/30 text-[10px] text-emerald-300 font-bold">Ataque Ponta</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-500/30 text-[10px] text-emerald-300 font-bold">Passe A</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/60 border border-emerald-950/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Carteirinha Digital</span>
                      <span className="text-xs font-mono text-emerald-400">/cartao/joao-guilherme</span>
                    </div>
                    <QrCode className="w-8 h-8 text-emerald-400" />
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-emerald-950/60 flex items-center justify-between">
                <span className="text-xs text-gray-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" /> Exportável em PDF A4
                </span>
                <Link
                  href="/cadastro"
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 text-black text-xs font-extrabold shadow-neon hover:bg-emerald-400 transition-all"
                >
                  Gerar Minha Ficha
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* COMO FUNCIONA A PLATAFORMA */}
        {/* ================================================================= */}
        <section id="como-funciona" className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Passo a Passo</span>
            <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight mt-1">
              Como Funciona o Volley Performance
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">
              Estruturado para comissões técnicas e atletas acompanharem dados reais com praticidade.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="p-6 rounded-3xl bg-[#0a0f0c] border border-emerald-950/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold flex items-center justify-center text-sm mb-4">
                  01
                </span>
                <h3 className="text-base font-bold text-white mb-2">Cadastro ou Criação de Time</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Crie sua conta em segundos ou acesse o time da sua instituição através do link de convite oficial.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-[#0a0f0c] border border-emerald-950/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold flex items-center justify-center text-sm mb-4">
                  02
                </span>
                <h3 className="text-base font-bold text-white mb-2">Avaliações Periódicas</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Lance testes de salto, alcance de ataque e bloqueio, peso, altura e envergadura a cada ciclo de treino.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-[#0a0f0c] border border-emerald-950/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold flex items-center justify-center text-sm mb-4">
                  03
                </span>
                <h3 className="text-base font-bold text-white mb-2">Gráficos & Recordes</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Visualize a curva de evolução técnica, receba notificações de recordes pessoais batidos e estabeleça metas.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-[#0a0f0c] border border-emerald-950/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold flex items-center justify-center text-sm mb-4">
                  04
                </span>
                <h3 className="text-base font-bold text-white mb-2">Rankings & Comparações</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Compare atletas lado a lado para montar a melhor formação tática, respeitando as preferências de privacidade.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* RANKINGS & RECORDES SECTION */}
        {/* ================================================================= */}
        <section id="rankings" className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[#0d1612] via-[#09120e] to-[#070908] border border-emerald-500/30">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Trophy className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Competitividade Saudável</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide">
                Rankings da Equipe & Recordes Históricos
              </h2>
              <p className="text-xs sm:text-sm text-gray-300 mt-1">
                Classificações automáticas baseadas exclusivamente nas avaliações autorizadas e mais recentes.
              </p>
            </div>
            <Link
              href="/cadastro"
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider shadow-neon transition-all"
            >
              Entrar nos Rankings
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#0a0f0c] border border-emerald-950">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-2">Maior Salto Vertical</span>
              <p className="text-sm text-gray-300">Impulsão líquida medida em centímetros, filtrada por posição e histórico.</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#0a0f0c] border border-emerald-950">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-2">Alcance de Ataque & Bloqueio</span>
              <p className="text-sm text-gray-300">Medição do ponto mais alto de contato acima da fita da rede oficial.</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#0a0f0c] border border-emerald-950">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-2">Envergadura & Altura</span>
              <p className="text-sm text-gray-300">Relação morfológica e alcance estático para posicionamento de bloqueadores.</p>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* SOBRE O PROJETO */}
        {/* ================================================================= */}
        <section className="p-8 sm:p-10 rounded-3xl bg-[#0a0f0c] border border-emerald-950/80">
          <div className="max-w-3xl">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Iniciativa Esportiva</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide mt-1 mb-4">
              Sobre o Projeto TIME IFAL · VOLLEY PERFORMANCE
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed mb-4">
              O <strong className="text-white">VOLLEY PERFORMANCE</strong> nasceu para profissionalizar o processo de avaliação física, técnica e biométrica das equipes de voleibol do Instituto Federal de Alagoas (IFAL).
            </p>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Em vez de anotações esparsas em cadernos ou planilhas não integradas, atletas e comissões técnicas contam com uma plataforma segura, moderna e acessível em smartphones ou computadores, garantindo a continuidade do desenvolvimento esportivo.
            </p>
            <div className="flex flex-wrap items-center gap-6 text-xs text-gray-400 pt-4 border-t border-emerald-950">
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-emerald-400" /> Segurança de Nível Bancário</span>
              <span className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-emerald-400" /> Adequação LGPD</span>
              <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-emerald-400" /> Ciência do Voleibol</span>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* FAQ - PERGUNTAS FREQUENTES */}
        {/* ================================================================= */}
        <section id="faq" className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Tire suas Dúvidas</span>
            <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight mt-1">
              Perguntas Frequentes
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-[#0a0f0c] border border-emerald-950/80 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-emerald-950/20 transition-colors"
                  >
                    <span className="text-sm font-bold text-white">{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-gray-300 leading-relaxed border-t border-emerald-950/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ================================================================= */}
        {/* CALL TO ACTION FINAL */}
        {/* ================================================================= */}
        <section className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#0c1912] via-[#09120e] to-[#070908] border border-emerald-500/40 text-center shadow-2xl">
          <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight mb-4">
            Pronto para Elevar o Nível do seu Vôlei?
          </h2>
          <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto mb-8 leading-relaxed">
            Cadastre seu perfil gratuitamente, registre sua primeira avaliação física e acompanhe sua impulsão jogo a jogo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/cadastro"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm sm:text-base tracking-wider uppercase shadow-neon-strong transition-all flex items-center justify-center gap-2"
            >
              <span>Criar Conta de Atleta</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#0f1512] hover:bg-[#16201b] text-white border border-emerald-950 font-bold text-sm sm:text-base tracking-wide transition-all"
            >
              Fazer Login
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-8 border-t border-emerald-950/60 bg-[#060807] text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p>© 2026 VOLLEY PERFORMANCE · TIME IFAL. Plataforma de Rendimento e Avaliação Esportiva.</p>
          <div className="flex items-center gap-4 text-gray-400">
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="hover:text-emerald-400 underline transition-colors"
            >
              Política de Privacidade (LGPD)
            </button>
            <span>•</span>
            <button
              onClick={() => setShowTermsModal(true)}
              className="hover:text-emerald-400 underline transition-colors"
            >
              Termos de Uso
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL: POLÍTICA DE PRIVACIDADE (LGPD) */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#0a0f0c] border border-emerald-500/40 rounded-3xl p-6 sm:p-8 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-emerald-950/80 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white uppercase tracking-wide">Política de Privacidade (LGPD)</h3>
              </div>
              <button onClick={() => setShowPrivacyModal(false)} className="p-1 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-gray-300 space-y-3 leading-relaxed">
              <p><strong>1. Finalidade do Tratamento:</strong> Os dados coletados (nome, e-mail, idade, medidas antropométricas e parâmetros de desempenho esportivo) destinam-se exclusivamente ao monitoramento atlético, preparação física e composição de equipes de voleibol.</p>
              <p><strong>2. Proteção de Menores:</strong> Em atenção ao Estatuto da Criança e do Adolescente (ECA) e à Lei Geral de Proteção de Dados (LGPD), datas de nascimento completas não são divulgadas publicamente e controles granulares de privacidade são disponibilizados para ocultar peso, altura, envergadura e metas a critério do atleta ou responsável.</p>
              <p><strong>3. Direitos do Titular:</strong> O atleta tem o direito de acessar, retificar, exportar em formato estruturado (JSON) ou solicitar a exclusão definitiva e irreversível de sua conta e histórico a qualquer momento diretamente na aba Configurações.</p>
              <p><strong>4. Não Compartilhamento com Terceiros:</strong> O VOLLEY PERFORMANCE não comercializa, não aluga e não repassa informações biométricas a terceiros para fins publicitários.</p>
            </div>
            <div className="mt-6 pt-4 border-t border-emerald-950/80 flex justify-end">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs uppercase shadow-neon"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TERMOS DE USO */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#0a0f0c] border border-emerald-500/40 rounded-3xl p-6 sm:p-8 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-emerald-950/80 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white uppercase tracking-wide">Termos de Uso</h3>
              </div>
              <button onClick={() => setShowTermsModal(false)} className="p-1 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-gray-300 space-y-3 leading-relaxed">
              <p><strong>1. Uso da Plataforma:</strong> O VOLLEY PERFORMANCE é destinado a atletas, treinadores e comissões técnicas para registro de desempenho físico em voleibol.</p>
              <p><strong>2. Veracidade das Informações:</strong> O usuário compromete-se a registrar apenas dados verdadeiros e a manter a segurança de sua senha de acesso.</p>
              <p><strong>3. Conduta Esportiva:</strong> O ambiente coletivo da plataforma baseia-se no respeito mútuo, integridade e incentivo ao crescimento dos atletas da equipe.</p>
            </div>
            <div className="mt-6 pt-4 border-t border-emerald-950/80 flex justify-end">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-xs uppercase shadow-neon"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
