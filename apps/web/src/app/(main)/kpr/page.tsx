import type { Metadata } from 'next';
import { KPRContent } from './KPRContent';
export const metadata: Metadata = { title: 'Simulasi KPR' };
export default function KPRPage() { return <KPRContent />; }
