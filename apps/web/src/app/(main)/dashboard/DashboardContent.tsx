'use client';

import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Plus, Zap } from 'lucide-react';
import Link from 'next/link';
import { formatRupiah, formatRupiahCompact, formatPercent, getStatusColor } from '@/lib/utils';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';

// ── Batas state awal (0 / kosong) ──
const demoNetWorth = {
  current: 0,
  previous: 0,
  growth: 0,
  totalAssets: 0,
  totalDebts: 0,
};

const demoNetWorthHistory: any[] = [];

const demoCashFlow = {
  totalMasuk: 0,
  totalKeluar: 0,
  surplus: 0,
};

const demoCheckup = [
  { name: 'Dana Darurat', value: 0, max: 1, status: 'warning' as const },
  { name: 'Arus Kas', value: 0, max: 1, status: 'warning' as const },
  { name: 'Rasio Cicilan', value: 0, max: 1, status: 'warning' as const },
  { name: 'Investasi', value: 0, max: 1, status: 'warning' as const },
  { name: 'Biaya Hidup', value: 0, max: 1, status: 'warning' as const },
  { name: 'Solvabilitas', value: 0, max: 1, status: 'warning' as const },
];

const demoSavings: any[] = [];
const demoBudget: any[] = [];
const demoTransactions: any[] = [];

// ── Custom Tooltip ──
function CustomTooltip({ active, payload }: { active?: boolean; payload?: { value: number }[] }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-card text-xs">
        <p className="font-numeric font-medium">{formatRupiah(payload[0].value)}</p>
      </div>
    );
  }
  return null;
}

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2 } from 'lucide-react';

