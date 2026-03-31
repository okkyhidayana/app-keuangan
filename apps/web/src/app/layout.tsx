import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'Keuangan — Manajemen Keuangan Personal',
    template: '%s | Keuangan',
  },
  description:
    'Aplikasi manajemen keuangan personal lengkap: Net Worth, Arus Kas, Checkup Keuangan, Simulasi KPR, Budgeting, dan Tabungan.',
  keywords: ['keuangan', 'budgeting', 'net worth', 'KPR', 'investasi', 'tabungan'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head />
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
