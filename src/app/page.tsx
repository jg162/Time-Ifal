import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Zap, TrendingUp, Users, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#070908] text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-black">
      {/* Top Bar */}
      <header className="px-6 lg:px-12 py-6 border-b border-emerald-950/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 p-0.5 shadow-neon flex items-center justify-center">
            <div className="w-full h-full bg-[#0a0d0b] rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xl tracking-wider text-white">VOLLEY</span>
              <span className="font-black text-xl tracking-wider text-emerald-400">PERFORMANCE</span>
            </div>
            <p className="text-[10px] tracking-widest text-emerald-500/80 font-bold uppercase">
              Plataforma de Avaliação de Vôlei
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs sm:text-sm tracking-wide shadow-neon transition-all hover:scale-105"
          >
            Criar Conta
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 lg:py-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-8 shadow-neon">
          <Zap className="w-3.5 h-3.5" />
          <span>Alta Performance e Monitoramento Físico</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl leading-tight sm:leading-none mb-6">
          AVALIAÇÃO E EVOLUÇÃO PARA ATLETAS DE <span className="text-emerald-400 glow-green">VOLEIBOL</span>
        </h1>

        <p className="text-gray-300 text-base sm:text-xl max-w-2xl leading-relaxed mb-10">
          Acompanhe impulsão, alcance de ataque, envergadura, histórico de medidas físicas e métricas coletivas do elenco com total precisão e privacidade.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/cadastro"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-base tracking-wider uppercase shadow-neon-strong hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <span>CADASTRAR ATLETA</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#0f1512] hover:bg-[#16201b] text-white border border-emerald-950 hover:border-emerald-500/40 font-bold text-base tracking-wide transition-all"
          >
            Acessar Painel
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full text-left">
          <div className="athletic-card p-6 rounded-2xl">
            <div className="p-3 w-fit rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Cálculos Instantâneos</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Cálculo em tempo real de impulsão vertical (salto = alcance pulando − parado), IMC com badge de saúde atlética e idade automática.
            </p>
          </div>

          <div className="athletic-card p-6 rounded-2xl">
            <div className="p-3 w-fit rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Histórico & Gráficos</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Registre avaliações periódicas sem sobrescrever dados anteriores. Acompanhe a progressão com gráficos de linha e área.
            </p>
          </div>

          <div className="athletic-card p-6 rounded-2xl">
            <div className="p-3 w-fit rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Área Coletiva do Time</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Visualização de todos os atletas do elenco, filtros por posição, ordenação por altura e impulsão, com respeito total à privacidade de cada jogador.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-emerald-950/40 text-center text-xs text-gray-500">
        <p>© 2026 VOLLEY PERFORMANCE · TIME IFAL. Plataforma de Rendimento e Avaliação Esportiva.</p>
      </footer>
    </div>
  );
}