export function DashboardContent() {
  const [loading, setLoading] = useState(true);
  const [netWorth, setNetWorth] = useState(demoNetWorth);
  const [netWorthHistory, setNetWorthHistory] = useState(demoNetWorthHistory);
  const [cashFlow, setCashFlow] = useState(demoCashFlow);
  const [transactions, setTransactions] = useState(demoTransactions);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch Net Worth Snapshots
        const { data: snapshots } = await supabase
          .from('net_worth_snapshots')
          .select('*')
          .eq('user_id', user.id)
          .order('snapshot_date', { ascending: true })
          .limit(6);

        // Fetch Cashflow
        const { data: cashflows } = await supabase
          .from('cashflow_items')
          .select('*')
          .eq('user_id', user.id);

        if (snapshots && snapshots.length > 0) {
           const latest = snapshots[snapshots.length - 1];
           const currentNW = Number(latest.net_worth);
           const totalAssets = Number(latest.total_assets);
           const totalDebts = Number(latest.total_debts);
           
           let previousNW = currentNW;
           if (snapshots.length > 1) {
             previousNW = Number(snapshots[snapshots.length - 2].net_worth);
           }
           
           const history = snapshots.map(s => ({
             bulan: new Date(s.snapshot_date).toLocaleDateString('id-ID', { month: 'short' }),
             netWorth: Number(s.net_worth)
           }));

           setNetWorth({
             current: currentNW,
             previous: previousNW,
             growth: previousNW > 0 ? (currentNW - previousNW) / previousNW : 0,
             totalAssets,
             totalDebts
           });
           setNetWorthHistory(history);
        }

        if (cashflows && cashflows.length > 0) {
           let totalMasuk = 0;
           let totalKeluar = 0;
           const recentTxs: any[] = [];
           cashflows.forEach(cf => {
             const amt = Number(cf.amount);
             if (cf.direction === 'masuk') totalMasuk += amt;
             else totalKeluar += amt;

             // Populate dummy recent transactions from cashflow table for now
             recentTxs.push({
               name: cf.name,
               amount: cf.direction === 'masuk' ? amt : -amt,
               category: cf.category,
               date: new Date(cf.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
             });
           });
           setCashFlow({
             totalMasuk,
             totalKeluar,
             surplus: totalMasuk - totalKeluar
           });
           setTransactions(recentTxs.slice(0, 5));
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const isPositiveCashFlow = cashFlow.surplus >= 0;
  const isPositiveGrowth = netWorth.growth >= 0;

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gambaran keuangan Anda — April 2026
          </p>
        </div>
        <Link
          href="/budgeting"
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-glow"
        >
          <Plus className="w-4 h-4" />
          Tambah Transaksi
        </Link>
      </div>

      {/* ── Row 1: KPI Cards ── */}
      <div className="grid grid-cols-3 gap-4">
        {/* Net Worth */}
        <div className="card-premium p-5 col-span-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground font-medium">Net Worth</p>
            <span className={`flex items-center gap-1 text-xs font-medium ${isPositiveGrowth ? 'text-emerald-600' : 'text-red-500'}`}>
              {isPositiveGrowth ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {formatPercent(Math.abs(netWorth.growth))}
            </span>
          </div>
          <p className="text-2xl font-bold font-numeric text-foreground">
            {formatRupiahCompact(netWorth.current)}
          </p>
          <div className="mt-3 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={netWorthHistory}>
                <defs>
                  <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#635bff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#635bff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="netWorth" stroke="#635bff" strokeWidth={2} fill="url(#nwGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Aset: <span className="text-emerald-600 font-medium">{formatRupiahCompact(netWorth.totalAssets)}</span></span>
            <span>Utang: <span className="text-red-500 font-medium">{formatRupiahCompact(netWorth.totalDebts)}</span></span>
          </div>
        </div>

        {/* Arus Kas */}
        <div className="card-premium p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground font-medium">Arus Kas Bulan Ini</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isPositiveCashFlow ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {isPositiveCashFlow ? 'Surplus' : 'Defisit'}
            </span>
          </div>
          <p className={`text-2xl font-bold font-numeric ${isPositiveCashFlow ? 'amount-positive' : 'amount-negative'}`}>
            {isPositiveCashFlow ? '+' : ''}{formatRupiah(cashFlow.surplus)}
          </p>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Kas Masuk
              </span>
              <span className="font-numeric font-medium text-emerald-600">{formatRupiah(cashFlow.totalMasuk)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                Kas Keluar
              </span>
              <span className="font-numeric font-medium text-red-500">{formatRupiah(cashFlow.totalKeluar)}</span>
            </div>
          </div>
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-emerald-500 rounded-full"
              style={{ width: `${Math.min(100, (cashFlow.totalKeluar / (cashFlow.totalMasuk || 1)) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 text-right">
            {formatPercent(cashFlow.totalMasuk > 0 ? (cashFlow.totalKeluar / cashFlow.totalMasuk) : 0)} dari pemasukan
          </p>
        </div>

        {/* Checkup Score (Radar Preview) */}
        <div className="card-premium p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-muted-foreground font-medium">Checkup Keuangan</p>
            <Link href="/checkup" className="text-xs text-primary-500 hover:underline">Lihat detail →</Link>
          </div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={demoCheckup}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <Radar name="Rasio" dataKey="value" stroke="#635bff" fill="#635bff" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4 mt-1">
            {['sehat', 'warning', 'bahaya'].map((s) => (
              <span key={s} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ background: getStatusColor(s as 'sehat' | 'warning' | 'bahaya') }} />
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 2: Savings Goals + Recent Transactions ── */}
      <div className="grid grid-cols-3 gap-4">
        {/* Savings Goals */}
        <div className="card-premium p-5 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Target Tabungan</h2>
            <Link href="/tabungan" className="text-xs text-primary-500 hover:underline">Kelola →</Link>
          </div>
          <div className="space-y-4">
            {demoSavings.map((goal) => (
              <div key={goal.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-medium text-foreground">{goal.name}</p>
                  <div className="text-right">
                    <p className="text-xs font-numeric font-semibold" style={{ color: goal.color }}>
                      {formatRupiah(goal.saved)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">dari {formatRupiah(goal.target)}</p>
                  </div>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${goal.progress}%`, background: goal.color }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{goal.progress}% tercapai</p>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Bills */}
        <div className="card-premium p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Tagihan Mendatang</h2>
            <Link href="/pembayaran" className="text-xs text-primary-500 hover:underline">Lihat →</Link>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Cicilan Mobil', due: '5 Apr', amount: 4_000_000, urgent: true },
              { name: 'BPJS Kesehatan', due: '10 Apr', amount: 150_000, urgent: false },
              { name: 'Internet', due: '15 Apr', amount: 200_000, urgent: false },
              { name: 'Kartu Kredit', due: '20 Apr', amount: 2_000_000, urgent: false },
            ].map((bill) => (
              <div key={bill.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${bill.urgent ? 'bg-red-400' : 'bg-muted-foreground'}`} />
                  <div>
                    <p className="text-xs font-medium text-foreground">{bill.name}</p>
                    <p className="text-[10px] text-muted-foreground">{bill.due}</p>
                  </div>
                </div>
                <p className="text-xs font-numeric font-medium text-foreground">{formatRupiah(bill.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 3: Budget + Recent Transactions ── */}
      <div className="grid grid-cols-3 gap-4">
        {/* Budget Tracking */}
        <div className="card-premium p-5 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Budget April 2026</h2>
            <Link href="/budgeting" className="text-xs text-primary-500 hover:underline">Detail →</Link>
          </div>
          <div className="space-y-3">
            {demoBudget.map((item) => (
              <div key={item.category}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                    <p className="text-xs font-medium text-foreground">{item.category}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">Rencana: {formatRupiahCompact(item.planned)}</span>
                    <span className="font-numeric font-semibold" style={{ color: item.color }}>
                      {formatRupiahCompact(item.actual)}
                    </span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${Math.min(100, (item.actual / item.planned) * 100)}%`,
                      background: item.actual > item.planned ? '#ef4444' : item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card-premium p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Transaksi Terbaru</h2>
            <Link href="/budgeting" className="text-xs text-primary-500 hover:underline">Semua →</Link>
          </div>
          <div className="space-y-3">
            {transactions.map((tx, i) => {
              const isIncome = tx.amount > 0;
              return (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{tx.name}</p>
                    <p className="text-[10px] text-muted-foreground">{tx.date}</p>
                  </div>
                  <p className={`text-xs font-numeric font-semibold ml-2 ${isIncome ? 'amount-positive' : 'amount-negative'}`}>
                    {isIncome ? '+' : ''}{formatRupiah(tx.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Net Worth', href: '/net-worth', icon: '💰', desc: 'Update aset & utang' },
          { label: 'Arus Kas', href: '/arus-kas', icon: '💸', desc: 'Cek surplus/defisit' },
          { label: 'Simulasi KPR', href: '/kpr', icon: '🏠', desc: 'Hitung cicilan KPR' },
          { label: 'Checkup', href: '/checkup', icon: '🏥', desc: '6 rasio kesehatan' },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="card-premium p-4 flex items-center gap-3 hover:border-primary-500/40 group"
          >
            <span className="text-2xl">{action.icon}</span>
            <div>
              <p className="text-sm font-semibold text-foreground group-hover:text-primary-500 transition-colors">
                {action.label}
              </p>
              <p className="text-xs text-muted-foreground">{action.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
