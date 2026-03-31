import type { Metadata } from 'next';
import { ArusKasContent } from './ArusKasContent';

export const metadata: Metadata = { title: 'Arus Kas' };

export default function ArusKasPage() {
  return <ArusKasContent />;
}
