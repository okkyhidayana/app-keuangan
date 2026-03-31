import type { Metadata } from 'next';
import { KalendarContent } from './KalendarContent';

export const metadata: Metadata = { title: 'Kalendar Keuangan' };

export default function KalendarPage() {
  return <KalendarContent />;
}
