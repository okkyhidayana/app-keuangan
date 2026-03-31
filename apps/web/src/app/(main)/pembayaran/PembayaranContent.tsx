'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, CalendarHeart, CheckCircle2, XCircle } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

export function PembayaranContent() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch master envelopes for Bills and Debts
        const { data: envs } = await supabase
          .from('budget_items')
          .select('*')
          .eq('user_id', user.id)
          .in('category', ['TAGIHAN', 'HUTANG']);

        if (envs) setItems(envs);

        // Fetch transactions for the selected month to check if paid
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];
        
        const { data: txs } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .in('category', ['TAGIHAN', 'HUTANG'])
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate);

        if (txs) setTransactions(txs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [year, month]);

  if (loading && items.length === 0) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
  }

  const bills = items.filter(i => i.category === 'TAGIHAN');
  const debts = items.filter(i => i.category === 'HUTANG');

  const checkStatus = (itemName: string, target: number) => {
    const matchedTxs = transactions.filter(t => t.subcategory === itemName);
    const paid = matchedTxs.reduce((s, t) => s + Number(t.amount), 0);
    return { paid, isFullyPaid: paid >= target, target };
  };

  const renderList = (list: any[], title: string, colorClass: string, bgClass: string) => {
    if (list.length === 0) return null;
    
    // Hitung status lunas / blm lunas agregat
    let totalTarget = 0;
    let totalPaid = 0;
    
    const enrichedList = list.map(item => {
      const s = checkStatus(item.name, Number(item.amount));
      totalTarget += s.target;
      totalPaid += s.paid;
      return { ...item, ...s };
    });

    return (
      <div className={`card-premium overflow-hidden border ${bgClass}`}>
        <div className="bg-background/80 backdrop-blur-sm px-5 py-4 flex justify-between items-center border-b border-border/50">
           <div>
             <h3 className={`font-bold ${colorClass} uppercase tracking-wide`}>{title}</h3>
             <p className="text-xs text-muted-foreground mt-0.5">Terkumpul: {formatRupiah(totalPaid)} / {formatRupiah(totalTarget)}</p>
           </div>
           {totalPaid >= totalTarget && totalTarget > 0 && <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Lunas</span>}
        </div>
        <div className="divide-y divide-border/30 bg-card">
           {enrichedList.map(item => (
             <div key={item.id} className="p-4 flex items-center justify-between hover:bg-muted/10">
               <div>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                     {item.isFullyPaid ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-muted-foreground" />} 
                     {item.name}
                  </p>
               </div>
               <div className="text-right">
                  <p className={`text-sm font-numeric font-bold ${item.isFullyPaid ? 'text-emerald-600' : 'text-foreground'}`}>
                    {formatRupiah(item.paid)}
                  </p>
                  <p className="text-[10px] font-numeric text-muted-foreground">Target: {formatRupiah(item.target)}</p>
               </div>
             </div>
           ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kalendar Pembayaran</h1>
          <p className="text-muted-foreground text-sm mt-1">Ceklis otomatis tagihan dan cicilan hutang yang harus dibayar bulan ini</p>
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

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 card-premium text-center border-dashed">
          <CalendarHeart className="w-12 h-12 text-muted-foreground mb-3 opacity-20" />
          <p className="text-sm font-medium text-foreground">Belum ada kewajiban pembayaran.</p>
          <p className="text-xs text-muted-foreground mt-1">Tambahkan Tagihan & Cicilan Hutang di fitur Budgeting &gt; Amplop Master.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {renderList(bills, 'Tagihan Berbayar', 'text-amber-600', 'border-amber-500/20')}
           {renderList(debts, 'Cicilan Hutang', 'text-red-500', 'border-red-500/20')}
        </div>
      )}
    </div>
  );
}
