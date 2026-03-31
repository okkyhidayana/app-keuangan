import type { Metadata } from 'next';
import { TabunganContent } from './TabunganContent';

export const metadata: Metadata = { title: 'Dashboard Tabungan' };

export default function TabunganPage() {
  return <TabunganContent />;
}
