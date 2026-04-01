// packages/shared/src/formulas/kpr.ts
// Formula dari Simulasi KPR.xlsx → Sheet "01 Data KPR", "02 Angsuran", "03 Biaya Lainnya"

import type { AmortizationRow, KPRResult, KPRAdditionalCosts } from '../types';

// ===== PMT / PPMT / IPMT (Equivalent Excel Functions) =====

/**
 * PMT — Hitung angsuran tetap per periode
 * Asumsi: pv (pinjaman) bernilai positif, mengembalikan nilai cicilan positif
 */
export function calculatePMT(rate: number, nper: number, pv: number): number {
  if (rate === 0) return pv / nper;
  const factor = Math.pow(1 + rate, nper);
  return (rate * pv * factor) / (factor - 1);
}

/**
 * PPMT — Pembayaran pokok pada periode tertentu
 * Catatan: Untuk keamanan numerik presisi tinggi pada tabel amortisasi panjang, 
 * disarankan menggunakan pelacakan saldo iteratif pada calculateKPR.
 */
export function calculatePPMT(rate: number, per: number, nper: number, pv: number): number {
  const pmt = calculatePMT(rate, nper, pv);
  const fvPrev = pv * Math.pow(1 + rate, per - 1) - (rate !== 0 ? pmt * (Math.pow(1 + rate, per - 1) - 1) / rate : pmt * (per - 1));
  const ipmt = fvPrev * rate;
  return pmt - ipmt;
}

/**
 * IPMT — Pembayaran bunga pada periode tertentu
 */
