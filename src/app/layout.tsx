import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TIME IFAL | Plataforma de Avaliação e Acompanhamento Esportivo',
  description: 'Plataforma de avaliação física e acompanhamento esportivo de atletas de vôlei do IFAL.',
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
