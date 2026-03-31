'use client';

import { useState, useEffect } from 'react';
import { calculateFinancialCheckup } from '@keuangan/shared';
import { formatRupiah, formatPercent, getStatusColor, getStatusLabel } from '@/lib/utils';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from 'recharts';
import { createClient } from '@/utils/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';

export function CheckupContent() {
  const [loading, setLoading] = useState(true);
  const [checkupData, setCheckupData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [aRes, dRes, cRes] = await Promise.all([
          supabase.from('assets').select('*'),
          supabase.from('debts').select('*'),
          supabase.from('cashflow_items').select('*')
        ]);

        const assets = aRes.data || [];
        const debts = dRes.data || [];
        const cashflows = cRes.data || [];

        // Aggregate Assets
        const totalAset = assets.reduce((s, a) => s + Number(a.amount), 0);
        // Dana Darurat: sum of all kas_setara_kas
        const danaDarurat = assets.filter(a => a.category === 'kas_setara_kas').reduce((s, a) => s + Number(a.amount), 0);
        
        // Aggregate Debts
        const totalUtang = debts.reduce((s, d) => s + Number(d.total_amount), 0);

        // Aggregate Cashflows
        const pendapatan = cashflows.filter(c => c.direction === 'masuk').reduce((s, c) => s + Number(c.amount), 0);
        const pengeluaranBulanan = cashflows.filter(c => c.direction === 'keluar').reduce((s, c) => s + Number(c.amount), 0);
        const totalCicilan = cashflows.filter(c => c.category === 'kewajiban_cicilan').reduce((s, c) => s + Number(c.amount), 0);
        const tabunganInvestasi = cashflows.filter(c => c.category === 'masa_depan_investasi').reduce((s, c) => s + Number(c.amount), 0);
        const biayaHidup = cashflows.filter(c => c.category === 'kebutuhan_sehari_hari').reduce((s, c) => s + Number(c.amount), 0);

        const result = calculateFinancialCheckup({
          danaDarurat,
          pengeluaranBulanan, 
          totalCicilan,
          pendapatan,
          tabunganInvestasi,
          biayaHidup,
          totalAset,
          totalUtang
        });

        setCheckupData(result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
  }

  if (checkupData.length === 0) {
    return (
      <div className="flex flex-col h-64 items-center justify-center text-muted-foreground border border-dashed rounded-xl">
        <AlertCircle className="w-8 h-8 text-primary-500 mb-2 opacity-50" />
        <p>Belum ada data untuk dianalisa.</p>
        <p className="text-sm">Isi Net Worth dan Arus Kas terlebih dahulu.</p>
      </div>
    );
  }

  const sehatCount = checkupData.filter((c) => c.status === 'sehat').length;

  const radarData = checkupData.map((item) => {
    let subject = item.name;
    if (subject.includes('Dana Darurat')) subject = 'Dana Darurat';
    if (subject.includes('Arus Kas')) subject = 'Arus Kas';
    if (subject.includes('Cicilan')) subject = 'Cicilan';
    if (subject.includes('Investasi')) subject = 'Investasi';
    if (subject.includes('Biaya Hidup')) subject = 'Biaya Hidup';
    if (subject.includes('Solvabilitas')) subject = 'Solvabilitas';

    return {
      subject,
      value: Math.min(100, Math.abs(item.status === 'sehat' ? 100 : item.status === 'warning' ? 65 : 30)),
      fullMark: 100,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Scorecard Keuangan</h1>
          <p className="text-muted-foreground text-sm mt-1">Status 6 rasio kesehatan keuangan berdasarkan kondisi aset dan arus kas terkini Anda</p>
        </div>
        <div className="card-premium px-5 py-3 text-center border-emerald-500/30 bg-emerald-500/10">
          <p className="text-3xl font-bold text-emerald-600 font-numeric">{sehatCount}/6</p>
          <p className="text-xs text-emerald-800/80 mt-0.5 font-medium">Rasio Sehat</p>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="card-premium p-6 bg-gradient-to-tr from-card to-muted/30">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          Gambaran Umum Kesehatan Keuangan
        </h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="80%">
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 13, fill: '#64748b', fontWeight: 600 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Skor Kesehatan" dataKey="value" stroke="#3ecf8e" fill="#3ecf8e" fillOpacity={0.4} strokeWidth={2.5} />
              <Tooltip formatter={(v: number) => {
                 return [v === 100 ? 'Sehat (100%)' : v === 65 ? 'Warning (65%)' : 'Bahaya (30%)', 'Status'];
              }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 6 Rasio Cards */}
      <div className="grid grid-cols-2 gap-4">
        {checkupData.map((item) => {
          const color = getStatusColor(item.status);
          const isRupiahValue = item.name === 'Arus Kas';
          
          let displayValue;
          if (isRupiahValue) {
            displayValue = (item.value >= 0 ? '+' : '') + formatRupiah(item.value);
          } else if (item.name.includes('Dana Darurat')) {
            displayValue = `${item.value.toFixed(1)}x`;
          } else if (item.name.includes('Solvabilitas')) {
            displayValue = `${Math.min(999, (item.value * 100)).toFixed(0)}%`; // Avoid displaying 100000% if debt is 1
          } else {
            displayValue = formatPercent(item.value);
          }

          return (
            <div key={item.name} className="card-premium p-5 hover:border-primary-500/30 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.formula}</p>
                </div>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ml-2 shadow-sm"
                  style={{ background: color + '20', color }}
                >
                  {getStatusLabel(item.status)}
                </span>
              </div>

              {/* Value */}
              <p className="text-2xl font-bold font-numeric mt-1" style={{ color }}>
                {displayValue}
              </p>

              {/* Progress Bar */}
              <div className="mt-4 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    background: color,
                    width: item.name === 'Arus Kas'
                      ? item.value > 0 ? '100%' : '5%'
                      : item.name.includes('Dana Darurat')
                      ? `${Math.min(100, (item.value / 6) * 100)}%`
                      : item.name.includes('Solvabilitas')
                      ? `${Math.min(100, item.value * 100)}%`
                      : item.name.includes('Investasi')
                      ? `${Math.min(100, (item.value / 0.2) * 100)}%`
                      : `${Math.min(100, item.value * 100)}%`,
                  }}
                />
              </div>

              <div className="flex justify-between items-center mt-2 pt-3 border-t border-border/60">
                <span className="text-xs text-muted-foreground">Target Rekomendasi:</span>
                <span className="text-xs font-semibold text-foreground">{item.recommendation}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
