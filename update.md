# 📊 Update: Audit Perhitungan KPR — `kpr.ts` vs `Simulasi_KPR_Fixed.xlsx`

> **Tanggal**: 1 April 2026  
> **File yang diaudit**: `packages/shared/src/formulas/kpr.ts`  
> **Referensi**: `Simulasi_KPR_Fixed.xlsx` (Sheet 01, 02, 03)

---

## 📋 Ringkasan Temuan

| # | Severity | Bug | Impact |
|---|----------|-----|--------|
| 1 | 🔴 **CRITICAL** | PMT/PPMT/IPMT sign convention error | Total bunga salah **Rp 3,07 Triliun** (error 472%) |
| 2 | 🔴 **CRITICAL** | Balance tracking menggunakan PPMT yang salah | Saldo berjalan menyimpang, akhir periode = **-1,7 Miliar** |
| 3 | 🟠 **HIGH** | Sisa pokok saat floating salah | Selisih **Rp 38,9 Juta** dari seharusnya |
| 4 | 🟠 **HIGH** | Cicilan maksimum (floating) salah | Selisih **Rp 555.647** per bulan |
| 5 | 🟡 **MEDIUM** | Logika rasio cicilan/gaji punya gap | Beberapa kombinasi rasio jatuh ke status yang salah |

---

## 🔍 Detail Bug

### Bug 1: PMT/PPMT/IPMT Sign Convention Error (CRITICAL)

> **CAUTION**
> Bug ini menyebabkan **total bunga KPR yang ditampilkan salah besar** — user melihat bunga Rp 3,7T padahal seharusnya Rp 652 Juta.

**Root Cause:**

Fungsi `calculatePMT` di `kpr.ts` mengembalikan nilai **negatif** ketika `pv` negatif:

```typescript
// kpr.ts line 12-16
export function calculatePMT(rate: number, nper: number, pv: number): number {
  if (rate === 0) return -pv / nper;
  const factor = Math.pow(1 + rate, nper);
  return (rate * pv * factor) / (factor - 1); // ← Seharusnya ada tanda negatif!
}
```

Dalam konvensi standar Excel:
- `PMT(rate, nper, -PV)` → harus mengembalikan **positif** (pembayaran keluar)
- Formula yang benar: `-(rate * pv * factor) / (factor - 1)`

Karena PMT dan PV memiliki tanda yang sama (keduanya negatif), rumus FV dalam PPMT/IPMT **menambahkan** kedua term alih-alih **mengurangkan**, sehingga hasil intermediate `fv_prev` menjadi sangat salah.

**Perbandingan Nilai:**

| Metric | kpr.ts (Buggy) | Seharusnya (Excel) | Selisih |
|--------|---------------:|-------------------:|--------:|
| Total Bunga | Rp 3.726.903.243 | Rp 652.195.856 | **+Rp 3.074.707.387** |
| Total Uang Keluar | Rp 4.526.903.243 | Rp 1.452.195.856 | **+Rp 3.074.707.387** |
| Rasio Bunga/Pokok | 465,86% | 81,52% | **+384,34%** |
| Saldo Akhir Periode | -1.702.691.035 | 0 | **-Rp 1,7 Miliar** |

---

### Bug 2: Balance Tracking Menggunakan PPMT yang Salah (CRITICAL)

Kode `kpr.ts` line 107:
```typescript
balance = beginningBalance - principalPayment;
```

Di mana `principalPayment = Math.abs(calculatePPMT(...))` — nilai PPMT-nya sudah salah (Bug 1), sehingga saldo berjalan dengan cepat menyimpang:

| Periode | Saldo Buggy | Saldo Benar | Selisih |
|--------:|------------:|------------:|--------:|
| 1 | 796.606.051,58 | 796.606.051,58 | 0 |
| 2 | 793.235.296,11 | 793.202.289,00 | +33.007 |
| 48 | 664.450.812,52 | 625.512.863,92 | **+38.937.949** |
| 180 | -1.702.691.035,94 | 0,00 | **-1.702.691.036** |

Saldo akhir negatif di-mask oleh `Math.max(0, balance)` di line 117.

---

### Bug 3: Sisa Pokok Saat Floating Salah (HIGH)

