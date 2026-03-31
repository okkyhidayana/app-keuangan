// packages/shared/src/constants/index.ts
// Default data seeds dari Excel files

import type { AssetCategory, DebtTerm, BudgetCategory, CashflowCategory } from '../types';

export const DEFAULT_ASSETS: Array<{ name: string; category: AssetCategory }> = [
  // Kas & Setara Kas (dari sheet "01 Net Worth" D6:D12)
  { name: 'Kas di Tangan', category: 'kas_setara_kas' },
  { name: 'Tabungan', category: 'kas_setara_kas' },
  { name: 'Deposito', category: 'kas_setara_kas' },
  { name: 'Dana Darurat (RDPU/RDPT)', category: 'kas_setara_kas' },
  // Aset Investasi (D14:D26)
  { name: 'Emas / Logam Mulia', category: 'investasi' },
  { name: 'Obligasi', category: 'investasi' },
  { name: 'Reksa Dana Pendapatan Tetap', category: 'investasi' },
  { name: 'Reksa Dana Saham', category: 'investasi' },
  { name: 'Reksa Dana Campuran', category: 'investasi' },
  { name: 'Saham Indonesia', category: 'investasi' },
  { name: 'Crypto', category: 'investasi' },
  { name: 'P2P Lending', category: 'investasi' },
  { name: 'Jaminan Hari Tua (JHT)', category: 'investasi' },
  { name: 'Saham US', category: 'investasi' },
  // Aset Tetap (D28:D35)
  { name: 'Rumah', category: 'tetap' },
  { name: 'Tanah', category: 'tetap' },
  { name: 'Mobil', category: 'tetap' },
  { name: 'Motor', category: 'tetap' },
  { name: 'Perhiasan', category: 'tetap' },
  { name: 'Laptop', category: 'tetap' },
];

export const DEFAULT_DEBTS: Array<{ name: string; term: DebtTerm }> = [
  // Utang Jangka Pendek (I6:I10)
  { name: 'Kartu Kredit', term: 'jangka_pendek' },
  { name: 'Pinjaman Pribadi', term: 'jangka_pendek' },
  // Utang Jangka Panjang (I12:I17)
  { name: 'KPR', term: 'jangka_panjang' },
  { name: 'Kredit Mobil', term: 'jangka_panjang' },
  { name: 'Kredit Motor', term: 'jangka_panjang' },
];

export const DEFAULT_CASHFLOW_MASUK: Array<{ name: string; category: CashflowCategory }> = [
  { name: 'Gaji', category: 'pendapatan' },
  { name: 'Side Job 1', category: 'pendapatan' },
  { name: 'Side Job 2', category: 'pendapatan' },
  { name: 'Bunga Obligasi', category: 'pendapatan' },
  { name: 'Dividen Saham', category: 'pendapatan' },
  { name: 'Hasil Investasi Crypto', category: 'pendapatan' },
  { name: 'Hasil Deposito', category: 'pendapatan' },
  { name: 'Hasil Penjualan Emas', category: 'pendapatan' },
];

export const DEFAULT_CASHFLOW_KELUAR: Array<{ name: string; category: CashflowCategory }> = [
  // Kewajiban / Cicilan
  { name: 'Cicilan Utang Jangka Pendek', category: 'kewajiban_cicilan' },
  { name: 'Cicilan Mobil', category: 'kewajiban_cicilan' },
  { name: 'Cicilan KPR', category: 'kewajiban_cicilan' },
  // Masa Depan (Investasi & Tabungan)
  { name: 'Investasi', category: 'masa_depan_investasi' },
  { name: 'Tabungan Kas', category: 'masa_depan_investasi' },
  // Kebutuhan Sehari-hari
  { name: 'Konsumsi / Makan', category: 'kebutuhan_sehari_hari' },
  { name: 'Tempat Tinggal / Sewa', category: 'kebutuhan_sehari_hari' },
  { name: 'Transportasi', category: 'kebutuhan_sehari_hari' },
  { name: 'Internet', category: 'kebutuhan_sehari_hari' },
  { name: 'Air & Listrik', category: 'kebutuhan_sehari_hari' },
  { name: 'Belanja Bulanan', category: 'kebutuhan_sehari_hari' },
  { name: 'Skincare / Perawatan', category: 'kebutuhan_sehari_hari' },
  { name: 'Hiburan', category: 'kebutuhan_sehari_hari' },
];

