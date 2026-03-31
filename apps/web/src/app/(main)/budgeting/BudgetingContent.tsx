'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Loader2, ArrowRightLeft, Target, Wallet, CalendarDays } from 'lucide-react';
import { formatRupiah, formatRupiahCompact, formatPercent } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';

const CATEGORY_LABELS: Record<string, string> = {
  PENDAPATAN: 'Pendapatan',
  TABUNGAN_INVESTASI: 'Tabungan & Investasi',
  TAGIHAN: 'Tagihan Berbayar',
  BIAYA_OPERASIONAL: 'Biaya Operasional Harian',
  HUTANG: 'Pelunasan Hutang',
};

const CATEGORY_COLORS: Record<string, string> = {
  PENDAPATAN: '#3ecf8e',
  TABUNGAN_INVESTASI: '#635bff',
  TAGIHAN: '#f5a623',
  BIAYA_OPERASIONAL: '#06b6d4',
  HUTANG: '#ef4444',
};

export function BudgetingContent() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  
  const [budgetItems, setBudgetItems] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'ringkasan' | 'amplop' | 'transaksi'>('ringkasan');
  
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemForm, setItemForm] = useState({ name: '', category: 'BIAYA_OPERASIONAL', amount: 0 });

  const [showTxModal, setShowTxModal] = useState(false);
  const [editingTx, setEditingTx] = useState<any | null>(null);
  const [txForm, setTxForm] = useState({ transaction_date: new Date().toISOString().split('T')[0], category: 'BIAYA_OPERASIONAL', subcategory: '', amount: 0, description: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Fetch budget items (master envelopes)
      const { data: itemsData } = await supabase.from('budget_items').select('*').order('created_at', { ascending: true });
      if (itemsData) setBudgetItems(itemsData);

      // Fetch transactions for selected month/year
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // last day of month
      
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: false });
        
      if (txData) setTransactions(txData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const saveBudgetItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    if (editingItem) {
      await supabase.from('budget_items').update({
        name: itemForm.name, category: itemForm.category, amount: itemForm.amount
      }).eq('id', editingItem.id);
    } else {
      await supabase.from('budget_items').insert({
        user_id: userId, name: itemForm.name, category: itemForm.category, amount: itemForm.amount
      });
    }
    setShowItemModal(false);
    fetchData();
  };

  const deleteBudgetItem = async (id: string) => {
    if (!confirm('Hapus Amplop Anggaran ini? Transaksi yang memakai sub-kategori ini mungkin akan kehilangan referensi nama amplopnya.')) return;
    const supabase = createClient();
    await supabase.from('budget_items').delete().eq('id', id);
    fetchData();
  };

  const saveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    // In order for negative/positive signs to be correct: Tabungan/Tagihan/Biaya/Hutang are positive expenses mathematically in the input, but we might want PENDAPATAN to be income.
    // The DB `amount` is just absolute, the `category` dictates if it's income or expense.
    if (editingTx) {
      await supabase.from('transactions').update({
        transaction_date: txForm.transaction_date,
        category: txForm.category,
        subcategory: txForm.subcategory,
        amount: txForm.amount,
        description: txForm.description
      }).eq('id', editingTx.id);
    } else {
      await supabase.from('transactions').insert({
        user_id: userId,
        transaction_date: txForm.transaction_date,
        category: txForm.category,
        subcategory: txForm.subcategory,
        amount: txForm.amount,
        description: txForm.description
      });
    }
    setShowTxModal(false);
    fetchData();
  };

  const deleteTransaction = async (id: string) => {
    if (!confirm('Hapus Transaksi Harian ini?')) return;
    const supabase = createClient();
    await supabase.from('transactions').delete().eq('id', id);
    fetchData();
  };

  // ── Calculated View Data ──
  const summaryByCategory = Object.keys(CATEGORY_LABELS).map(catKey => {
    const plannedItems = budgetItems.filter(i => i.category === catKey);
    const totalPlanned = plannedItems.reduce((s, i) => s + Number(i.amount), 0);
    
    const actualTxs = transactions.filter(t => t.category === catKey);
    const totalActual = actualTxs.reduce((s, t) => s + Number(t.amount), 0);

    return {
      catKey,
      label: CATEGORY_LABELS[catKey],
      color: CATEGORY_COLORS[catKey],
      totalPlanned,
      totalActual,
      plannedItems: plannedItems.map(pi => {
        const matchingTxs = actualTxs.filter(t => t.subcategory === pi.name);
        const actual = matchingTxs.reduce((s, t) => s + Number(t.amount), 0);
        return {
           id: pi.id,
           name: pi.name,
           planned: Number(pi.amount),
           actual
        };
      })
    };
  });

  const totalIncomePlanned = summaryByCategory.find(s => s.catKey === 'PENDAPATAN')?.totalPlanned || 0;
  const totalIncomeActual = summaryByCategory.find(s => s.catKey === 'PENDAPATAN')?.totalActual || 0;
  
  const totalExpensePlanned = summaryByCategory.filter(s => s.catKey !== 'PENDAPATAN').reduce((s, g) => s + g.totalPlanned, 0);
  const totalExpenseActual = summaryByCategory.filter(s => s.catKey !== 'PENDAPATAN').reduce((s, g) => s + g.totalActual, 0);

  const budgetRemaining = totalExpensePlanned - totalExpenseActual;
  const isOverbudget = totalExpenseActual > totalExpensePlanned;

  if (loading && budgetItems.length === 0) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Budgeting Harian (Amplop)</h1>
          <p className="text-muted-foreground text-sm mt-1">Sistem amplop digital: Rencanakan, Catat, dan Evaluasi</p>
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

      {/* Tabs */}
      <div className="card-premium">
        <div className="flex border-b border-border overflow-x-auto no-scrollbar">
          {[
            { key: 'ringkasan', icon: <Target className="w-4 h-4" />, label: '📊 Evaluasi Budget vs Realisasi' },
            { key: 'transaksi', icon: <ArrowRightLeft className="w-4 h-4" />, label: '📝 Jurnal Harian (Catat Pengeluaran)' },
            { key: 'amplop', icon: <Wallet className="w-4 h-4" />, label: '⚙️ Setup Amplop Master' }
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === t.key ? 'text-primary-500 border-b-2 border-primary-500 bg-primary-500/5' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="p-0 sm:p-5">
          {/* TAB 1: RINGKASAN */}
          {activeTab === 'ringkasan' && (
             <div className="space-y-6 p-4 sm:p-0">
               {/* KPI Rencana Vs Realita */}
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="card-premium p-4 border-emerald-500/20 bg-emerald-500/5">
                   <p className="text-xs text-muted-foreground font-medium mb-1">Total Pemasukan (Aktual)</p>
                   <p className="text-xl font-bold font-numeric text-emerald-600">{formatRupiahCompact(totalIncomeActual)} <span className="text-xs text-muted-foreground font-normal">/ {formatRupiahCompact(totalIncomePlanned)}</span></p>
                 </div>
                 <div className="card-premium p-4">
                   <p className="text-xs text-muted-foreground font-medium mb-1">Total Pengeluaran (Aktual)</p>
                   <p className="text-xl font-bold font-numeric text-foreground">{formatRupiahCompact(totalExpenseActual)} <span className="text-xs text-muted-foreground font-normal">/ {formatRupiahCompact(totalExpensePlanned)}</span></p>
                 </div>
                 <div className={`card-premium p-4 ${isOverbudget ? 'border-red-500/30 bg-red-500/5' : ''}`}>
                   <p className="text-xs text-muted-foreground font-medium mb-1">Sisa Anggaran Tersedia</p>
                   <p className={`text-xl font-bold font-numeric ${isOverbudget ? 'text-red-500' : 'text-primary-500'}`}>
                     {isOverbudget ? '-' : ''}{formatRupiahCompact(Math.abs(budgetRemaining))}
                     {isOverbudget && <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-red-100 text-red-600">Overbudget</span>}
                   </p>
                 </div>
                 <div className="card-premium p-4">
                   <p className="text-xs text-muted-foreground font-medium mb-1">% Pemakaian Anggaran</p>
                   <div className="flex items-center gap-2 mt-1">
                     <p className={`text-xl font-bold font-numeric ${totalExpensePlanned > 0 && totalExpenseActual/totalExpensePlanned > 0.9 ? 'text-red-500' : 'text-foreground'}`}>
                       {formatPercent(totalExpensePlanned > 0 ? totalExpenseActual/totalExpensePlanned : 0)}
                     </p>
                     <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                       <div className={`h-full ${isOverbudget ? 'bg-red-500' : 'bg-primary-500'}`} style={{ width: `${Math.min(100, totalExpensePlanned > 0 ? (totalExpenseActual/totalExpensePlanned)*100 : 0)}%` }} />
                     </div>
                   </div>
                 </div>
               </div>

               {/* Envelope Bars */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {summaryByCategory.map((group) => {
                   if (group.plannedItems.length === 0 && group.totalActual === 0) return null; // Skip empty groups
                   return (
                     <div key={group.catKey} className="card-premium p-5 border border-border/50 shadow-sm">
                       <h3 className="text-sm font-bold uppercase tracking-wide flex items-center justify-between mb-4 border-b border-border/50 pb-2">
                         <div className="flex items-center gap-2">
                           <span className="w-2.5 h-2.5 rounded-full" style={{ background: group.color }} />
                           <span style={{ color: group.color }}>{group.label}</span>
                         </div>
                         <span className="font-numeric">{formatRupiahCompact(group.totalActual)} / {formatRupiahCompact(group.totalPlanned)}</span>
                       </h3>
                       <div className="space-y-4">
                         {group.plannedItems.map(item => {
                           const pct = item.planned > 0 ? (item.actual / item.planned) : (item.actual > 0 ? 1 : 0);
                           const isOver = item.actual > item.planned;
                           return (
                             <div key={item.id} className="group/item">
                               <div className="flex justify-between items-end mb-1">
                                 <p className="text-sm font-medium text-foreground">{item.name}</p>
                                 <p className="text-xs font-numeric font-medium">
                                   <span className={isOver ? (group.catKey === 'PENDAPATAN' ? 'text-emerald-500' : 'text-red-500') : 'text-foreground'}>{formatRupiah(item.actual)}</span>
                                   <span className="text-muted-foreground"> / {formatRupiahCompact(item.planned)}</span>
                                 </p>
                               </div>
                               <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden relative">
                                 <div 
                                   className={`absolute left-0 top-0 h-full rounded-full transition-all`} 
                                   style={{ 
                                     width: `${Math.min(100, pct * 100)}%`, 
                                     backgroundColor: isOver && group.catKey !== 'PENDAPATAN' ? '#ef4444' : group.color 
                                   }} 
                                 />
                               </div>
                               {isOver && group.catKey !== 'PENDAPATAN' && (
                                 <p className="text-[10px] text-red-500 text-right mt-1 font-medium italic animate-pulse">Melebihi jatah {formatRupiah(item.actual - item.planned)}</p>
                               )}
                             </div>
                           );
                         })}
                         {/* Show unmapped transactions if any */}
                         {transactions.filter(t => t.category === group.catKey && !group.plannedItems.find(p => p.name === t.subcategory)).length > 0 && (
                           <div className="mt-3 bg-red-50/50 p-2 rounded border border-red-100 border-dashed">
                             <p className="text-xs text-red-600 font-medium mb-1">⚠️ Transaksi Tanpa Amplop Induk (Bocor)</p>
                               <p className="text-lg font-bold text-red-600 font-numeric">{group.catKey === 'PENDAPATAN' ? '+' : '-'}{formatRupiahCompact(transactions.filter(t => t.category === group.catKey && !group.plannedItems.find(p => p.name === t.subcategory)).reduce((s,t) => s + Number(t.amount), 0))}</p>
                           </div>
                         )}
                       </div>
                     </div>
                   );
                 })}
               </div>
             </div>
          )}

          {/* TAB 2: TRANSAKSI HARIAN */}
          {activeTab === 'transaksi' && (
             <div className="space-y-4 p-4 sm:p-0">
               <div className="flex justify-between items-center mb-6">
                 <div>
                   <h2 className="text-base font-bold text-foreground">Buku Jurnal</h2>
                   <p className="text-xs text-muted-foreground">Catat setiap uang yang masuk atau keluar di bulan ini.</p>
                 </div>
                 <button 
                   onClick={() => {
                     setEditingTx(null);
                     setTxForm({ transaction_date: new Date().toISOString().split('T')[0], category: 'BIAYA_OPERASIONAL', subcategory: budgetItems.find(i => i.category === 'BIAYA_OPERASIONAL')?.name || '', amount: 0, description: '' });
                     setShowTxModal(true);
                   }} 
                   className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-glow"
                 >
                   <Plus className="w-4 h-4" /> Catat Transaksi
                 </button>
               </div>

               {transactions.length === 0 ? (
                 <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-xl bg-muted/20">
                   <CalendarDays className="w-12 h-12 text-muted-foreground mb-3 opacity-20" />
                   <p className="text-sm font-medium text-foreground">Belum ada transaksi di bulan ini.</p>
                   <p className="text-xs text-muted-foreground mt-1">Mulai catat pengeluaran kopi pertama Anda!</p>
                 </div>
               ) : (
                 <div className="card-premium overflow-hidden">
                   <table className="w-full text-sm">
                     <thead>
                       <tr className="border-b border-border bg-muted/40">
                         <th className="py-3 px-4 text-left font-medium text-muted-foreground">Tanggal</th>
                         <th className="py-3 px-4 text-left font-medium text-muted-foreground">Amplop (Sub-Kategori)</th>
                         <th className="py-3 px-4 text-left font-medium text-muted-foreground">Keterangan</th>
                         <th className="py-3 px-4 text-right font-medium text-muted-foreground">Nominal / Amount</th>
                         <th className="py-3 px-4 text-center font-medium text-muted-foreground w-16">Aksi</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-border/60">
                       {transactions.map(t => (
                         <tr key={t.id} className="hover:bg-muted/30 transition-colors group">
                           <td className="py-3 px-4 tabular-nums text-foreground/80">{new Date(t.transaction_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</td>
                           <td className="py-3 px-4">
                             <div className="flex flex-col">
                               <span className="font-medium text-foreground">{t.subcategory || '-'}</span>
                               <span className="text-[10px] text-muted-foreground">{CATEGORY_LABELS[t.category]}</span>
                             </div>
                           </td>
                           <td className="py-3 px-4 text-foreground/80 break-words max-w-[200px]">{t.description || '-'}</td>
                           <td className={`py-3 px-4 text-right font-numeric font-semibold ${t.category === 'PENDAPATAN' ? 'text-emerald-500' : 'text-foreground'}`}>
                             {t.category === 'PENDAPATAN' ? '+' : '-'}{formatRupiah(t.amount)}
                           </td>
                           <td className="py-3 px-4">
                              <div className="flex gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingTx(t); setTxForm({ ...t, transaction_date: t.transaction_date.split('T')[0] }); setShowTxModal(true); }} className="p-1.5 text-muted-foreground hover:bg-muted rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => deleteTransaction(t.id)} className="p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}
             </div>
          )}

          {/* TAB 3: SETUP AMPLOP */}
          {activeTab === 'amplop' && (
             <div className="space-y-4 p-4 sm:p-0">
                <div className="flex justify-between items-center mb-6">
                 <div>
                   <h2 className="text-base font-bold text-foreground">Setup Induk Amplop Anggaran</h2>
                   <p className="text-xs text-muted-foreground">Definisikan rencana jatah (budget) ideal bulanan untuk semua kategori.</p>
                 </div>
                 <button 
                   onClick={() => {
                     setEditingItem(null);
                     setItemForm({ name: '', category: 'BIAYA_OPERASIONAL', amount: 0 });
                     setShowItemModal(true);
                   }} 
                   className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-glow border border-primary-500"
                 >
                   <Plus className="w-4 h-4" /> Bikin Amplop Baru
                 </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {Object.keys(CATEGORY_LABELS).map(catKey => {
                   const items = budgetItems.filter(i => i.category === catKey);
                   if (items.length === 0) return null;
                   
                   return (
                     <div key={catKey} className="card-premium overflow-hidden border border-border/60">
                       <div className="bg-muted/40 px-4 py-3 flex justify-between items-center border-b border-border">
                         <h3 className="text-xs font-bold uppercase" style={{ color: CATEGORY_COLORS[catKey] }}>{CATEGORY_LABELS[catKey]}</h3>
                         <p className="text-xs font-numeric font-bold bg-background px-2 py-0.5 rounded border border-border">{formatRupiahCompact(items.reduce((s, i) => s + Number(i.amount), 0))}</p>
                       </div>
                       <ul className="divide-y divide-border/60">
                         {items.map(item => (
                           <li key={item.id} className="px-4 py-3 flex justify-between items-center hover:bg-muted/20 group">
                             <div>
                               <p className="text-sm font-medium text-foreground">{item.name}</p>
                               <p className="text-[10px] text-muted-foreground font-numeric tracking-wide mt-0.5">TARGET: {formatRupiah(item.amount)}</p>
                             </div>
                             <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingItem(item); setItemForm(item); setShowItemModal(true); }} className="text-muted-foreground hover:text-primary-500"><Edit2 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => deleteBudgetItem(item.id)} className="text-muted-foreground hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                             </div>
                           </li>
                         ))}
                       </ul>
                     </div>
                   );
                 })}
               </div>
               
               {budgetItems.length === 0 && (
                 <div className="text-center py-10">
                   <p className="text-muted-foreground text-sm">Anda belum membuat amplop anggaran sama sekali.</p>
                   <button onClick={() => { setEditingItem(null); setItemForm({ name: '', category: 'BIAYA_OPERASIONAL', amount: 0 }); setShowItemModal(true); }} className="mt-3 text-sm text-primary-500 hover:underline">Buat Amplop Pertama 🪄</button>
                 </div>
               )}
             </div>
          )}
        </div>
      </div>

      {/* ── MODALS ── */}
      
      {/* 1. Modal Item (Amplop Master) */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">{editingItem ? 'Edit Target Amplop' : 'Bikin Amplop Master Baru'}</h3>
              <button onClick={() => setShowItemModal(false)} className="text-muted-foreground hover:bg-muted p-1 rounded-md"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={saveBudgetItem} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wide">Nama Amplop</label>
                <input required value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} type="text" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" placeholder="e.g. Belanja Bulanan, Listrik PLN, Nongkrong" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wide">Kategori Induk</label>
                <select value={itemForm.category} onChange={e => setItemForm({...itemForm, category: e.target.value})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500">
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wide">Rencana Saldo (Rp)</label>
                <input required min={0} value={itemForm.amount || ''} onChange={e => setItemForm({...itemForm, amount: Number(e.target.value)})} type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-numeric focus:ring-2 focus:ring-primary-500" />
                <p className="text-[10px] text-muted-foreground mt-1">Berapa budget ideal yang ingin Anda sisihkan sebulan untuk dompet ini?</p>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowItemModal(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg border border-transparent">Batal</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-glow">Simpan Master Amplop</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Transaksi (Jurnal) */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 bg-black/60 shadow-2xl flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-xl overflow-hidden animate-in fade-in zoom-in-95 border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-primary-500" />
                {editingTx ? 'Revisi Catatan Jurnal' : 'Input Catatan Transaksi Jurnal'}
              </h3>
              <button onClick={() => setShowTxModal(false)} className="text-muted-foreground hover:bg-muted/50 p-1.5 rounded-md transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={saveTransaction} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wide">Tanggal Transaksi</label>
                  <input required value={txForm.transaction_date} onChange={e => setTxForm({...txForm, transaction_date: e.target.value})} type="date" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wide">Sumber/Tujuan Amplop</label>
                  <select 
                    value={txForm.subcategory} 
                    onChange={e => {
                       const selectedName = e.target.value;
                       const matchedItem = budgetItems.find(i => i.name === selectedName);
                       setTxForm({...txForm, subcategory: selectedName, category: matchedItem ? matchedItem.category : 'BIAYA_OPERASIONAL' });
                    }} 
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="" disabled>-- Pilih Amplop --</option>
                    {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => {
                       const options = budgetItems.filter(i => i.category === catKey);
                       if (options.length === 0) return null;
                       return (
                         <optgroup key={catKey} label={catLabel.toUpperCase()}>
                           {options.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
                         </optgroup>
                       );
                    })}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wide">Nominal Mutasi (Rp)</label>
                  <input required min={0} value={txForm.amount || ''} onChange={e => setTxForm({...txForm, amount: Number(e.target.value)})} type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm font-numeric font-bold focus:ring-2 focus:ring-primary-500 placeholder:font-normal" placeholder="150000" />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wide">Keterangan / Catatan Pendek</label>
                  <input value={txForm.description} onChange={e => setTxForm({...txForm, description: e.target.value})} type="text" maxLength={100} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" placeholder="e.g. Beli kopi sama teman kantor" />
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-border mt-2">
                <button type="button" onClick={() => setShowTxModal(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors">Batal</button>
                <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 active:scale-95 transition-all rounded-lg shadow-glow">Simpan Jurnal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