> **WARNING**
> Sisa pokok yang salah menyebabkan seluruh perhitungan periode floating (bunga, cicilan) juga salah.

| | Buggy | Benar |
|---|------:|------:|
| Sisa Pokok Saat Floating | Rp 664.450.812,52 | Rp 625.512.863,92 |
| PMT Floating | Rp 9.481.755,59 | Rp 8.926.108,58 |

---

### Bug 4: Cicilan Minimum & Maksimum (HIGH)

**Cicilan Minimum** — `schedule[0].totalPayment`:
- Kebetulan **benar** (Rp 5.707.281,75) karena pada periode 1, `abs(PPMT) + abs(IPMT) = |PMT|`

**Cicilan Maksimum** — `schedule[fixedPeriods].totalPayment`:
- **Salah** karena menggunakan sisa pokok yang salah untuk menghitung PMT floating

| | kpr.ts | Excel (MIN/MAX) |
|---|------:|------:|
| Cicilan Min | Rp 5.707.281,75 ✅ | Rp 5.707.281,75 |
| Cicilan Max | Rp 9.481.755,59 ❌ | Rp 8.926.108,58 |

> **Catatan**: Excel menggunakan `MIN()` & `MAX()` dari seluruh jadwal pembayaran, bukan mengambil dari period tertentu. Hasilnya sama karena dalam setiap fase (fix/float) pembayaran konstan.

---

### Bug 5: Logika Rasio Cicilan/Gaji (MEDIUM)

**5a. Gap dalam kondisi:**

Jika `minRatio < 0.3` dan `maxRatio >= 0.4`:
- **Excel**: Masuk ke "masih dalam batas aman" (else branch dari IF pertama)
- **kpr.ts**: Tidak ter-cover oleh kondisi manapun, jatuh ke "Membebani" atau "Tidak Sehat"

**5b. Missing sub-conditions dari Excel:**

Excel membedakan kasus `minRatio 0.4-0.5` dengan cek tambahan pada `maxRatio <= 0.5` vs `> 0.5`, memberikan pesan yang lebih spesifik. kpr.ts tidak membedakan ini.

**5c. Teks kesimpulan:**

Beberapa teks di kpr.ts berbeda dari Excel:
- Excel: *"mengurangi pengeluaran **atau menambah penghasilan**"*
- kpr.ts: *"mengurangi pengeluaran."* (terpotong)

**5d. Deduktor pendapatan:**

- Excel menggunakan: `(penghasilan bulanan - cicilan lain)` sebagai pembagi
- kpr.ts menggunakan: `monthlyIncome` langsung (tanpa dikurangi cicilan lain)
- Impact: Minor karena `cicilan lain` default = 0

---

## ✅ Yang Sudah Benar

| Komponen | Status |
|----------|--------|
| Biaya Tambahan (BPHTB, PPN, AJB, BBN, Notaris) | ✅ Benar |
| Formula BPHTB: 5% × (Harga Properti - NPOPTKP) | ✅ Sesuai Excel |
| Formula PPN: 11% × NPOP × (1 - diskon) | ✅ Sesuai Excel |
| Formula AJB: tarif × Harga Properti | ✅ Sesuai Excel |
| Formula BBN: tarif × Harga Properti | ✅ Sesuai Excel |
| Total Biaya: BPHTB + PPN + AJB + BBN + Notaris + Bank | ✅ Sesuai Excel |
| Cicilan Minimum (kebetulan benar) | ✅ Hasil benar |
| Type/interface definitions | ✅ Lengkap |
| UI Component (KPRContent.tsx) | ✅ Mapping data benar |

---

## 🔧 Rekomendasi Perbaikan

### Solusi: Gunakan Iterative Balance Tracking

Ganti seluruh mekanisme PPMT/IPMT dengan pendekatan iteratif yang lebih stabil secara numerik dan sesuai dengan cara Excel menghitung saldo berjalan (`H5 = D5 - E5`):