export function calculateIPMT(rate: number, per: number, nper: number, pv: number): number {
  const pmt = calculatePMT(rate, nper, pv);
  const fvPrev = pv * Math.pow(1 + rate, per - 1) - (rate !== 0 ? pmt * (Math.pow(1 + rate, per - 1) - 1) / rate : pmt * (per - 1));
  return fvPrev * rate;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// ===== KALKULASI TABEL AMORTISASI KPR =====
/**
 * calculateKPR — Hitung tabel amortisasi lengkap menggunakan Iterative Balance Tracking
 * 
 * Metode iteratif (H5 = D5 - E5) jauh lebih stabil secara numerik karena terhindar dari 
 * error eksponensial (1+r)^n pada cicilan periode-periode akhir di Javascript (IEEE 754).
 */
export function calculateKPR(input: {
  propertyPrice: number;
  downPayment: number;
  loanPeriodYears: number;
  fixedRateAnnual: number;
  fixedPeriodYears: number;
  floatingRateAnnual: number;
  startDate?: Date;
  monthlyIncome?: number;
}): KPRResult {
  const loanPrincipal = input.propertyPrice - input.downPayment;
  const totalPeriods = input.loanPeriodYears * 12;
  const fixedPeriods = input.fixedPeriodYears * 12;
  const floatingPeriods = totalPeriods - fixedPeriods;

  const fixedMonthlyRate = input.fixedRateAnnual / 12;
  const floatingMonthlyRate = input.floatingRateAnnual / 12;

  const startDate = input.startDate ?? new Date();
  const schedule: AmortizationRow[] = [];
  
  // Cicilan bulanan selama periode Fix menggunakan sisa tenor keseluruhan
  const fixPMT = calculatePMT(fixedMonthlyRate, totalPeriods, loanPrincipal);
  let floatPMT = 0;

  let balance = loanPrincipal;
  let remainingAtFloating = 0;

  for (let period = 1; period <= totalPeriods; period++) {
    const date = addMonths(startDate, period - 1);
    const beginningBalance = balance;

    let principalPayment: number;
    let interestPayment: number;

    if (period <= fixedPeriods) {
      // Fase FIX
      interestPayment = balance * fixedMonthlyRate;
      principalPayment = fixPMT - interestPayment;
    } else {
      // Fase FLOATING
      if (period === fixedPeriods + 1) {
        remainingAtFloating = balance; // Catat sisa saldo akhir dari periode fix
        floatPMT = calculatePMT(floatingMonthlyRate, floatingPeriods, remainingAtFloating);
      }
      interestPayment = balance * floatingMonthlyRate;
      principalPayment = floatPMT - interestPayment;
    }

    const totalPayment = principalPayment + interestPayment;
    balance = beginningBalance - principalPayment;

    schedule.push({
      period,
      date,
      beginningBalance,
      principalPayment,
      interestPayment,
      totalPayment,
      endingBalance: Math.max(0, balance),
    });
  }

  const totalInterestPaid = schedule.reduce((sum, r) => sum + r.interestPayment, 0);
  const totalPaid = loanPrincipal + totalInterestPaid;
  const interestToPrincipalRatio = loanPrincipal > 0 ? totalInterestPaid / loanPrincipal : 0;

  const minInstallment = schedule[0]?.totalPayment ?? 0;
  // Di saat masa fix lebih besar atau sama persis dengan totalPinjaman, tidak ada floating
  const maxInstallment = floatingPeriods > 0 ? floatPMT : minInstallment;

  return {
    schedule,
    summary: {
      loanPrincipal,
      totalPrincipalPaid: loanPrincipal,
      totalInterestPaid,
      totalPaid,
      interestToPrincipalRatio,
      minInstallment,
      maxInstallment,
      remainingAtFloating,
    },
  };
}

// ===== BIAYA TAMBAHAN KPR =====
/**
 * Rumus Excel (sheet "03 Biaya Lainnya"):
 * BPHTB: E5 = D9 = 5% × (D6 - D7)   dimana D6=harga properti, D7=NPOPTKP
 * PPN:   E10 = D12 - (D12 × D13)   D12=11%×NPOP, D13=diskon (1.0=100%)
 * AJB:   E14 = D17 = D15 × 1%
 * BBN:   E18 = D21 = D19 × 2%
 * Total: E29 = E5 + E10 + E14 + E18 + E22 + E23 (notaris + biaya bank)
 */
export function calculateAdditionalCosts(params: {
  propertyPrice: number;
  npoptkp?: number;       // default 75.000.000
  ppnDiscount?: number;   // default 1.0 (100% diskon)
  ajbRate?: number;       // default 0.01 (1%)
  bbnRate?: number;       // default 0.02 (2%)
  notaryFee?: number;     // default 5.000.000
  bankFee1?: number;
  bankFee2?: number;
  bankFee3?: number;
}): KPRAdditionalCosts {
  const {
    propertyPrice,
    npoptkp = 75_000_000,
    ppnDiscount = 1.0,
    ajbRate = 0.01,
    bbnRate = 0.02,
    notaryFee = 5_000_000,
    bankFee1 = 0,
    bankFee2 = 0,
    bankFee3 = 0,
  } = params;

  const npopkp = Math.max(0, propertyPrice - npoptkp);
  const bphtb = 0.05 * npopkp;

  const ppnBase = 0.11 * propertyPrice;
  const ppn = ppnBase * (1 - ppnDiscount);

  const ajb = ajbRate * propertyPrice;
  const bbn = bbnRate * propertyPrice;
  const bankFees = bankFee1 + bankFee2 + bankFee3;
  const total = bphtb + ppn + ajb + bbn + notaryFee + bankFees;

  return { bphtb, ppn, ajb, bbn, notaryFee, bankFees, total };
}

// ===== RASIO CICILAN / GAJI =====
/**
 * Rumus Excel: K7 = K6 / gaji, L7 = L6 / gaji
 * K6 = cicilan minimum (periode fix), L6 = cicilan maksimum (periode floating)
 */
export function calculateInstallmentRatio(
  minInstallment: number,
  maxInstallment: number,
  monthlyIncome: number
): { minRatio: number; maxRatio: number; conclusion: string; status: 'sehat' | 'aman' | 'berat' | 'bahaya' } {
  if (monthlyIncome === 0) {
    return { minRatio: 0, maxRatio: 0, conclusion: 'Masukkan pendapatan bulanan untuk melihat rasio.', status: 'sehat' };
  }

  const minRatio = minInstallment / monthlyIncome;
  const maxRatio = maxInstallment / monthlyIncome;

  let conclusion: string;
  let status: 'sehat' | 'aman' | 'berat' | 'bahaya';

  if (minRatio < 0.3) {
    if (maxRatio < 0.3) {
      conclusion = 'Rasio Sehat: Cicilan minimum dan maksimum berada dalam rasio sehat. Cicilan tidak membebani cashflow, dan masih ada ruang untuk kebutuhan lainnya, tabungan, dan investasi.';
      status = 'sehat';
    } else {
      conclusion = 'Cicilan minimum dalam rasio sehat, tetapi cicilan maksimum masih membebani (di atas 30%). Perlu pengaturan cashflow yang cermat terutama pada saat bunga floating.';
      status = 'aman';
    }
  } else if (minRatio >= 0.3 && minRatio <= 0.4) {
    if (maxRatio <= 0.4) {
      conclusion = 'Batas Aman: Cicilan minimum dan maksimum berada dalam batas aman. Cashflow perlu dikelola dengan baik dan prioritaskan dana darurat untuk menjaga stabilitas.';
      status = 'aman';
    } else {
      conclusion = 'Cicilan minimum dalam batas aman, tetapi cicilan maksimum membebani. Perhatikan cashflow terutama pada saat cicilan maksimum, dan pertimbangkan untuk mengurangi pengeluaran atau menambah penghasilan pada masa floating.';
      status = 'berat';
    }
  } else if (minRatio > 0.4 && minRatio <= 0.5) {
    if (maxRatio <= 0.5) {
      conclusion = 'Membebani: Cicilan minimum dan maksimum mulai membebani keuangan bulanan. Cashflow terbatas dan sulit untuk menabung atau berinvestasi. Pertimbangkan untuk menambah DP, memperpanjang masa KPR, mengurangi pengeluaran atau menambah penghasilan.';
      status = 'berat';
    } else {
      conclusion = 'Cicilan minimum membebani, sementara cicilan maksimum sangat membebani. Cashflow sangat ketat, dan disarankan untuk menambah DP, memperpanjang masa KPR, mengurangi pengeluaran atau menambah penghasilan.';
      status = 'bahaya';
    }
  } else {
    conclusion = 'Tidak Sehat: Cicilan minimum dan maksimum berada di luar batas aman karena lebih dari 50% dari penghasilan. Cashflow hampir habis untuk cicilan, berisiko tinggi menyebabkan ketergantungan pada hutang lain.';
    status = 'bahaya';
  }

  return { minRatio, maxRatio, conclusion, status };
}
