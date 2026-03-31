# 💰 Aplikasi Manajemen Keuangan Personal (Pro)

Aplikasi *Full-Stack* manajemen kelas *Enterprise* yang dirancang khusus untuk memonitor, mengaudit, dan menyimulasikan seluruh aspek keuangan pribadi Anda. Dibangun dengan ekosistem modern **Next.js 14**, **Turborepo**, **Tailwind CSS**, dan **Supabase**.

Aplikasi ini mengonversi perhitungan rumit dari 3 formulasi Excel terpisah (*Financial Checkup*, Kalkulator KPR, dan Modul Budgeting Zero-Based) menjadi sebuah platform *Web App* responsif yang intuitif.

---

## ✨ Fitur Utama Tersedia

- **🔐 Autentikasi Super Aman:** Integrasi SSR (*Server-Side Rendering*) native dari Supabase. Menangani Login, Register, Verifikasi Email, hingga Reset "Lupa Sandi".
- **📊 Net Worth & Snapshot:** Evaluasi dan rekam kekayaan bersih (Total Aset dikurangi Total Utang/Kewajiban) dari bulan ke bulan.
- **💸 Manajemen Arus Kas:** Kalkulator ringkas memetakan Pendapatan Rutin vs Pengeluaran Rutin (Biaya Hidup, Cicilan, Tabungan). 
- **🏥 Checkup Kesehatan Finansial:** Menilai 6 indikator krusial seperti Rasio Likuiditas, Rasio Tabungan, hingga Solvabilitas. Memberikan status Merah, Kuning, atau Hijau secara *Real-Time*.
- **🏡 Simulator KPR Akurat:** Menghitung plafon pinjaman maksimal berdasarkan gaji Anda, mengalkulasi biaya provisi bank & notaris, serta mencetak jadwal amortisasi bulan per bulan.
- **✉️ Sistem Amplop Budgeting:** Filosofi *Zero-Based Budgeting*. Semua uang harus punya "Amplop" (kategori). Menyediakan evaluasi *Overbudget/Bocor*.
- **📅 Kalendar & Evaluasi Tahunan:** Memetakan histori belanja secara kronologis per bulan, dan mencetak grafik progres garis setahun penuh.
- **🌙 Tema Gelap (Dark Mode) & Mobile Responsive:** Mendukung pergantian warna untuk mata yang lebih sejuk. Layout berubah menjadi mode *App Mobile* (Sidebar Lipat) pada layar HP.

---

## 📖 Panduan Penggunaan Harian (Alur Disarankan)

Agar perhitungan berjalan presisi, ikuti langkah berikut saat pertama kali menjalankan akun:

1. **Masuk ke Halaman "Net Worth"**: Catat semua aset (Kas, Investasi, Mobil/Rumah) dan utang (Kartu Kredit, Paylater, KPR). Klik tombol **"Buat Snapshot"** di bagian atas untuk merekam *Net Worth* bulan ini sebagai pijakan (garis *start*).
2. **Setup "Arus Kas"**: Tulis pendapatan bulanan dan ekspektasi pengeluaran.
3. **Kunjungi "Checkup Keuangan"**: Aplikasi akan langsung membedah dan memberi ulasan otomatis seberapa "Sehat" finansial Anda dari data langkah 1 dan 2.
4. **Alokasikan Pos "Budgeting"**: Di halaman ini, klik *Buat Amplop Induk (Master)*. Alokasikan total pendapatan ke dalam amplop-amplop hingga tersisa Rp0.
5. **Catat Transaksi Tiap Hari**: Masih di halaman *Budgeting*, catat pengeluaran/pemasukan. Nama Kategori harus 100% SAMA dengan nama Amplop Anda. Jika nama berbeda, aplikasi akan mencapnya sebagai dana **"BOCOR"**.
6. **Pantau Tabungan & Pembayaran**: Lihat halaman `/tabungan` dan `/pembayaran` untuk melacak progress dana yang terkumpul vs tagihan yang sudah lunas bulan tersebut.
7. **Buka "Evaluasi Tahunan" & "Kalendar"**: Lihat riwayat seluruh pengeluaran Anda menjelang akhir tahun.

---

## 🚀 Panduan Lengkap Deployment Server (Live)

Karena aplikasi ini berarsitektur *Serverless Front-End* (Next.js) terpisah dengan *Backend-as-a-Service* (Supabase), *deployment* akan sangat cepat dan 100% **Gratis**.

### Tahap 1: Setup Database Supabase
1. Buat akun dan projek baru di [Supabase](https://supabase.com).
2. Buka menu **SQL Editor**. 
3. *Copy* dan jalankan seluruh isi file mitigasi SQL Anda yang berada di folder `supabase/migrations/001_initial_schema.sql` ke dalam *SQL Editor* Supabase. Tunggu hingga tabel-tabelnya terstruktur (sukses terbuat).
4. Buka menu **Authentication -> Providers -> Email**. Pastikan opsi *Confirm Email* menyala (Jika ingin *user* wajib konfirmasi).
5. Pada menu **Authentication -> URL Configuration**:
   - Isi **Site URL** dengan `https://namadomain-vercel-anda.vercel.app` (jika sudah di-deploy).
   - Isi **Redirect URLs** dengan `https://namadomain-vercel-anda.vercel.app/auth/callback**`.

### Tahap 2: Setup GitHub
1. Buat *Repository* kosong di akun GitHub Anda (Bebas *Private* atau *Public*).
2. Jalankan perintah di Terminal pada *root project* ini (pilih salah satu, misal: HTTPS):
   ```bash
   git add .
   git commit -m "First release MVP Keuangan App"
   git branch -M main
   git remote add origin https://github.com/username/repo-anda.git
   git push -u origin main
   ```

### Tahap 3: Deployment Satu-Klik di Vercel
1. Buat akun / Login ke [Vercel](https://vercel.com).
2. Klik tombol **"Add New..." -> "Project"**.
3. Import Repositori GitHub yang baru saja Anda dorong.
4. Vercel akan otomatis mendeteksi konfigurasi (karena kita pakai Next.js & Turborepo). **PENTING: Pastikan *Framework Preset* tersetting "Next.js" dan *Root Directory* mengarah ke `apps/web` (jika Anda ingin deploy webnya saja)**, atau biarkan Vercel mendeteksi Turborepo otomatis.
5. Pada bagian **Environment Variables**, isi kedua variabel berikut yang bisa Anda contek dari `Settings -> API` di halaman Supabase Anda:
   - `NEXT_PUBLIC_SUPABASE_URL` = (Diambil dari Project URL di Supabase)
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` = (Diambil dari Project API Keys -> anon / public)
6. Klik **Deploy**! 
7. Tunggu sekitar 2-3 menit hingga kompilasi selesai. Kunjungi URL cantik yang diberikan Vercel. Selamat, aplikasi kompleks ini berhasil diluncurkan ke Publik! 🥳

---
*Dibangun dengan dedikasi tinggi untuk membebaskan Anda dari belenggu lembar Excel yang kaku.*
