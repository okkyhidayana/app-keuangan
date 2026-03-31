// packages/shared/src/formulas/networth.ts
// Formula dari Financial Checkup.xlsx → Sheet "01 Net Worth" & "02 Progress Networth"

import type { Asset, Debt, NetWorthResult } from '../types';

export function calculateNetWorth(assets: Asset[], debts: Debt[]): NetWorthResult {
  const kas_setara_kas = assets
    .filter((a) => a.category === 'kas_setara_kas')
    .reduce((sum, a) => sum + Number(a.amount), 0);

  const investasi = assets
    .filter((a) => a.category === 'investasi')
    .reduce((sum, a) => sum + Number(a.amount), 0);

  const tetap = assets
    .filter((a) => a.category === 'tetap')
    .reduce((sum, a) => sum + Number(a.amount), 0);

  const jangka_pendek = debts
    .filter((d) => d.term === 'jangka_pendek')
    .reduce((sum, d) => sum + Number(d.total_amount), 0);

  const jangka_panjang = debts
    .filter((d) => d.term === 'jangka_panjang')
    .reduce((sum, d) => sum + Number(d.total_amount), 0);

  const totalAssets = kas_setara_kas + investasi + tetap;
  const totalDebts = jangka_pendek + jangka_panjang;
  const netWorth = totalAssets - totalDebts;

  return {
    totalAssets,
    totalDebts,
    netWorth,
    breakdown: {
      assets: { kas_setara_kas, investasi, tetap },
      debts: { jangka_pendek, jangka_panjang },
    },
  };
}

// Rumus Excel: J2 = E36 - J18
// E36 = SUM(E5,E13,E27), E5=SUM(D6:D12), E13=SUM(D14:D26), E27=SUM(D28:D35)
// J18 = SUM(J5,J11), J5=SUM(I6:I10), J11=SUM(I12:I17)

export function calculateGrowth(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / previous;
}

export function getDanaDarurat(assets: Asset[]): number {
  // Dana Darurat = aset kas yang bernama "Dana Darurat" (RDPU/RDPT)
  // Rumus Excel: D9 di sheet "01 Net Worth"
  return assets
    .filter(
      (a) =>
        a.category === 'kas_setara_kas' &&
        a.name.toLowerCase().includes('dana darurat')
    )
    .reduce((sum, a) => sum + Number(a.amount), 0);
}
