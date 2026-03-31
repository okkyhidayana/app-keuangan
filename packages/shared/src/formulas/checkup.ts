// packages/shared/src/formulas/checkup.ts
// Formula dari Financial Checkup.xlsx → Sheet "04 Checkup"
// 6 Rasio Kesehatan Keuangan

import type { FinancialCheckupItem, HealthStatus } from '../types';

function getStatus(value: number, thresholds: { sehat: (v: number) => boolean; warning: (v: number) => boolean }): HealthStatus {
  if (thresholds.sehat(value)) return 'sehat';
  if (thresholds.warning(value)) return 'warning';
  return 'bahaya';
}

export function calculateFinancialCheckup(params: {
  danaDarurat: number;        // Saldo Dana Darurat (RDPU/RDPT) — Excel: D9 di sheet "01 Net Worth"
  pengeluaranBulanan: number; // Total kas keluar per bulan — Excel: J27 di "03 Cash Flow"
  totalCicilan: number;       // Total kewajiban cicilan — Excel: J5 di "03 Cash Flow"
  pendapatan: number;         // Total kas masuk per bulan — Excel: E14 di "03 Cash Flow"
  tabunganInvestasi: number;  // Total masa depan (investasi+tabungan) — Excel: J12 di "03 Cash Flow"
  biayaHidup: number;         // Total kebutuhan sehari-hari — Excel: J16 di "03 Cash Flow"
  totalAset: number;          // Total seluruh aset — Excel: E36 di "01 Net Worth"
  totalUtang: number;         // Total seluruh utang — Excel: J18 di "01 Net Worth"
}): FinancialCheckupItem[] {
  const {
    danaDarurat,
    pengeluaranBulanan,
    totalCicilan,
    pendapatan,
    tabunganInvestasi,
    biayaHidup,
    totalAset,
    totalUtang,
  } = params;

  // Rumus Excel: E5 = D9 / J27
  const rasio1 = pengeluaranBulanan > 0 ? danaDarurat / pengeluaranBulanan : 0;

  // Rumus Excel: E6 = E14 - J27
  const rasio2 = pendapatan - pengeluaranBulanan;

  // Rumus Excel: E7 = J5 / E14
  const rasio3 = pendapatan > 0 ? totalCicilan / pendapatan : 0;

  // Rumus Excel: E8 = J12 / E14
  const rasio4 = pendapatan > 0 ? tabunganInvestasi / pendapatan : 0;

  // Rumus Excel: E9 = J16 / E14
  const rasio5 = pendapatan > 0 ? biayaHidup / pendapatan : 0;

  // Rumus Excel: E10 = E36 / J18
  const rasio6 = totalUtang > 0 ? totalAset / totalUtang : Infinity;

  return [
    {
      name: 'Kecukupan Dana Darurat',
      formula: 'Saldo Dana Darurat ÷ Pengeluaran per bulan',
      recommendation: '≥ 6 kali',
      value: rasio1,
      status: getStatus(rasio1, {
        sehat: (v) => v >= 6,
        warning: (v) => v >= 3,
      }),
      description:
        rasio1 >= 6
          ? 'Dana darurat Anda mencukupi. Pertahankan!'
          : rasio1 >= 3
          ? 'Dana darurat masih kurang. Targetkan 6x pengeluaran bulanan.'
          : 'Dana darurat sangat kurang! Prioritaskan mengisi dana darurat segera.',
    },
    {
      name: 'Arus Kas',
      formula: 'Kas Masuk − Kas Keluar',
      recommendation: 'Positif',
      value: rasio2,
      status: rasio2 > 0 ? 'sehat' : rasio2 === 0 ? 'warning' : 'bahaya',
      description:
        rasio2 > 0
          ? 'Arus kas positif. Keuangan Anda surplus!'
          : rasio2 === 0
          ? 'Arus kas impas. Tidak ada ruang untuk tabungan ekstra.'
          : 'Arus kas negatif (defisit). Kurangi pengeluaran atau tambah pemasukan.',
    },
    {
      name: 'Rasio Cicilan / Pendapatan',
      formula: '(Total Cicilan Bulanan ÷ Pendapatan) × 100%',
      recommendation: '< 30%',
      value: rasio3,
      status: getStatus(rasio3, {
        sehat: (v) => v < 0.3,
        warning: (v) => v < 0.5,
      }),
      description:
        rasio3 < 0.3
          ? 'Cicilan dalam batas sehat.'
          : rasio3 < 0.5
          ? 'Cicilan mulai berat. Pertimbangkan untuk melunasi utang lebih cepat.'
          : 'Cicilan sangat memberatkan! Di atas 50% pendapatan — berbahaya.',
    },
    {
      name: 'Rasio Investasi / Pendapatan',
      formula: '(Investasi & Tabungan ÷ Pendapatan) × 100%',
      recommendation: '10% – 20%',
      value: rasio4,
      status: getStatus(rasio4, {
        sehat: (v) => v >= 0.1,
        warning: (v) => v >= 0.05,
      }),
      description:
        rasio4 >= 0.1
          ? 'Rasio investasi baik. Terus pertahankan!'
          : rasio4 >= 0.05
          ? 'Investasi masih kurang. Tingkatkan hingga minimal 10% pendapatan.'
          : 'Investasi sangat minim. Mulai sisihkan minimal 10% dari pendapatan.',
    },
    {
      name: 'Rasio Biaya Hidup / Pendapatan',
      formula: '(Total Biaya Hidup ÷ Pendapatan) × 100%',
      recommendation: '< 60%',
      value: rasio5,
      status: getStatus(rasio5, {
        sehat: (v) => v < 0.6,
        warning: (v) => v < 0.8,
      }),
      description:
        rasio5 < 0.6
          ? 'Biaya hidup terkendali.'
          : rasio5 < 0.8
          ? 'Biaya hidup cukup tinggi. Coba pangkas pengeluaran tidak esensial.'
          : 'Biaya hidup sangat tinggi! Lebih dari 80% pendapatan habis untuk biaya hidup.',
    },
    {
      name: 'Rasio Solvabilitas',
      formula: '(Total Aset ÷ Total Utang) × 100%',
      recommendation: '> 100%',
      value: rasio6,
      status: rasio6 > 1 ? 'sehat' : rasio6 >= 0.5 ? 'warning' : 'bahaya',
      description:
        rasio6 > 1
          ? 'Aset Anda melebihi utang. Kondisi solven!'
          : 'Utang melebihi aset. Prioritaskan pelunasan utang.',
    },
  ];
}