export const DEFAULT_BUDGET_ITEMS: Array<{ name: string; category: BudgetCategory }> = [
  // PENDAPATAN
  { name: 'Gaji', category: 'PENDAPATAN' },
  { name: 'Side Hustle', category: 'PENDAPATAN' },
  { name: 'Hasil Investasi', category: 'PENDAPATAN' },
  { name: 'Cashback', category: 'PENDAPATAN' },
  // TABUNGAN & INVESTASI
  { name: 'Top Up Investasi', category: 'TABUNGAN_INVESTASI' },
  { name: 'Tabungan Darurat', category: 'TABUNGAN_INVESTASI' },
  { name: 'Tabungan Tujuan', category: 'TABUNGAN_INVESTASI' },
  // TAGIHAN
  { name: 'IPL / Biaya Apartemen', category: 'TAGIHAN' },
  { name: 'Sewa Tempat Tinggal', category: 'TAGIHAN' },
  { name: 'Listrik', category: 'TAGIHAN' },
  { name: 'Air', category: 'TAGIHAN' },
  { name: 'BPJS Kesehatan', category: 'TAGIHAN' },
  { name: 'Internet / Pulsa', category: 'TAGIHAN' },
  { name: 'Langganan (Netflix, Spotify, dll)', category: 'TAGIHAN' },
  // BIAYA OPERASIONAL
  { name: 'Konsumsi / Makan', category: 'BIAYA_OPERASIONAL' },
  { name: 'Transportasi', category: 'BIAYA_OPERASIONAL' },
  { name: 'Belanja Bulanan', category: 'BIAYA_OPERASIONAL' },
  { name: 'Skincare / Perawatan', category: 'BIAYA_OPERASIONAL' },
  { name: 'Hiburan / Sosial', category: 'BIAYA_OPERASIONAL' },
  { name: 'Pendidikan', category: 'BIAYA_OPERASIONAL' },
  // HUTANG
  { name: 'Cicilan Kartu Kredit', category: 'HUTANG' },
  { name: 'Cicilan Pinjaman Pribadi', category: 'HUTANG' },
  { name: 'Cicilan KPR', category: 'HUTANG' },
  { name: 'Cicilan Kendaraan', category: 'HUTANG' },
];

export const BUDGET_CATEGORY_LABELS: Record<BudgetCategory, string> = {
  PENDAPATAN: 'Pendapatan',
  TABUNGAN_INVESTASI: 'Tabungan & Investasi',
  TAGIHAN: 'Tagihan',
  BIAYA_OPERASIONAL: 'Biaya Operasional',
  HUTANG: 'Hutang',
};

export const BUDGET_CATEGORY_COLORS: Record<BudgetCategory, string> = {
  PENDAPATAN: '#3ecf8e',
  TABUNGAN_INVESTASI: '#635bff',
  TAGIHAN: '#f5a623',
  BIAYA_OPERASIONAL: '#06b6d4',
  HUTANG: '#ef4444',
};

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  kas_setara_kas: 'Kas & Setara Kas',
  investasi: 'Investasi',
  tetap: 'Aset Tetap',
};

export const DEBT_TERM_LABELS: Record<DebtTerm, string> = {
  jangka_pendek: 'Jangka Pendek',
  jangka_panjang: 'Jangka Panjang',
};

export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export const SAVINGS_GOAL_ICONS = ['🏠', '🚗', '✈️', '📱', '💍', '🎓', '💼', '🏖️', '🏥', '🎁', '💰', '📈'];
export const SAVINGS_GOAL_COLORS = [
  '#635bff', '#3ecf8e', '#f5a623', '#ef4444', '#06b6d4',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
];
