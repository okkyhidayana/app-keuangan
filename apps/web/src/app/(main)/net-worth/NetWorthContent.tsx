'use client';

import { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, Edit2, Trash2, X, Loader2, Save } from 'lucide-react';
import { formatRupiah, formatRupiahCompact, formatPercent } from '@/lib/utils';
import { calculateNetWorth, calculateGrowth } from '@keuangan/shared';
import type { Asset, Debt } from '@keuangan/shared';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { createClient } from '@/utils/supabase/client';

const ASSET_COLORS: Record<string, string> = {
  kas_setara_kas: '#635bff',
  investasi: '#3ecf8e',
  tetap: '#f5a623',
};

const CATEGORY_LABELS: Record<string, string> = {
  kas_setara_kas: 'Kas & Setara Kas',
  investasi: 'Investasi',
  tetap: 'Aset Tetap',
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-card text-xs space-y-1">
        <p className="font-medium text-foreground mb-2">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex justify-between gap-4">
            <span style={{ color: p.color }}>{p.name}</span>
            <span className="font-numeric">{formatRupiahCompact(p.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export function NetWorthContent() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<'aset' | 'utang'>('aset');
  
  // Modal states
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [assetForm, setAssetForm] = useState({ name: '', category: 'kas_setara_kas', amount: 0 });

  const [showDebtModal, setShowDebtModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [debtForm, setDebtForm] = useState({ name: '', term: 'jangka_pendek', total_amount: 0, monthly_payment: 0, interest_rate: 0, due_date: 1 });

  const [savingSnapshot, setSavingSnapshot] = useState(false);

  const fetchData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [aRes, dRes, sRes] = await Promise.all([
        supabase.from('assets').select('*').order('created_at'),
        supabase.from('debts').select('*').order('created_at'),
        supabase.from('net_worth_snapshots').select('*').order('snapshot_date', { ascending: true })
      ]);

      if (aRes.data) setAssets(aRes.data as Asset[]);
      if (dRes.data) setDebts(dRes.data as Debt[]);
      
      if (sRes.data) {
        setHistory(sRes.data.map(s => ({
          bulan: new Date(s.snapshot_date).toLocaleDateString('id-ID', { month: 'short' }),
          aset: Number(s.total_assets),
          utang: Number(s.total_debts),
          netWorth: Number(s.net_worth)
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // -- Saves & Deletes --
  const saveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    if (editingAsset) {
      await supabase.from('assets').update({
        name: assetForm.name, category: assetForm.category, amount: assetForm.amount
      }).eq('id', editingAsset.id);
    } else {
      await supabase.from('assets').insert({
        user_id: userId, name: assetForm.name, category: assetForm.category, amount: assetForm.amount
      });
    }
    setShowAssetModal(false);
    fetchData();
  };

  const deleteAsset = async (id: string) => {
    if (!confirm('Hapus aset ini?')) return;
    const supabase = createClient();
    await supabase.from('assets').delete().eq('id', id);
    fetchData();
  };

  const saveDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    if (editingDebt) {
      await supabase.from('debts').update({
        name: debtForm.name, term: debtForm.term, total_amount: debtForm.total_amount,
        monthly_payment: debtForm.monthly_payment, interest_rate: debtForm.interest_rate, due_date: debtForm.due_date
      }).eq('id', editingDebt.id);
    } else {
      await supabase.from('debts').insert({
        user_id: userId, name: debtForm.name, term: debtForm.term, total_amount: debtForm.total_amount,
        monthly_payment: debtForm.monthly_payment, interest_rate: debtForm.interest_rate, due_date: debtForm.due_date
      });
    }
    setShowDebtModal(false);
    fetchData();
  };

  const deleteDebt = async (id: string) => {
    if (!confirm('Hapus utang ini?')) return;
    const supabase = createClient();
    await supabase.from('debts').delete().eq('id', id);
    fetchData();
  };

  const handleSaveSnapshot = async () => {
    setSavingSnapshot(true);
    try {
      const supabase = createClient();
      const currentResult = calculateNetWorth(assets, debts);
      
      const today = new Date();
      // Snapshot date usually first of month or today
      const snapshot_date = today.toISOString().split('T')[0];

      // Growth percentage logic
      let growth_percentage = 0;
      if (history.length > 0) {
         const lastMonth = history[history.length - 1];
         if (lastMonth.netWorth > 0) {
            growth_percentage = (currentResult.netWorth - lastMonth.netWorth) / lastMonth.netWorth;
         }
      }

      await supabase.from('net_worth_snapshots').upsert({
        user_id: userId,
        snapshot_date,
        total_assets: currentResult.totalAssets,
        assets_kas: currentResult.breakdown.assets.kas_setara_kas,
        assets_investasi: currentResult.breakdown.assets.investasi,
        assets_tetap: currentResult.breakdown.assets.tetap,
        total_debts: currentResult.totalDebts,
        debts_jangka_pendek: currentResult.breakdown.debts.jangka_pendek,
        debts_jangka_panjang: currentResult.breakdown.debts.jangka_panjang,
        net_worth: currentResult.netWorth,
        growth_percentage
      }, { onConflict: 'user_id,snapshot_date' });
      
      await fetchData();
      alert('Snapshot bulan ini berhasil disimpan!');
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan snapshot');
    } finally {
      setSavingSnapshot(false);
    }
  };

  if (loading) {
     return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
  }

  const result = calculateNetWorth(assets, debts);
  
  const pieData = [
    { name: 'Kas & Setara Kas', value: result.breakdown.assets.kas_setara_kas, color: '#635bff' },
    { name: 'Investasi', value: result.breakdown.assets.investasi, color: '#3ecf8e' },
    { name: 'Aset Tetap', value: result.breakdown.assets.tetap, color: '#f5a623' },
  ].filter(d => d.value > 0);

  let growth = 0;
  if (history.length > 1) {
    growth = calculateGrowth(history[history.length - 1].netWorth, history[history.length - 2].netWorth) ?? 0;
  } else if (history.length === 1) {
    growth = calculateGrowth(result.netWorth, history[0].netWorth) ?? 0;
  }
  const isPositive = growth >= 0;

  const groupedAssets = {
    kas_setara_kas: assets.filter((a) => a.category === 'kas_setara_kas'),
    investasi: assets.filter((a) => a.category === 'investasi'),
    tetap: assets.filter((a) => a.category === 'tetap'),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Net Worth</h1>
          <p className="text-muted-foreground text-sm mt-1">Pantau total kekayaan bersih Anda</p>
        </div>
        <button 
          onClick={handleSaveSnapshot} 
          disabled={savingSnapshot}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-glow"
        >
          {savingSnapshot ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Simpan Snapshot Bulan Ini
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Net Worth */}
        <div className="card-premium p-6 bg-gradient-to-br from-primary-500 to-primary-600 border-primary-500 text-white">
          <p className="text-sm font-medium text-white/80">Net Worth</p>
          <p className="text-3xl font-bold font-numeric mt-2">{formatRupiahCompact(result.netWorth)}</p>
          <div className={`flex items-center gap-1 mt-2 text-sm ${isPositive ? 'text-emerald-200' : 'text-red-200'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{isPositive ? '+' : ''}{formatPercent(growth)} tren terkini</span>
          </div>
        </div>
        <div className="card-premium p-6">
          <p className="text-sm text-muted-foreground font-medium">Total Aset</p>
          <p className="text-2xl font-bold font-numeric text-foreground mt-2">{formatRupiahCompact(result.totalAssets)}</p>
          <div className="mt-3 space-y-1">
            {Object.entries(result.breakdown.assets).map(([key, val]) => (
              <div key={key} className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: ASSET_COLORS[key] }} />
                  <span className="text-muted-foreground">{CATEGORY_LABELS[key]}</span>
                </span>
                <span className="font-numeric font-medium">{formatRupiahCompact(val)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card-premium p-6">
          <p className="text-sm text-muted-foreground font-medium">Total Utang</p>
          <p className="text-2xl font-bold font-numeric text-red-500 mt-2">{formatRupiahCompact(result.totalDebts)}</p>
          <div className="mt-3 space-y-1">
            {[
              { label: 'Jangka Pendek', val: result.breakdown.debts.jangka_pendek, color: '#f5a623' },
              { label: 'Jangka Panjang', val: result.breakdown.debts.jangka_panjang, color: '#ef4444' },
            ].map((d) => (
              <div key={d.label} className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-muted-foreground">{d.label}</span>
                </span>
                <span className="font-numeric font-medium text-red-500">{formatRupiahCompact(d.val)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Progress Chart */}
        <div className="card-premium p-5 col-span-2">
          <h2 className="text-sm font-semibold text-foreground mb-4">Progress Net Worth</h2>
          <div className="h-56">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => formatRupiahCompact(v)} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line name="Aset" type="monotone" dataKey="aset" stroke="#3ecf8e" strokeWidth={2} dot={{ r: 3 }} />
                  <Line name="Utang" type="monotone" dataKey="utang" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                  <Line name="Net Worth" type="monotone" dataKey="netWorth" stroke="#635bff" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                Belum ada data riwayat bulanan. Klik "Simpan Snapshot" untuk menyimpan data pertama.
              </div>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="card-premium p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Komposisi Aset</h2>
          <div className="h-36">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={60} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatRupiah(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
               <div className="flex h-full items-center justify-center text-muted-foreground text-xs text-center border border-dashed rounded-full aspect-square w-32 mx-auto">
                 Tidak ada aset
               </div>
            )}
          </div>
          <div className="space-y-2 mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </span>
                <span className="font-numeric font-medium">{formatPercent(d.value / result.totalAssets)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Aset & Utang Detail */}
      <div className="card-premium">
        <div className="flex border-b border-border">
          {['aset', 'utang'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'aset' | 'utang')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === tab ? 'text-primary-500 border-b-2 border-primary-500' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {tab === 'aset' ? '💼 Daftar Aset' : '💳 Daftar Utang'}
            </button>
          ))}
          <div className="flex-1 flex justify-end items-center pr-4">
            <button 
              onClick={() => {
                if (activeTab === 'aset') {
                  setEditingAsset(null);
                  setAssetForm({ name: '', category: 'kas_setara_kas', amount: 0 });
                  setShowAssetModal(true);
                } else {
                  setEditingDebt(null);
                  setDebtForm({ name: '', term: 'jangka_pendek', total_amount: 0, monthly_payment: 0, interest_rate: 0, due_date: 1 });
                  setShowDebtModal(true);
                }
              }}
              className="flex items-center gap-1.5 text-xs text-primary-500 hover:underline"
            >
              <Plus className="w-3 h-3" /> Tambah {activeTab === 'aset' ? 'Aset' : 'Utang'}
            </button>
          </div>
        </div>

        <div className="p-5">
          {activeTab === 'aset' ? (
            assets.length === 0 ? (
               <p className="text-center text-muted-foreground text-sm py-4">Kamu belum mencatat aset apapun. Yuk tambah aset pertamamu!</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedAssets).filter(([_, arr]) => arr.length > 0).map(([cat, arr]) => (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: ASSET_COLORS[cat] }} />
                        {CATEGORY_LABELS[cat]}
                      </h3>
                      <span className="text-sm font-numeric font-semibold text-foreground">
                        {formatRupiah(arr.reduce((s, a) => s + a.amount, 0))}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {arr.map((asset) => (
                        <div key={asset.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/40 hover:bg-muted group">
                          <p className="text-sm text-foreground">{asset.name}</p>
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-numeric font-medium text-foreground">{formatRupiah(asset.amount)}</p>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => {
                                  setEditingAsset(asset);
                                  setAssetForm({ name: asset.name, category: asset.category, amount: asset.amount });
                                  setShowAssetModal(true);
                                }}
                                className="p-1 text-muted-foreground hover:text-primary-500"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => deleteAsset(asset.id)} className="p-1 text-muted-foreground hover:text-red-500">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            debts.length === 0 ? (
               <p className="text-center text-muted-foreground text-sm py-4">Bagus! Kamu belum memiliki utang yang tercatat.</p>
            ) : (
              <div className="space-y-3">
                {debts.map((debt) => (
                  <div key={debt.id} className="flex items-center justify-between px-3 py-3 rounded-lg bg-muted/40 hover:bg-muted group">
                    <div>
                      <p className="text-sm font-medium text-foreground">{debt.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Cicilan: {formatRupiah(debt.monthly_payment)}/bln · Jatuh tempo tgl {debt.due_date}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-numeric font-semibold text-red-500">{formatRupiah(debt.total_amount)}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {debt.term === 'jangka_pendek' ? 'Jangka Pendek' : 'Jangka Panjang'}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditingDebt(debt);
                            setDebtForm({
                              name: debt.name, term: debt.term, total_amount: debt.total_amount,
                              monthly_payment: debt.monthly_payment, interest_rate: debt.interest_rate, due_date: debt.due_date || 1
                            });
                            setShowDebtModal(true);
                          }}
                          className="p-1 text-muted-foreground hover:text-primary-500"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteDebt(debt.id)} className="p-1 text-muted-foreground hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Asset Modal Overlay */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">{editingAsset ? 'Edit Aset' : 'Tambah Aset'}</h3>
              <button onClick={() => setShowAssetModal(false)} className="text-muted-foreground hover:bg-muted p-1 rounded-md"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={saveAsset} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Nama Aset</label>
                <input required value={assetForm.name} onChange={e => setAssetForm({...assetForm, name: e.target.value})} type="text" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g. Tabungan BCA" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Kategori</label>
                <select value={assetForm.category} onChange={e => setAssetForm({...assetForm, category: e.target.value as any})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="kas_setara_kas">Kas & Setara Kas</option>
                  <option value="investasi">Investasi (Saham, Reksadana)</option>
                  <option value="tetap">Aset Tetap (Rumah, Mobil)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Nilai Terkini (Rp)</label>
                <input required min={0} value={assetForm.amount || ''} onChange={e => setAssetForm({...assetForm, amount: Number(e.target.value)})} type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAssetModal(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-glow">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Debt Modal Overlay */}
      {showDebtModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">{editingDebt ? 'Edit Utang' : 'Tambah Utang'}</h3>
              <button onClick={() => setShowDebtModal(false)} className="text-muted-foreground hover:bg-muted p-1 rounded-md"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={saveDebt} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Nama Utang</label>
                <input required value={debtForm.name} onChange={e => setDebtForm({...debtForm, name: e.target.value})} type="text" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g. KPR Mandiri" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Tipe Utang</label>
                  <select value={debtForm.term} onChange={e => setDebtForm({...debtForm, term: e.target.value as any})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="jangka_pendek">Jangka Pendek (Credit Card, Paylater)</option>
                    <option value="jangka_panjang">Jangka Panjang (KPR, Kredit Kendaraan)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Sisa Pokok (Rp)</label>
                  <input required min={0} value={debtForm.total_amount || ''} onChange={e => setDebtForm({...debtForm, total_amount: Number(e.target.value)})} type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Cicilan Bulanan (Rp)</label>
                  <input required min={0} value={debtForm.monthly_payment || ''} onChange={e => setDebtForm({...debtForm, monthly_payment: Number(e.target.value)})} type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Bunga/Tahun (Desimal)</label>
                  <input required min={0} step="0.001" value={debtForm.interest_rate || ''} onChange={e => setDebtForm({...debtForm, interest_rate: Number(e.target.value)})} type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="0.05 untuk 5%" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-foreground mb-1.5">Tgl Jatuh Tempo (1-31)</label>
                  <input required min={1} max={31} value={debtForm.due_date} onChange={e => setDebtForm({...debtForm, due_date: Number(e.target.value)})} type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowDebtModal(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-glow">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
