'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  Users, 
  ArrowRight, 
  Activity, 
  Ruler, 
  FileText, 
  Lock, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  CheckCircle2, 
  ClipboardList, 
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
      q: 'Como é calculada a impulsão vertical do atleta?',
      a: 'A impulsão vertical é calculada automaticamente subtraindo o alcance vertical parado do alcance vertical máximo no salto (Salto vertical = Alcance no salto − Alcance parado). O sistema realiza a operação instantaneamente com base nas medidas em centímetros.'
    },
    {
      q: 'Os dados dos atletas possuem privacidade e proteção?',
      a: 'Sim. Em conformidade com a LGPD e as diretrizes do IFAL, cada atleta possui acesso restrito ao próprio perfil e histórico. Na área da equipe, apenas as informações esportivas compartilhadas são visíveis para os companheiros do time.'
    },
    {
      q: 'Como funciona a criação e a entrada em uma equipe no TIME IFAL?',
      a: 'Qualquer atleta pode criar um time e receber um código de convite único (ex: TIME-1234). Ao compartilhar esse código, outros atletas podem inseri-lo na área TIME para ingressar imediatamente no elenco.'
    },
    {
      q: 'Minhas avaliações anteriores são substituídas quando realizo uma nova?',
      a: 'Não. O sistema registra cada avaliação de forma acumulativa no banco de dados, associada à data do teste. Você pode consultar todo o seu histórico e acompanhar a evolução ao longo do tempo.'
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
              <span className="font-black text-xl tracking-wider text-white">TIME</span>
              <span className="font-black text-xl tracking-wider text-emerald-400">IFAL</span>
            </div>
            <p className="text-[9px] sm:text-[10px] tracking-widest text-emerald-500/80 font-bold uppercase">
              Vôlei de Alto Rendimento
            </p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-gray-300">
          <a href="#como-funciona" className="hover:text-emerald-400 transition-colors">Como Funciona</a>
          <a href="#demonstracao" className="hover:text-emerald-400 transition-colors">Demonstração</a>
          <a href="#sobre" className="hover:text-emerald-400 transition-colors">Sobre</a>
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
        
        {/* HERO SECTION */}
        <section className="flex flex-col items-center text-center pt-4 sm:pt-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-6 shadow-neon">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Plataforma Oficial de Avaliação e Desempenho Físico</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-5xl leading-tight sm:leading-none mb-6">
            AVALIAÇÃO, IMPULSÃO E DESEMPENHO NO <span className="text-emerald-400 glow-green">VOLEIBOL</span>
          </h1>

          <p className="text-gray-300 text-sm sm:text-lg max-w-3xl leading-relaxed mb-8">
            Plataforma de avaliação física e acompanhamento esportivo de atletas de vôlei do IFAL. Registre medidas corporais, impulsão vertical calculada, alcance de ataque e de bloqueio com simplicidade e precisão.
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
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Salto Vertical</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">Automático</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">Salto = Pulando − Parado</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#0a0f0c] border border-emerald-950/80 text-left">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Alcance em Rede</span>
              <span className="text-xl sm:text-2xl font-black text-white font-mono">Ataque & Bloqueio</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">Medidas em centímetros</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#0a0f0c] border border-emerald-950/80 text-left">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Histórico Acumulado</span>
              <span className="text-xl sm:text-2xl font-black text-sky-400 font-mono">Sem Sobrescrever</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">Evolução por data de teste</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#0a0f0c] border border-emerald-950/80 text-left">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Equipes & Convites</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">Área do Time</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">Criação e entrada por código</span>
            </div>
          </div>
        </section>

        {/* DEMONSTRAÇÃO VISUAL / DASHBOARD & FICHA PREVIEW */}
        <section id="demonstracao" className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Interface Esportiva</span>
            <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight mt-1">
              Painel do Atleta TIME IFAL
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">
              Estruturado para acompanhamento de dados físicos e técnicos reais em quadra.
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
                      <h3 className="text-base font-black text-white">Atleta do Voleibol</h3>
                      <p className="text-xs text-gray-400 flex items-center gap-1.5">
                        <span className="text-emerald-400 font-bold">Ponteiro</span> • TIME IFAL
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                    Atleta Ativo
                  </span>
                </div>

                {/* Métricas do Mockup */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                  <div className="p-3.5 rounded-xl bg-[#070908] border border-emerald-950">
                    <span className="text-[10px] text-gray-400 uppercase block font-semibold">Alcance no Salto</span>
                    <span className="text-lg font-black text-emerald-300 font-mono">332 cm</span>
                    <span className="text-[9px] text-gray-500 block">Em centímetros</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#070908] border border-emerald-950">
                    <span className="text-[10px] text-gray-400 uppercase block font-semibold">Salto Vertical</span>
                    <span className="text-lg font-black text-sky-400 font-mono">+74 cm</span>
                    <span className="text-[9px] text-sky-300 block">Impulsão líquida</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#070908] border border-emerald-950">
                    <span className="text-[10px] text-gray-400 uppercase block font-semibold">Altura & Envergadura</span>
                    <span className="text-lg font-black text-white font-mono">192 cm</span>
                    <span className="text-[9px] text-gray-400 block">Envergadura: 198 cm</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#070908] border border-emerald-950/80">
                  <span className="text-xs font-bold text-gray-300 block mb-1">
                    Cálculo Automático de Salto Líquido
                  </span>
                  <p className="text-xs text-gray-400 leading-relaxed font-mono">
                    Alcance Pulando (332 cm) − Alcance Parado (258 cm) = +74 cm de impulsão
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-emerald-950/60 flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Atualização e histórico persistido no banco
                </span>
                <Link href="/cadastro" className="font-bold text-white hover:text-emerald-400">
                  Criar Minha Conta →
                </Link>
              </div>
            </div>

            {/* Mockup da Ficha Técnica */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-gradient-to-b from-[#0e1712] to-[#080d0a] border border-emerald-500/40 flex flex-col justify-between shadow-2xl">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">Ficha Técnica Integrada</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">TIME IFAL</span>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-black/60 border border-emerald-950/80">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Dados Biométricos</span>
                    <div className="grid grid-cols-2 gap-2 mt-1.5 text-xs">
                      <div><span className="text-gray-500">Altura:</span> <span className="font-bold text-white">192 cm</span></div>
                      <div><span className="text-gray-500">Peso:</span> <span className="font-bold text-white">82 kg</span></div>
                      <div><span className="text-gray-500">Alcance Parado:</span> <span className="font-bold text-white">258 cm</span></div>
                      <div><span className="text-gray-500">Alcance no Salto:</span> <span className="font-bold text-emerald-300">332 cm</span></div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/60 border border-emerald-950/80">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Saques Praticados</span>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-950 border border-emerald-500/30 text-[10px] text-emerald-300 font-bold">Viagem</span>
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-950 border border-emerald-500/30 text-[10px] text-emerald-300 font-bold">Flutuante pulando</span>
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-950 border border-emerald-500/30 text-[10px] text-emerald-300 font-bold">Híbrido</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/60 border border-emerald-950/80">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Objetivos Esportivos</span>
                    <p className="text-xs text-gray-300 italic mt-1">
                      "Atingir 340 cm de alcance no ataque e manter regularidade de passe."
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-emerald-950/60 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Integrada diretamente à página Meu Perfil
                </span>
                <Link
                  href="/cadastro"
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 text-black text-xs font-extrabold shadow-neon hover:bg-emerald-400 transition-all"
                >
                  Começar Agora
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA A PLATAFORMA */}
        <section id="como-funciona" className="space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Passo a Passo</span>
            <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight mt-1">
              Como Funciona o TIME IFAL
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">
              Desenvolvido com foco no atleta, segurança dos dados e usabilidade direta.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="p-6 rounded-3xl bg-[#0a0f0c] border border-emerald-950/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold flex items-center justify-center text-sm mb-4">
                  01
                </span>
                <h3 className="text-base font-bold text-white mb-2">Conta & Meu Perfil</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Cadastre sua conta com e-mail e senha. Complete suas informações de atleta: altura, peso, envergadura, posição e tipos de saque.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-[#0a0f0c] border border-emerald-950/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold flex items-center justify-center text-sm mb-4">
                  02
                </span>
                <h3 className="text-base font-bold text-white mb-2">Nova Avaliação Física</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Preencha data, peso, altura, envergadura, alcance parado e alcance no salto. Registre também os alcances de ataque e de bloqueio.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-[#0a0f0c] border border-emerald-950/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold flex items-center justify-center text-sm mb-4">
                  03
                </span>
                <h3 className="text-base font-bold text-white mb-2">Cálculo Automático</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  O sistema calcula o salto vertical instantaneamente e armazena os dados no histórico de avaliações, sem sobrescrever registros antigos.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-[#0a0f0c] border border-emerald-950/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold flex items-center justify-center text-sm mb-4">
                  04
                </span>
                <h3 className="text-base font-bold text-white mb-2">Equipe (Time)</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Crie sua própria equipe e gere um código de convite único, ou entre em um time existente usando o código fornecido pelo capitão.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SOBRE O PROJETO */}
        <section id="sobre" className="p-8 sm:p-10 rounded-3xl bg-[#0a0f0c] border border-emerald-950/80">
          <div className="max-w-3xl">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Iniciativa Esportiva</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide mt-1 mb-4">
              Sobre o Projeto TIME IFAL
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed mb-4">
              O <strong className="text-white">TIME IFAL</strong> nasceu para profissionalizar o processo de avaliação física, técnica e biométrica das equipes de voleibol do Instituto Federal de Alagoas (IFAL).
            </p>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Plataforma de avaliação física e acompanhamento esportivo de atletas de vôlei do IFAL. Oferece um ambiente seguro, direto e acessível em computadores e celulares, garantindo que os dados dos atletas permaneçam salvos e organizados.
            </p>
            <div className="flex flex-wrap items-center gap-6 text-xs text-gray-400 pt-4 border-t border-emerald-950">
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-emerald-400" /> Segurança e Autenticação</span>
              <span className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-emerald-400" /> Proteção de Dados (LGPD)</span>
              <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-emerald-400" /> Ciência do Voleibol</span>
            </div>
          </div>
        </section>

        {/* FAQ - PERGUNTAS FREQUENTES */}
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

        {/* CALL TO ACTION FINAL */}
        <section className="relative overflow-hidden p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#0c1811] via-[#09140e] to-[#070908] border border-emerald-500/40 text-center shadow-2xl">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-black flex items-center justify-center mx-auto shadow-neon">
              <Zap className="w-6 h-6 stroke-[2.5]" />
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
              FAÇA PARTE DO TIME IFAL
            </h2>

            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Crie sua conta agora mesmo para registrar suas avaliações físicas, calcular sua impulsão e participar da sua equipe de voleibol.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/cadastro"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm uppercase tracking-wider shadow-neon transition-all"
              >
                Cadastrar Agora
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white border border-emerald-950 hover:border-emerald-500/40 text-sm font-semibold transition-all"
              >
                Já Tenho Conta
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-emerald-950/60 bg-[#050706] py-8 px-4 sm:px-8 text-center text-xs text-gray-500 space-y-2">
        <p>© 2026 TIME IFAL · Instituto Federal de Alagoas. Plataforma de avaliação física e acompanhamento esportivo de atletas de vôlei do IFAL.</p>
        <p className="text-[11px] text-gray-600">Desenvolvido com foco no alto rendimento esportivo e segurança de dados.</p>
      </footer>
    </div>
  );
}