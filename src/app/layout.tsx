import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TIME IFAL | Plataforma de Avaliação de Atletas de Vôlei',
  description: 'Sistema completo e moderno para avaliação física, acompanhamento de evolução e análise técnica de atletas de voleibol.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="antialiased selection:bg-emerald-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
