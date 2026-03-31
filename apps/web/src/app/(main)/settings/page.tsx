import type { Metadata } from 'next';
import { SettingsContent } from './SettingsContent';

export const metadata: Metadata = { title: 'Pengaturan' };

export default function SettingsPage() {
  return <SettingsContent />;
}
