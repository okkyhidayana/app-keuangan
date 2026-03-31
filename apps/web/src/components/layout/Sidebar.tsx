'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  TrendingUp,
  ArrowLeftRight,
  HeartPulse,
  Home,
  PiggyBank,
  CreditCard,
  Calendar,
  Target,
  BarChart3,
  Settings,
  Wallet,
  ChevronRight,
  Sun,
  Moon,
  Menu,
  X
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/net-worth', label: 'Net Worth', icon: TrendingUp },
  { href: '/arus-kas', label: 'Arus Kas', icon: ArrowLeftRight },
  { href: '/checkup', label: 'Checkup Keuangan', icon: HeartPulse },
  { href: '/kpr', label: 'Simulasi KPR', icon: Home },
  { href: '/budgeting', label: 'Budgeting', icon: PiggyBank },
  { href: '/pembayaran', label: 'Pembayaran', icon: CreditCard },
  { href: '/kalendar', label: 'Kalendar', icon: Calendar },
  { href: '/tabungan', label: 'Tabungan', icon: Target },
  { href: '/evaluasi', label: 'Evaluasi Tahunan', icon: BarChart3 },
  { href: '/settings', label: 'Pengaturan', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<{ email: string; name: string; initial: string }>({
    email: 'Memuat...',
    name: 'Pengguna',
    initial: 'U',
  });

  useEffect(() => {
    setMounted(true);
    const fetchProfile = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const email = user.email || '';
        const name = user.user_metadata?.full_name || email.split('@')[0] || 'Pengguna';
        setProfile({
          email,
          name,
          initial: name.charAt(0).toUpperCase(),
        });
      }
    };
    fetchProfile();
  }, []);

  // Tutup sidebar mobile tiap kali route berubah (berpindah halaman)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Top Header (hanya muncul di md:hidden) */}
      <div className="md:hidden fixed top-0 w-full z-40 h-14 bg-card border-b border-border flex items-center justify-between px-4 shadow-sm">
         <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-glow">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <p className="font-bold text-foreground text-sm leading-none">Keuangan</p>
         </div>
         <button onClick={() => setIsOpen(true)} className="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors">
            <Menu className="w-6 h-6" />
         </button>
      </div>

      {/* Overlay Hitam saat Sidebar terbuka di Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Utama (Fixed) */}
      <aside className={cn(
        "fixed left-0 top-0 h-full w-64 bg-card border-r border-border flex flex-col z-50 transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
        "md:translate-x-0 md:shadow-none" // di desktop selalu muncul
      )}>
        {/* Logo & Close Button (Mobile) */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-glow">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm leading-none">Keuangan</p>
              <p className="text-muted-foreground text-xs mt-0.5">Manajemen Finansial</p>
            </div>
          </Link>
          <button onClick={() => setIsOpen(false)} className="md:hidden p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto no-scrollbar">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn('nav-item', isActive && 'active')}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight className="w-3 h-3 opacity-60" />}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center border border-primary-500/30">
              <span className="text-xs font-semibold text-primary-500">{profile.initial}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{profile.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{profile.email}</p>
            </div>
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-1.5 shrink-0 hover:bg-muted text-muted-foreground rounded-md transition-colors"
                title="Ganti Tema"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
            <button 
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                window.location.href = '/login';
              }}
              className="p-1.5 shrink-0 hover:bg-muted text-muted-foreground hover:text-red-500 rounded-md transition-colors"
              title="Keluar (Logout)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
