// packages/shared/src/formulas/cashflow.ts
// Formula dari Financial Checkup.xlsx → Sheet "03 Cash Flow"

import type { CashflowItem, CashFlowResult } from '../types';

export function calculateCashFlow(items: CashflowItem[]): CashFlowResult {
  // KAS MASUK - semua item direction=masuk
  const kasMasukItems = items.filter((i) => i.direction === 'masuk');
  const totalKasMasuk = kasMasukItems.reduce((sum, i) => sum + Number(i.amount), 0);

  // KAS KELUAR: 3 sub-kategori
  // kewajiban_cicilan: Cicilan utang jangka pendek, cicilan mobil, KPR
  const totalKewajiban = items
    .filter((i) => i.direction === 'keluar' && i.category === 'kewajiban_cicilan')
    .reduce((sum, i) => sum + Number(i.amount), 0);

  // masa_depan_investasi: Investasi, tabungan kas
  const totalMasaDepan = items
    .filter((i) => i.direction === 'keluar' && i.category === 'masa_depan_investasi')
    .reduce((sum, i) => sum + Number(i.amount), 0);

  // kebutuhan_sehari_hari: Konsumsi, tempat tinggal, transportasi, internet, air/listrik, belanja, skincare
  const totalKebutuhan = items
    .filter((i) => i.direction === 'keluar' && i.category === 'kebutuhan_sehari_hari')
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const totalKasKeluar = totalKewajiban + totalMasaDepan + totalKebutuhan;
  const surplusDefisit = totalKasMasuk - totalKasKeluar;

  return {
    totalKasMasuk,
    totalKasKeluar,
    surplusDefisit,
    totalKewajiban,
    totalMasaDepan,
    totalKebutuhan,
  };
}

// Rumus Excel:
// J2 (Surplus/Defisit) = E14 - J27
// E5 = SUM(D6:D13), E14 = E5 (Total Kas Masuk)
// J5 (Kewajiban) = SUM(J6:J7)
// J12 (Masa Depan) = SUM(I13:I15)
// J16 (Kebutuhan Sehari-hari) = SUM(I17:I26)
// J27 (Total Kas Keluar) = SUM(J5,J12,J16)
