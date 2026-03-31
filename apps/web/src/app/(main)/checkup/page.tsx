import type { Metadata } from 'next';
import { CheckupContent } from './CheckupContent';
export const metadata: Metadata = { title: 'Checkup Keuangan' };
export default function CheckupPage() { return <CheckupContent />; }
