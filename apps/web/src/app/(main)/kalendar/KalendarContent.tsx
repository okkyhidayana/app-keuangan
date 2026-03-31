'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, CalendarHeart } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

export function KalendarContent() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        const { data: txs } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate)
          .order('transaction_date', { ascending: false });

        if (txs) setTransactions(txs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [year, month]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;

  // Group by exact date
  const grouped: Record<string, any[]> = {};
  transactions.forEach(t => {
     const dateStr = t.transaction_date.split('T')[0];
     if (!grouped[dateStr]) grouped[dateStr] = [];
     grouped[dateStr].push(t);
  });

  const dates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kalendar Transaksi & Aktivitas</h1>
          <p className="text-muted-foreground text-sm mt-1">Timeline riwayat keluar-masuk uang Anda berdasarkan hari</p>
        </div>
        <div className="flex items-center gap-2">
           <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="bg-card border border-border rounded-lg px-3 py-2 text-sm font-medium focus:ring-primary-500">
             {Array.from({length: 12}, (_, i) => (<option key={i+1} value={i+1}>{new Date(2000, i, 1).toLocaleDateString('id-ID', { month: 'long' })}</option>))}
           </select>
           <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-card border border-border rounded-lg px-3 py-2 text-sm font-medium inline-block w-24 focus:ring-primary-500">
             {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
           </select>
        </div>
      </div>

      {dates.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 card-premium text-center border-dashed">
          <CalendarHeart className="w-12 h-12 text-muted-foreground mb-3 opacity-20" />
          <p className="text-sm font-medium text-foreground">Kalendar keuangan masih kosong.</p>
          <p className="text-xs text-muted-foreground mt-1">Catat jurnal harian Anda di modul Budgeting.</p>
        </div>
      ) : (
        <div className="space-y-6 max-w-3xl">
          {dates.map(date => {
            const dailyTxs = grouped[date];
            const dObj = new Date(date);
            const totalOut = dailyTxs.filter(t => t.category !== 'PENDAPATAN').reduce((s, t) => s + Number(t.amount), 0);
            const totalIn = dailyTxs.filter(t => t.category === 'PENDAPATAN').reduce((s, t) => s + Number(t.amount), 0);
            
            return (
              <div key={date} className="flex gap-4 group">
                {/* Date Bubble */}
                <div className="flex flex-col items-center shrink-0 w-16">
                  <div className="w-12 h-12 rounded-full bg-primary-500/10 text-primary-600 flex flex-col items-center justify-center border border-primary-500/20 group-hover:bg-primary-500 group-hover:text-white transition-colors shadow-sm">
                    <span className="text-[10px] font-bold uppercase leading-none">{dObj.toLocaleDateString('id-ID', { weekday: 'short' })}</span>
                    <span className="text-lg font-bold font-numeric leading-tight">{dObj.getDate()}</span>
                  </div>
                  <div className="w-px h-full bg-border/50 mt-2" />
                </div>
                
                {/* Daily Cards */}
                <div className="flex-1 pb-6">
                  <div className="flex items-center gap-3 mb-3">
                     {totalIn > 0 && <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-numeric">Masuk: {formatRupiah(totalIn)}</span>}
                     {totalOut > 0 && <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded font-numeric">Keluar: {formatRupiah(totalOut)}</span>}
                  </div>
                  
                  <div className="space-y-2">
                    {dailyTxs.map(tx => (
                      <div key={tx.id} className="card-premium p-4 flex justify-between items-center group/card hover:border-border transition-colors">
                        <div>
                           <p className="text-sm font-bold text-foreground">{tx.subcategory || 'Tanpa Kategori'}</p>
                           <p className="text-xs text-muted-foreground mt-0.5">{tx.description || '-'}</p>
                        </div>
                        <p className={`text-base font-bold font-numeric ${tx.category === 'PENDAPATAN' ? 'text-emerald-500' : 'text-foreground'}`}>
                           {tx.category === 'PENDAPATAN' ? '+' : '-'}{formatRupiah(tx.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
