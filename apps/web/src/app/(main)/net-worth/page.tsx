import type { Metadata } from 'next';
import { NetWorthContent } from './NetWorthContent';

export const metadata: Metadata = { title: 'Net Worth' };
export default function NetWorthPage() { return <NetWorthContent />; }
