'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, PiggyBank, Target, ArrowUpRight } from 'lucide-react';
import { formatRupiah, formatRupiahCompact, formatPercent } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function TabunganContent() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [year] = useState(new Date().getFullYear());

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch savings envelopes
        const { data: envs } = await supabase
          .from('budget_items')
          .select('*')
          .eq('user_id', user.id)
          .eq('category', 'TABUNGAN_INVESTASI');

        if (envs) setItems(envs);

        // Fetch all transactions across the year relating to savings
        const { data: txs } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('category', 'TABUNGAN_INVESTASI')
          .gte('transaction_date', `${year}-01-01`)
          .lte('transaction_date', `${year}-12-31`);

        if (txs) setTransactions(txs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [year]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;

  // Aggregate Data
  const savingsProgress = items.map(item => {
    const matchedTxs = transactions.filter(t => t.subcategory === item.name);
    const accumulated = matchedTxs.reduce((s, t) => s + Number(t.amount), 0);
    // Asumsikan item.amount adalah target bulanan, 
    // jika ingin target tahunan * 12
    const targetTahunan = Number(item.amount) * 12;
    return {
      ...item,
      accumulated,
      targetTahunan,
      pct: targetTahunan > 0 ? (accumulated / targetTahunan) : 0
    };
  });

  const totalAccumulated = savingsProgress.reduce((s, item) => s + item.accumulated, 0);
  const totalTargetTahunan = savingsProgress.reduce((s, item) => s + item.targetTahunan, 0);

  // Group by month for Area Chart
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const chartData = months.map((m, idx) => {
    const txsInMonth = transactions.filter(t => {
      const dt = new Date(t.transaction_date);
      return dt.getMonth() === idx;
    });
    return {
      bulan: m,
      total: txsInMonth.reduce((s, t) => s + Number(t.amount), 0)
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Kinerja Tabungan & Investasi</h1>
        <p className="text-muted-foreground text-sm mt-1">Pantau perkembangan seluruh aset celengan Anda di tahun {year}</p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 card-premium text-center border-dashed">
          <PiggyBank className="w-12 h-12 text-muted-foreground mb-3 opacity-20" />
          <p className="text-sm font-medium text-foreground">Belum ada amplop tabungan.</p>
          <p className="text-xs text-muted-foreground mt-1">Buat Target Celengan di fitur Budgeting &gt; Amplop Master.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <div className="card-premium p-6 border border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="w-5 h-5 text-emerald-500" />
                <h2 className="text-sm font-bold uppercase text-emerald-700">Total Terkumpul ({year})</h2>
              </div>
              <p className="text-3xl font-bold font-numeric text-emerald-600">{formatRupiah(totalAccumulated)}</p>
              <div className="flex items-center justify-between mt-4 mb-2 text-xs">
                 <span className="text-muted-foreground">Target Tahunan: {formatRupiahCompact(totalTargetTahunan)}</span>
                 <span className="font-bold text-emerald-600 font-numeric">{formatPercent(totalTargetTahunan > 0 ? totalAccumulated/totalTargetTahunan : 0)}</span>
              </div>
              <div className="h-2 w-full bg-emerald-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all rounded-full" style={{ width: `${Math.min(100, totalTargetTahunan > 0 ? (totalAccumulated/totalTargetTahunan)*100 : 0)}%` }} />
              </div>
            </div>

            <div className="card-premium p-5">
              <h2 className="text-sm font-bold mb-4 flex items-center gap-2 text-primary-600">
                 <Target className="w-4 h-4" /> Realisasi per Amplop
              </h2>
              <div className="space-y-4">
                 {savingsProgress.map(item => (
                   <div key={item.id}>
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold">{item.name}</span>
                        <span className="text-[10px] font-numeric text-muted-foreground">{formatRupiahCompact(item.accumulated)} / {formatRupiahCompact(item.targetTahunan)}</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary-500 rounded-full" style={{ width: `${Math.min(100, item.pct * 100)}%` }} />
                       </div>
                       <span className="text-[9px] font-numeric font-bold text-primary-600 w-8 text-right">{formatPercent(item.pct)}</span>
                     </div>
                   </div>
                 ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
             <div className="card-premium p-6 h-full min-h-[300px] flex flex-col">
               <h2 className="text-sm font-bold mb-6 flex items-center gap-2">
                 <ArrowUpRight className="w-4 h-4 text-emerald-500" /> Grafik Pertumbuhan Setoran Tabungan
               </h2>
               <div className="flex-1 w-full min-h-[250px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="tabGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3ecf8e" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#3ecf8e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(v) => formatRupiahCompact(v)} width={60} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v: number) => formatRupiah(v)} />
                      <Area type="monotone" dataKey="total" stroke="#3ecf8e" strokeWidth={3} fill="url(#tabGrad)" />
                    </AreaChart>
                 </ResponsiveContainer>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