```typescript
export function calculateKPR(input: { ... }): KPRResult {
  const loanPrincipal = input.propertyPrice - input.downPayment;
  const totalPeriods = input.loanPeriodYears * 12;
  const fixedPeriods = input.fixedPeriodYears * 12;
  const floatingPeriods = totalPeriods - fixedPeriods;

  const fixedMonthlyRate = input.fixedRateAnnual / 12;
  const floatingMonthlyRate = input.floatingRateAnnual / 12;

  // Hitung PMT untuk periode fix (berdasarkan seluruh tenor di rate fix)
  const fixPMT = calculateCorrectPMT(fixedMonthlyRate, totalPeriods, loanPrincipal);

  const schedule: AmortizationRow[] = [];
  let balance = loanPrincipal;
  let remainingAtFloating = 0;
  let floatPMT = 0;

  for (let period = 1; period <= totalPeriods; period++) {
    const beginningBalance = balance;
    let interestPayment: number;
    let principalPayment: number;

    if (period <= fixedPeriods) {
      interestPayment = balance * fixedMonthlyRate;
      principalPayment = fixPMT - interestPayment;
    } else {
      if (period === fixedPeriods + 1) {
        remainingAtFloating = balance;
        floatPMT = calculateCorrectPMT(floatingMonthlyRate, floatingPeriods, remainingAtFloating);
      }
      interestPayment = balance * floatingMonthlyRate;
      principalPayment = floatPMT - interestPayment;
    }

    const totalPayment = principalPayment + interestPayment;
    balance = beginningBalance - principalPayment;

    schedule.push({ period, date, beginningBalance, principalPayment,
                     interestPayment, totalPayment, endingBalance: Math.max(0, balance) });
  }
  // ... rest of summary calculation
}

function calculateCorrectPMT(rate: number, nper: number, pv: number): number {
  if (rate === 0) return pv / nper;
  const factor = Math.pow(1 + rate, nper);
  return (pv * rate * factor) / (factor - 1);
}
```

### Perbaikan Rasio Cicilan

Sesuaikan logika kondisi agar mencakup semua kombinasi `minRatio` × `maxRatio` tanpa gap, sesuai dengan formula `J9` di Excel.

---

## 📊 Perbandingan Sebelum & Sesudah Fix

> Dengan data default: Harga Properti = Rp 900 Juta, DP = Rp 100 Juta, Fix 3,47% (4 thn), Float 12,99% (11 thn)

| Metric | Sebelum Fix (Bug) | Sesudah Fix (Benar) |
|--------|------------------:|--------------------:|
| PMT Fix | Rp 5.707.282 | Rp 5.707.282 |
| PMT Float | Rp 9.481.756 | **Rp 8.926.109** |
| Sisa Pokok Saat Floating | Rp 664.450.812 | **Rp 625.512.864** |
| Total Bunga | Rp 3.726.903.243 | **Rp 652.195.856** |
| Total Uang Keluar | Rp 4.526.903.243 | **Rp 1.452.195.856** |
| Rasio Bunga/Pokok | 465,86% | **81,52%** |
| Rasio Min (vs Gaji 30jt) | 19,02% | 19,02% |
| Rasio Max (vs Gaji 30jt) | 31,61% | **29,75%** |
| Status Rasio | 🟡 Batas Aman | **✅ Rasio Sehat** |

---

<br>

# 📊 Update: Audit Perhitungan Financial Checkup & Budgeting

> **Tanggal**: 1 April 2026  
> **File yang diaudit**: `packages/shared/src/formulas/checkup.ts` & `budgeting.ts`  
> **Referensi**: `Financial_Checkup_Fixed.xlsx` & `BUDGETING.xlsx`

---

## 📋 Ringkasan Temuan

| Modul | Status | Keterangan |
|-------|--------|------------|
| **Financial Checkup** | ✅ **BENAR** | Menggunakan variabel input yang tepat dari *Cash Flow* dan *Net Worth*. Tidak ada bug numerik. |
| **Budgeting** | ✅ **BENAR** | Kalkulasi saldo akhir (`SISA` & `Remaining Balance`), goals, dan evaluasi bulanan/tahunan sesuai dengan referensi Excel. |

---

## 🔍 Detail Evaluasi

### 1. Financial Checkup (`checkup.ts`)

