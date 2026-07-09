import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Brunch Bouaké — PMS Hôtelier',
  description:
    'Système de gestion hôtelière pour Brunch Bouaké, Bouaké, Côte d\'Ivoire',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
