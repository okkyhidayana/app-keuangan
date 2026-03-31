import type { Metadata } from 'next';
import { EvaluasiContent } from './EvaluasiContent';

export const metadata: Metadata = { title: 'Evaluasi Tahunan' };

export default function EvaluasiPage() {
  return <EvaluasiContent />;
}