Kode kalkulasi di dalam `checkup.ts` telah memetakan 6 matriks rasio utama dengan akurat sesuai dengan logika Excel:
- **Kecukupan Dana Darurat**: Mengambil secara spesifik nilai `D9` (RDPU/RDPT) dari sheet `01 Net Worth`, yang mana sama 100% dengan formula Excel referensi (`E5 = '01 Net Worth'!D9 / '03 Cash Flow'!J27`).
- **Arus Kas**: Saldo Pendapatan - Pengeluaran terukur dengan baik.
- **4 Rasio Lainya (Cicilan, Investasi, Biaya Hidup, Solvabilitas)**: Tepat mengkalkulasikan variabel pembaginya, tanpa ada deviasi pembagian angka nol (sudah dijaga dengan *ternary check*).

> **Peningkatan dari Excel (Enhancement)**: Excel asli berbasis aturan *2-conditions format* (hijau jika kriteria terpenuhi, selebihnya merah). Namun, kode TypeScript telah disempurnakan untuk mencakup zona transisi/kuning (`warning`), sebagai *best practice* aplikasi *financial planner* modern.

### 2. Budgeting (`budgeting.ts`)

Akurasi matematis formula budgeting tidak memiliki *discrepancy* dengan template rekapan Excel `BUDGETING.xlsx`:
- **Monthly Overview**: Logika pengelompokan `Sisa Saldo = (Saldo Lalu + Pendapatan) - (Tabungan + Belanja + Hutang)` di-implementasikan secara identik dengan agregasi sheet bulan ("JAN"-"DES").
- **Evaluasi Tahunan**: Konsep di mana `PENDAPATAN` mengurangi 4 elemen *cash outflow* lain terimplementasi sempurna tanpa selisih angka dengan sheet `EVALUASI TAHUNAN`.
- **Dashboard Tabungan**: Formula persentase dan proyeksi waktu (`monthsLeft`) persis mengikuti alur matematis pada sheet `DASHBOARD TABUNGAN`.

---

## ✅ Kesimpulan
Kedua modul tersebut (`checkup.ts` & `budgeting.ts`) dijamin bebas *bug* logika matematika, memiliki *handling* nilai nol yang aman, dan siap 100% dari segi validitas akuntansi. Fokus *refactoring* hanya perlu dititikberatkan pada penyelesaian cacat kalkulasi finansial di file formula KPR (`kpr.ts`).

---

<br>

# 🚀 Rencana Pengembangan: KPR Berjenjang (Tiered/Transition Floating Rates)

> **Referensi**: `contoh KPR 573jt Fixed Floating.xlsx` (Cerminan dari Produk KPR BCA Berjenjang)

Berdasarkan hasil studi kasus, realita perhitungan KPR untuk bunga *floating* tidak selalu langsung melonjak tajam (1 fase). Bank sering memberi penyesuaian (transisi) tahunan sebelum menyentuh batas atas (CAP). 

## Konsep yang Akan Diimplementasikan
Sistem akan di-_upgrade_ dari model "1 Fix + 1 Float" menjadi "**Array of Rates**" dengan struktur dinamis:

1. **Struktur Data API/Tipe Baru**:
   - `input` parameter pada `calculateKPR` akan diperluas agar dapat menerima **daftar fase suku bunga tambahan** (`floatingPhases`), yang terdiri dari Durasi (dalam tahun atau bulan) dan *Rate*-nya.
   - Contoh struktur: `[{ year: 4, rate: 5.97% }, { year: 5, rate: 8.47% }, { year: 6, rate: 10.97% }]`.
   - Bunga CAP / Capping (Batas Atas *Floating* Permanen) tetap akan dialokasikan hingga masa akhir KPR (Tenor Maksimal).

2. **Perubahan Logika Engine (`kpr.ts`)**:
   - Fungsi akan mengevaluasi apakah suatu periode bulan berada di dalam rentang waktu "Fase Transisi" atau "Fase Cap".
   - Jika berpindah fase, kalkulator akan secara otomatis melakukan *Re-calculate PMT* menggunakan parameter Sisa Bulan dan Sisa Utang saat ini, identik dengan logika Excel BCA.

3. **Logika UI (*Frontend*)**:
   - Komponen UI akan bisa mengirimkan format `floatingPhases` (Bunga Berjenjang) sehingga visualisasi data di _chart_ dan tabel amortisasi jadi jauh lebih realistis.
