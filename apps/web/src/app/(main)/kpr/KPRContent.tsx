'use client';

import { useState, useCallback, useEffect } from 'react';
import { formatRupiah, formatRupiahCompact, formatPercent } from '@/lib/utils';
import { calculateKPR, calculateAdditionalCosts, calculateInstallmentRatio } from '@keuangan/shared';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts';
import { Calculator, Save, X, Bookmark, Loader2, Trash2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

const statusColors = { sehat: '#3ecf8e', aman: '#635bff', berat: '#f5a623', bahaya: '#ef4444' };
const statusLabels = { sehat: '✅ Rasio Sehat', aman: '🟡 Batas Aman', berat: '⚠️ Membebani', bahaya: '🔴 Tidak Sehat' };

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/60 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-numeric font-semibold ${highlight ? 'text-primary-500' : 'text-foreground'}`}>{value}</span>
    </div>
  );
}

export function KPRContent() {
  const [form, setForm] = useState({
    propertyPrice: 900_000_000,
    downPayment: 100_000_000,
    loanPeriodYears: 15,
    fixedRateAnnual: 0.0347,
    fixedPeriodYears: 4,
    floatingRateAnnual: 0.1299,
    monthlyIncome: 30_000_000,
    npoptkp: 75_000_000,
    ppnDiscount: 1.0,
    ajbRate: 0.01,
    bbnRate: 0.02,
    notaryFee: 5_000_000,
    bankFee1: 0,
    bankFee2: 0,
    bankFee3: 0,
  });

  const [tab, setTab] = useState<'ringkasan' | 'amortisasi' | 'biaya'>('ringkasan');
  const [showAllRows, setShowAllRows] = useState(false);

  // DB States
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [simulations, setSimulations] = useState<any[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [simName, setSimName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSimulations();
  }, []);

  const fetchSimulations = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase.from('kpr_simulations').select('*').order('created_at', { ascending: false });
      if (data) setSimulations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSimulation = (sim: any) => {
    setForm({
      propertyPrice: Number(sim.property_price),
      downPayment: Number(sim.down_payment),
      loanPeriodYears: Number(sim.loan_period_years),
      fixedRateAnnual: Number(sim.fixed_rate),
      fixedPeriodYears: Number(sim.fixed_period_years),
      floatingRateAnnual: Number(sim.floating_rate),
      monthlyIncome: Number(sim.monthly_income),
      npoptkp: Number(sim.npoptkp),
      ppnDiscount: Number(sim.ppn_discount),
      ajbRate: Number(sim.ajb_rate),
      bbnRate: Number(sim.bbn_rate),
      notaryFee: Number(sim.notary_fee),
      bankFee1: Number(sim.bank_fee_1),
      bankFee2: Number(sim.bank_fee_2),
      bankFee3: Number(sim.bank_fee_3),
    });
  };

  const saveSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simName.trim()) return;
    setIsSaving(true);
    try {
      const supabase = createClient();
      await supabase.from('kpr_simulations').insert({
        user_id: userId,
        name: simName,
        property_price: form.propertyPrice,
        down_payment: form.downPayment,
        loan_principal: form.propertyPrice - form.downPayment,
        loan_period_years: form.loanPeriodYears,
        fixed_rate: form.fixedRateAnnual,
        fixed_period_years: form.fixedPeriodYears,
        floating_rate: form.floatingRateAnnual,
        floating_period_years: form.loanPeriodYears - form.fixedPeriodYears,
        monthly_income: form.monthlyIncome,
        npoptkp: form.npoptkp,
        ppn_discount: form.ppnDiscount,
        ajb_rate: form.ajbRate,
        bbn_rate: form.bbnRate,
        notary_fee: form.notaryFee,
        bank_fee_1: form.bankFee1,
        bank_fee_2: form.bankFee2,
        bank_fee_3: form.bankFee3,
      });
      setShowSaveModal(false);
      setSimName('');
      fetchSimulations();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSimulation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Hapus simulasi ini?')) return;
    try {
      const supabase = createClient();
      await supabase.from('kpr_simulations').delete().eq('id', id);
      fetchSimulations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = useCallback((field: string, value: number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const kprResult = calculateKPR({
    propertyPrice: form.propertyPrice,
    downPayment: form.downPayment,
    loanPeriodYears: form.loanPeriodYears,
    fixedRateAnnual: form.fixedRateAnnual,
    fixedPeriodYears: form.fixedPeriodYears,
    floatingRateAnnual: form.floatingRateAnnual,
  });

  const additionalCosts = calculateAdditionalCosts({
    propertyPrice: form.propertyPrice,
    npoptkp: form.npoptkp,
    ppnDiscount: form.ppnDiscount,
    ajbRate: form.ajbRate,
    bbnRate: form.bbnRate,
    notaryFee: form.notaryFee,
    bankFee1: form.bankFee1,
    bankFee2: form.bankFee2,
    bankFee3: form.bankFee3,
  });

  const ratioResult = calculateInstallmentRatio(
    kprResult.summary.minInstallment,
    kprResult.summary.maxInstallment,
    form.monthlyIncome
  );

  const chartData = kprResult.schedule
    .filter((_, i) => i % 12 === 0)
    .map((row, i) => ({
      tahun: `Th ${i + 1}`,
      pokok: Math.round(row.principalPayment * 12),
      bunga: Math.round(row.interestPayment * 12),
      saldo: Math.round(row.endingBalance),
    }));

  const displayRows = showAllRows ? kprResult.schedule : kprResult.schedule.slice(0, 24);

  if (loading) {
     return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Simulasi KPR</h1>
          <p className="text-muted-foreground text-sm mt-1">Hitung cicilan, amortisasi, dan biaya-biaya KPR secara lengkap</p>
        </div>
        <button 
          onClick={() => setShowSaveModal(true)}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-glow"
        >
          <Save className="w-4 h-4" /> Simpan Simulasi
        </button>
      </div>

      {/* Saved Simulations Bar */}
      {simulations.length > 0 && (
         <div className="card-premium p-4 flex gap-3 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground px-2 border-r border-border shrink-0">
               <Bookmark className="w-4 h-4" /> Tersimpan
            </div>
            {simulations.map(sim => (
               <div 
                 key={sim.id} 
                 onClick={() => loadSimulation(sim)}
                 className="flex items-center justify-between gap-3 shrink-0 bg-muted/50 hover:bg-muted border border-border px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-colors group"
               >
                  <div>
                    <span className="font-medium">{sim.name}</span>
                    <span className="text-xs text-muted-foreground block font-numeric">{formatRupiahCompact(Number(sim.property_price))}</span>
                  </div>
                  <button onClick={(e) => deleteSimulation(sim.id, e)} className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
               </div>
            ))}
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ── LEFT: Input Form ── */}
        <div className="col-span-1 space-y-4">
          <div className="card-premium p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary-500" /> Input Data KPR
            </h2>
            <div className="space-y-3">
              {[
                { label: 'Harga Properti', field: 'propertyPrice', prefix: 'Rp' },
                { label: 'Uang Muka (DP)', field: 'downPayment', prefix: 'Rp' },
                { label: 'Periode KPR (tahun)', field: 'loanPeriodYears', prefix: '' },
                { label: '% Bunga Fix /tahun', field: 'fixedRateAnnual', prefix: '%', isPercent: true },
                { label: 'Periode Bunga Fix (tahun)', field: 'fixedPeriodYears', prefix: '' },
                { label: '% Bunga Floating /tahun', field: 'floatingRateAnnual', prefix: '%', isPercent: true },
                { label: 'Pendapatan Bulanan', field: 'monthlyIncome', prefix: 'Rp' },
              ].map(({ label, field, isPercent }) => (
                <div key={field}>
                  <label className="text-xs text-muted-foreground font-medium block mb-1">{label}</label>
                  <input
                    type="number"
                    value={isPercent ? (form[field as keyof typeof form] as number) * 100 : form[field as keyof typeof form] as number}
                    onChange={(e) => handleChange(field, isPercent ? parseFloat(e.target.value) / 100 : parseFloat(e.target.value) || 0)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground font-numeric focus:outline-none focus:ring-2 focus:ring-primary-500"
                    step={isPercent ? '0.01' : field.includes('Years') ? '1' : '100000'}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Rasio Cicilan */}
          <div className="card-premium p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">Rasio Cicilan / Gaji</h2>
            <div
              className="p-3 rounded-lg text-sm font-medium mb-3 border"
              style={{ background: statusColors[ratioResult.status] + '10', color: statusColors[ratioResult.status], borderColor: statusColors[ratioResult.status] + '30' }}
            >
              {statusLabels[ratioResult.status]}
            </div>
            <InfoRow label="Cicilan Min (fix)" value={formatRupiah(kprResult.summary.minInstallment)} />
            <InfoRow label="Cicilan Maks (floating)" value={formatRupiah(kprResult.summary.maxInstallment)} />
            <InfoRow label="Rasio Min (vs Gaji)" value={formatPercent(ratioResult.minRatio)} />
            <InfoRow label="Rasio Maks (vs Gaji)" value={formatPercent(ratioResult.maxRatio)} />
            <p className="text-xs text-muted-foreground mt-4 leading-relaxed p-3 bg-muted/50 rounded-lg">{ratioResult.conclusion}</p>
          </div>
        </div>

        {/* ── RIGHT: Results ── */}
        <div className="col-span-1 md:col-span-2 space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Pinjaman Pokok', value: formatRupiahCompact(kprResult.summary.loanPrincipal), color: 'text-primary-500' },
              { label: 'Total Bunga Dibayar', value: formatRupiahCompact(kprResult.summary.totalInterestPaid), color: 'text-red-500' },
              { label: 'Total Uang Dikeluarkan', value: formatRupiahCompact(kprResult.summary.totalPaid + additionalCosts.total), color: 'text-foreground' },
            ].map((kpi) => (
              <div key={kpi.label} className="card-premium p-4">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className={`text-lg font-bold font-numeric mt-1 ${kpi.color}`}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="card-premium">
            <div className="flex border-b border-border">
              {[
                { key: 'ringkasan', label: '📊 Ringkasan' },
                { key: 'amortisasi', label: '📋 Tabel Amortisasi' },
                { key: 'biaya', label: '💰 Biaya Tambahan (Siluman)' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key as typeof tab)}
                  className={`px-5 py-3 text-sm font-medium transition-colors ${tab === t.key ? 'text-primary-500 border-b-2 border-primary-500' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-5">
              {tab === 'ringkasan' && (
                <div className="space-y-4">
                  {/* Area chart */}
                  <div className="h-48 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="pokokGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3ecf8e" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#3ecf8e" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="bungaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="tahun" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis tickFormatter={(v) => formatRupiahCompact(v)} width={90} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip formatter={(v: number) => formatRupiah(v)} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Area name="Pokok" type="monotone" dataKey="pokok" stroke="#3ecf8e" fill="url(#pokokGrad)" strokeWidth={2} />
                        <Area name="Bunga" type="monotone" dataKey="bunga" stroke="#ef4444" fill="url(#bungaGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <InfoRow label="Biaya Booking Fee / Uang Muka (DP)" value={formatRupiah(form.downPayment)} />
                  <InfoRow label="Pokok Pinjaman KPR" value={formatRupiah(kprResult.summary.loanPrincipal)} />
                  <InfoRow label="Total Bunga (Selama Tenor)" value={formatRupiah(kprResult.summary.totalInterestPaid)} />
                  <InfoRow label="Rasio Bunga terhadap Pokok" value={formatPercent(kprResult.summary.interestToPrincipalRatio)} highlight />
                  <InfoRow label={`Sisa Pokok Saat Bunga Floating (Setelah Tahun ke-${form.fixedPeriodYears})`} value={formatRupiah(kprResult.summary.remainingAtFloating)} />
                  <InfoRow label="Total Biaya Siluman (Notaris, Pajak, dll)" value={formatRupiah(additionalCosts.total)} />
                  <div className="bg-primary-500/5 p-3 rounded-lg border border-primary-500/10 mt-4">
                     <InfoRow label="Modal Awal Yang Harus Disiapkan (DP + Biaya Tambahan)" value={formatRupiah(form.downPayment + additionalCosts.total)} highlight />
                  </div>
                </div>
              )}

              {tab === 'amortisasi' && (
                <div>
                  <table className="w-full text-xs box-border">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        {['Bln', 'Tanggal', 'Saldo Awal', 'Angsuran Pokok', 'Angsuran Bunga', 'Total Cicilan', 'Sisa Pokok'].map((h) => (
                          <th key={h} className="text-left py-2 px-2 text-muted-foreground font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayRows.map((row) => {
                        const isFloating = row.period > form.fixedPeriodYears * 12;
                        return (
                          <tr key={row.period} className={`border-b border-border/40 hover:bg-muted/50 ${isFloating ? 'bg-orange-50/20' : ''}`}>
                            <td className="py-2.5 px-2 font-numeric">{row.period}</td>
                            <td className="py-2.5 px-2">
                              {row.date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })}
                              {isFloating && <span className="ml-1 text-[9px] bg-orange-100 text-orange-600 px-1 py-0.5 rounded font-medium">Float</span>}
                            </td>
                            <td className="py-2.5 px-2 font-numeric">{formatRupiahCompact(row.beginningBalance)}</td>
                            <td className="py-2.5 px-2 font-numeric text-emerald-600">{formatRupiahCompact(row.principalPayment)}</td>
                            <td className="py-2.5 px-2 font-numeric text-red-500">{formatRupiahCompact(row.interestPayment)}</td>
                            <td className="py-2.5 px-2 font-numeric font-semibold text-primary-600">{formatRupiahCompact(row.totalPayment)}</td>
                            <td className="py-2.5 px-2 font-numeric font-medium">{formatRupiahCompact(row.endingBalance)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {!showAllRows && kprResult.schedule.length > 24 && (
                    <button onClick={() => setShowAllRows(true)} className="mt-4 w-full text-xs bg-muted/50 font-medium text-primary-500 hover:text-primary-600 py-2.5 rounded-lg transition-colors">
                      Tampilkan seluruh {kprResult.schedule.length} bulan angsuran →
                    </button>
                  )}
                </div>
              )}

              {tab === 'biaya' && (
                <div className="space-y-0">
                  {[
                    { label: 'BPHTB (5% × NPOPKP)', value: additionalCosts.bphtb, note: `NPOPTKP = ${formatRupiahCompact(form.npoptkp)} | Pajak untuk pembeli properti` },
                    { label: 'PPN', value: additionalCosts.ppn, note: `11% dari harga properti | Diskon = ${formatPercent(form.ppnDiscount)}` },
                    { label: 'AJB', value: additionalCosts.ajb, note: `${formatPercent(form.ajbRate)} dari harga | Akta Jual Beli Pejabat PPAT` },
                    { label: 'BBN', value: additionalCosts.bbn, note: `${formatPercent(form.bbnRate)} dari harga | Biaya Balik Nama Sertifikat` },
                    { label: 'Jasa Notaris', value: additionalCosts.notaryFee, note: 'Estimasi biaya notaris (dapat diubah di form)' },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center py-3.5 border-b border-border/60">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.note}</p>
                      </div>
                      <p className="text-sm font-numeric font-semibold text-foreground bg-muted/50 px-2 py-1 rounded">{formatRupiah(item.value)}</p>
                    </div>
                  ))}
                  
                  {/* Additional Modifiable Bank Fees Form Inputs shown directly inline for convenience */}
                  <div className="pt-6 pb-2">
                     <p className="text-sm font-semibold mb-3">Biaya Bank & Appraisal (Input Manual)</p>
                     <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] text-muted-foreground mb-1">Biaya Provisi/Admin</label>
                          <input type="number" value={form.bankFee1 || ''} onChange={e => handleChange('bankFee1', Number(e.target.value))} className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs font-numeric focus:outline-none focus:border-primary-500" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-muted-foreground mb-1">Asuransi Jiwa</label>
                          <input type="number" value={form.bankFee2 || ''} onChange={e => handleChange('bankFee2', Number(e.target.value))} className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs font-numeric focus:outline-none focus:border-primary-500" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-muted-foreground mb-1">Asuransi Kebakaran</label>
                          <input type="number" value={form.bankFee3 || ''} onChange={e => handleChange('bankFee3', Number(e.target.value))} className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs font-numeric focus:outline-none focus:border-primary-500" />
                        </div>
                     </div>
                  </div>

                  <div className="flex justify-between items-center py-4 bg-primary-500/10 px-4 rounded-xl mt-4 border border-primary-500/20">
                    <div>
                      <p className="text-sm font-bold text-foreground">TOTAL BIAYA SILUMAN</p>
                      <p className="text-xs text-muted-foreground">Harus dibayar cash di luar DP KPR</p>
                    </div>
                    <p className="text-xl font-bold font-numeric text-primary-600">{formatRupiah(additionalCosts.total)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Simpan Simulasi KPR</h3>
              <button onClick={() => setShowSaveModal(false)} className="text-muted-foreground hover:bg-muted p-1 rounded-md"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={saveSimulation} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Nama Simulasi</label>
                <input required autoFocus value={simName} onChange={e => setSimName(e.target.value)} type="text" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g. Cluster Bintaro Jaya" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowSaveModal(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg">Batal</button>
                <button disabled={isSaving} type="submit" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg shadow-glow">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
