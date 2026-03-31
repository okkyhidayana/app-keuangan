'use client';

import { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, Edit2, Trash2, X, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatRupiah, formatPercent } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';

const CATEGORY_LABELS: Record<string, string> = {
  pendapatan: 'Pendapatan',
  kewajiban_cicilan: 'Kewajiban & Cicilan',
  masa_depan_investasi: 'Masa Depan & Investasi',
  kebutuhan_sehari_hari: 'Kebutuhan Sehari-hari',
};

const CATEGORY_COLORS: Record<string, string> = {
  pendapatan: '#3ecf8e',
  kewajiban_cicilan: '#f5a623',
  masa_depan_investasi: '#635bff',
  kebutuhan_sehari_hari: '#06b6d4',
};

export function ArusKasContent() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [items, setItems] = useState<any[]>([]);

  // Modal forms
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', direction: 'masuk', category: 'pendapatan', amount: 0, is_recurring: true });

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase.from('cashflow_items').select('*').order('created_at', { ascending: false });
      if (data) setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    
    // Auto category selection logic: 
    // If direction is 'masuk', force category 'pendapatan'. Oh wait, it should be selected by user, but let's restrict it.
    let finalCategory = form.category;
    if (form.direction === 'masuk') finalCategory = 'pendapatan';
    else if (form.category === 'pendapatan') finalCategory = 'kebutuhan_sehari_hari';

    if (editingItem) {
      await supabase.from('cashflow_items').update({
        name: form.name, direction: form.direction, category: finalCategory, amount: form.amount, is_recurring: form.is_recurring
      }).eq('id', editingItem.id);
    } else {
      await supabase.from('cashflow_items').insert({
        user_id: userId, name: form.name, direction: form.direction, category: finalCategory, amount: form.amount, is_recurring: form.is_recurring
      });
    }
    setShowModal(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus pencatatan kas ini?')) return;
    const supabase = createClient();
    await supabase.from('cashflow_items').delete().eq('id', id);
    fetchData();
  };

  const openAddModal = (direction: 'masuk' | 'keluar') => {
    setEditingItem(null);
    setForm({ 
      name: '', 
      direction, 
      category: direction === 'masuk' ? 'pendapatan' : 'kebutuhan_sehari_hari', 
      amount: 0, 
      is_recurring: true 
    });
    setShowModal(true);
  };

  // Calculations
  const kasMasuk = items.filter(i => i.direction === 'masuk');
  const kasKeluar = items.filter(i => i.direction === 'keluar');
  
  const totalMasuk = kasMasuk.reduce((s, i) => s + Number(i.amount), 0);
  const totalKeluar = kasKeluar.reduce((s, i) => s + Number(i.amount), 0);
  const surplus = totalMasuk - totalKeluar;
  const isPositive = surplus >= 0;

  const totalKewajiban = items.filter(i => i.category === 'kewajiban_cicilan').reduce((s, i) => s + Number(i.amount), 0);
  const totalInvestasi = items.filter(i => i.category === 'masa_depan_investasi').reduce((s, i) => s + Number(i.amount), 0);
  const totalKebutuhan = items.filter(i => i.category === 'kebutuhan_sehari_hari').reduce((s, i) => s + Number(i.amount), 0);

  // Grouped outputs for display
  const outGroups = [
    { cat: 'kewajiban_cicilan', label: CATEGORY_LABELS['kewajiban_cicilan'], color: CATEGORY_COLORS['kewajiban_cicilan'], total: totalKewajiban, items: items.filter(i => i.category === 'kewajiban_cicilan') },
    { cat: 'masa_depan_investasi', label: CATEGORY_LABELS['masa_depan_investasi'], color: CATEGORY_COLORS['masa_depan_investasi'], total: totalInvestasi, items: items.filter(i => i.category === 'masa_depan_investasi') },
    { cat: 'kebutuhan_sehari_hari', label: CATEGORY_LABELS['kebutuhan_sehari_hari'], color: CATEGORY_COLORS['kebutuhan_sehari_hari'], total: totalKebutuhan, items: items.filter(i => i.category === 'kebutuhan_sehari_hari') },
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Arus Kas (Cash Flow)</h1>
          <p className="text-muted-foreground text-sm mt-1">Pencatatan kas masuk & proporsi kas keluar bulanan</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => openAddModal('keluar')} className="flex items-center gap-2 bg-card hover:bg-muted border border-border text-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <ArrowDownRight className="w-4 h-4 text-red-500" /> Tambah Kas Keluar
           </button>
           <button onClick={() => openAddModal('masuk')} className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-glow">
            <ArrowUpRight className="w-4 h-4" /> Tambah Kas Masuk
           </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-premium p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground font-medium">Surplus / Defisit</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
               {isPositive ? 'Sehat' : 'Defisit'}
            </span>
          </div>
          <p className={`text-3xl font-bold font-numeric ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}{formatRupiah(surplus)}
          </p>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Persentase dari Pendapatan</span>
            <span className="font-numeric font-medium">{formatPercent(totalMasuk > 0 ? surplus / totalMasuk : 0)}</span>
          </div>
        </div>
        <div className="card-premium p-6 col-span-2">
           <p className="text-sm text-muted-foreground font-medium mb-4">Postur Alokasi Pengeluaran Bulanan</p>
           <div className="space-y-4">
             {/* Progress Bar Container */}
             <div className="h-3 w-full bg-muted rounded-full flex overflow-hidden">
               {outGroups.map(g => (
                 <div key={g.cat} style={{ width: `${totalMasuk > 0 ? (g.total/totalMasuk)*100 : 0}%`, backgroundColor: g.color }} className="h-full" />
               ))}
             </div>
             {/* Legend */}
             <div className="grid grid-cols-3 gap-2 mt-2">
               {outGroups.map(g => {
                 const pct = totalMasuk > 0 ? g.total/totalMasuk : 0;
                 return (
                   <div key={g.cat}>
                     <div className="flex items-center gap-1.5 text-xs">
                       <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                       <span className="text-muted-foreground">{g.label}</span>
                     </div>
                     <p className="font-numeric font-semibold text-foreground text-sm mt-1">{formatPercent(pct)}</p>
                     <p className="text-[10px] text-muted-foreground font-numeric">{formatRupiah(g.total)}</p>
                   </div>
                 );
               })}
             </div>
           </div>
        </div>
      </div>

      {/* Main Lists */}
      <div className="grid grid-cols-2 gap-6">
        {/* KAS MASUK */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
               <ArrowUpRight className="w-5 h-5 text-emerald-500" />
               Kas Masuk
            </h2>
            <span className="text-emerald-500 font-bold font-numeric">{formatRupiah(totalMasuk)}</span>
          </div>
          <div className="space-y-2">
             {kasMasuk.length === 0 ? (
               <p className="text-sm text-muted-foreground italic text-center py-6 border border-dashed rounded-xl">Belum ada kas masuk tercatat.</p>
             ) : (
               kasMasuk.map(item => (
                 <div key={item.id} className="card-premium p-4 flex items-center justify-between hover:border-primary-500/30 group">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{item.is_recurring ? 'Rutin / Tetap' : 'Sekali masuk'} · {CATEGORY_LABELS[item.category]}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-numeric font-semibold text-emerald-500">+{formatRupiah(item.amount)}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => { setEditingItem(item); setForm({ name: item.name, direction: item.direction, category: item.category, amount: item.amount, is_recurring: item.is_recurring }); setShowModal(true); }} className="p-1.5 text-muted-foreground hover:text-primary-500"><Edit2 className="w-3.5 h-3.5" /></button>
                         <button onClick={() => handleDelete(item.id)} className="p-1.5 text-muted-foreground hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                 </div>
               ))
             )}
          </div>
        </div>

        {/* KAS KELUAR */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
               <ArrowDownRight className="w-5 h-5 text-red-500" />
               Kas Keluar
            </h2>
            <span className="text-red-500 font-bold font-numeric">-{formatRupiah(totalKeluar)}</span>
          </div>
          <div className="space-y-4">
             {outGroups.filter(g => g.items.length > 0).map(group => (
               <div key={group.cat} className="space-y-2">
                 <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between px-2">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: group.color }} /> {group.label}</span>
                    <span className="font-numeric">{formatRupiah(group.total)}</span>
                 </h3>
                 {group.items.map(item => (
                   <div key={item.id} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between hover:border-muted-foreground/30 transition-colors group/item">
                      <div>
                        <p className="text-sm text-foreground">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{item.is_recurring ? 'Beban Tetap' : 'Beban Variabel'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-numeric font-medium text-foreground">-{formatRupiah(item.amount)}</span>
                        <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                           <button onClick={() => { setEditingItem(item); setForm({ name: item.name, direction: item.direction, category: item.category, amount: item.amount, is_recurring: item.is_recurring }); setShowModal(true); }} className="p-1 text-muted-foreground hover:text-primary-500"><Edit2 className="w-3 h-3" /></button>
                           <button onClick={() => handleDelete(item.id)} className="p-1 text-muted-foreground hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                   </div>
                 ))}
               </div>
             ))}
             {outGroups.every(g => g.items.length === 0) && (
                <p className="text-sm text-muted-foreground italic text-center py-6 border border-dashed rounded-xl">Belum ada kas keluar tercatat.</p>
             )}
          </div>
        </div>
      </div>

      {/* Item Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                {form.direction === 'masuk' ? <ArrowUpRight className="w-4 h-4 text-emerald-500"/> : <ArrowDownRight className="w-4 h-4 text-red-500"/>}
                {editingItem ? 'Edit Arus Kas' : (form.direction === 'masuk' ? 'Catat Kas Masuk' : 'Catat Kas Keluar')}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:bg-muted p-1 rounded-md"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Nama Item / Keterangan</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} type="text" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder={form.direction === 'masuk' ? "e.g. Gaji Pokok" : "e.g. Belanja Bulanan"} />
              </div>
              
              {form.direction === 'keluar' && (
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Kategori Pengeluaran</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="kewajiban_cicilan">Kewajiban & Cicilan (Misal: KPR, Paylater)</option>
                    <option value="masa_depan_investasi">Masa Depan & Investasi (Misal: Reksadana)</option>
                    <option value="kebutuhan_sehari_hari">Kebutuhan Sehari-hari (Misal: Makan, Listrik)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Jumlah Uang (Rp)</label>
                <input required min={0} value={form.amount || ''} onChange={e => setForm({...form, amount: Number(e.target.value)})} type="number" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="is_recurring" checked={form.is_recurring} onChange={e => setForm({...form, is_recurring: e.target.checked})} className="rounded text-primary-500 focus:ring-primary-500 bg-background border-border" />
                <label htmlFor="is_recurring" className="text-sm text-foreground select-none pointer-events-auto">Jadikan Anggaran Rutin Tetap (berulang tiap bulan)</label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-glow">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
