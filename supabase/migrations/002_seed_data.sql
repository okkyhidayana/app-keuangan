-- ============================================================
-- SEED DATA: 002_seed_data.sql
-- Cara pakai:
--   1. Daftar/login dulu di aplikasi (http://localhost:3002)
--   2. Buka Supabase Dashboard → SQL Editor
--   3. Ganti nilai USER_ID di bawah dengan UUID kamu
--      (ambil dari: Authentication → Users → copy UUID)
--   4. Jalankan seluruh script ini
-- ============================================================

-- ⚠️  GANTI INI dengan UUID dari Supabase Authentication → Users
DO $$
DECLARE
  v_user_id UUID := 'ee8095f1-d7a2-4433-8a54-7a371cca602a'; -- ← ganti ini!

  -- ID untuk referensi antar tabel
  a1 UUID := gen_random_uuid();
  a2 UUID := gen_random_uuid();
  a3 UUID := gen_random_uuid();
  a4 UUID := gen_random_uuid();
  a5 UUID := gen_random_uuid();

  d1 UUID := gen_random_uuid();
  d2 UUID := gen_random_uuid();

  cf1 UUID := gen_random_uuid();
  cf2 UUID := gen_random_uuid();
  cf3 UUID := gen_random_uuid();
  cf4 UUID := gen_random_uuid();
  cf5 UUID := gen_random_uuid();
  cf6 UUID := gen_random_uuid();
  cf7 UUID := gen_random_uuid();

  bi1 UUID := gen_random_uuid();
  bi2 UUID := gen_random_uuid();
  bi3 UUID := gen_random_uuid();
  bi4 UUID := gen_random_uuid();
  bi5 UUID := gen_random_uuid();
  bi6 UUID := gen_random_uuid();
  bi7 UUID := gen_random_uuid();
  bi8 UUID := gen_random_uuid();

  sg1 UUID := gen_random_uuid();
  sg2 UUID := gen_random_uuid();
  sg3 UUID := gen_random_uuid();

  g1 UUID := gen_random_uuid();
  g2 UUID := gen_random_uuid();
  g3 UUID := gen_random_uuid();

BEGIN

-- ===== 1. ASSETS =====
INSERT INTO assets (id, user_id, name, category, amount, notes) VALUES
  (a1, v_user_id, 'Tabungan BCA', 'kas_setara_kas', 45000000, 'Rekening utama'),
  (a2, v_user_id, 'Deposito Mandiri', 'kas_setara_kas', 25000000, 'Deposito 6 bulan'),
  (a3, v_user_id, 'Reksa Dana Saham', 'investasi', 38000000, 'Bareksa - campuran'),
  (a4, v_user_id, 'Saham BBCA, TLKM', 'investasi', 22000000, 'Porto saham di Stockbit'),
  (a5, v_user_id, 'Kendaraan (Motor)', 'tetap', 18000000, 'Honda Vario 2021 - nilai jual estimasi');

-- ===== 2. DEBTS =====
INSERT INTO debts (id, user_id, name, term, total_amount, monthly_payment, interest_rate, due_date, notes) VALUES
  (d1, v_user_id, 'Cicilan Motor Honda', 'jangka_pendek', 15000000, 1500000, 0.0600, 5, 'Sisa 10 bulan lagi'),
  (d2, v_user_id, 'Kartu Kredit BNI', 'jangka_pendek', 8000000, 2000000, 0.0200, 20, 'Citilink + belanja online');

-- ===== 3. NET WORTH SNAPSHOTS (12 bulan terakhir) =====
INSERT INTO net_worth_snapshots (user_id, snapshot_date, total_assets, assets_kas, assets_investasi, assets_tetap, total_debts, debts_jangka_pendek, debts_jangka_panjang, net_worth, growth_percentage) VALUES
  (v_user_id, '2025-05-01', 118000000, 55000000, 45000000, 18000000, 28000000, 28000000, 0, 90000000, NULL),
  (v_user_id, '2025-06-01', 124000000, 58000000, 46000000, 18000000, 26500000, 26500000, 0, 97500000, 0.0833),
  (v_user_id, '2025-07-01', 127000000, 59000000, 50000000, 18000000, 25000000, 25000000, 0, 102000000, 0.0462),
  (v_user_id, '2025-08-01', 130000000, 61000000, 51000000, 18000000, 24000000, 24000000, 0, 106000000, 0.0392),
  (v_user_id, '2025-09-01', 133000000, 62000000, 53000000, 18000000, 23000000, 23000000, 0, 110000000, 0.0377),
  (v_user_id, '2025-10-01', 136000000, 63000000, 55000000, 18000000, 22000000, 22000000, 0, 114000000, 0.0364),
  (v_user_id, '2025-11-01', 139000000, 64000000, 57000000, 18000000, 21000000, 21000000, 0, 118000000, 0.0351),
  (v_user_id, '2025-12-01', 142000000, 68000000, 56000000, 18000000, 20000000, 20000000, 0, 122000000, 0.0339),
  (v_user_id, '2026-01-01', 140000000, 60000000, 62000000, 18000000, 19000000, 19000000, 0, 121000000, -0.0082),
  (v_user_id, '2026-02-01', 143000000, 62000000, 63000000, 18000000, 18000000, 18000000, 0, 125000000, 0.0331),
  (v_user_id, '2026-03-01', 146000000, 68000000, 60000000, 18000000, 17000000, 17000000, 0, 129000000, 0.0320),
  (v_user_id, '2026-04-01', 148000000, 70000000, 60000000, 18000000, 23000000, 23000000, 0, 125000000, -0.0310);

-- ===== 4. CASHFLOW ITEMS =====
-- Pemasukan
INSERT INTO cashflow_items (id, user_id, name, direction, category, amount, is_recurring) VALUES
  (cf1, v_user_id, 'Gaji Pokok', 'masuk', 'pendapatan', 9500000, TRUE),
  (cf2, v_user_id, 'Tunjangan Transport & Makan', 'masuk', 'pendapatan', 1500000, TRUE),
  (cf3, v_user_id, 'Freelance / Project Sampingan', 'masuk', 'pendapatan', 2000000, FALSE);

-- Pengeluaran
INSERT INTO cashflow_items (id, user_id, name, direction, category, amount, is_recurring) VALUES
  (cf4, v_user_id, 'Cicilan Motor', 'keluar', 'kewajiban_cicilan', 1500000, TRUE),
  (cf5, v_user_id, 'Investasi Reksa Dana', 'keluar', 'masa_depan_investasi', 1000000, TRUE),
  (cf6, v_user_id, 'Biaya Hidup & Makan', 'keluar', 'kebutuhan_sehari_hari', 3500000, TRUE),
  (cf7, v_user_id, 'Tagihan Rutin (Listrik, Internet, BPJS)', 'keluar', 'kebutuhan_sehari_hari', 800000, TRUE);

-- ===== 5. BUDGET ITEMS =====
INSERT INTO budget_items (id, user_id, name, category, amount, frequency, due_date, sort_order) VALUES
  -- Pendapatan
  (bi1, v_user_id, 'Gaji Bulanan', 'PENDAPATAN', 9500000, 'bulanan', NULL, 1),
  (bi2, v_user_id, 'Tunjangan', 'PENDAPATAN', 1500000, 'bulanan', NULL, 2),
  -- Tabungan & Investasi
  (bi3, v_user_id, 'Reksa Dana Rutin', 'TABUNGAN_INVESTASI', 1000000, 'bulanan', NULL, 1),
  (bi4, v_user_id, 'Tabungan Dana Darurat', 'TABUNGAN_INVESTASI', 500000, 'bulanan', NULL, 2),
  -- Tagihan
  (bi5, v_user_id, 'Listrik PLN', 'TAGIHAN', 350000, 'bulanan', 15, 1),
  (bi6, v_user_id, 'Internet IndiHome', 'TAGIHAN', 250000, 'bulanan', 10, 2),
  (bi7, v_user_id, 'BPJS Kesehatan', 'TAGIHAN', 150000, 'bulanan', 10, 3),
  -- Hutang
  (bi8, v_user_id, 'Cicilan Motor', 'HUTANG', 1500000, 'bulanan', 5, 1);

-- ===== 6. BUDGET PLANS (April 2026) =====
INSERT INTO budget_plans (user_id, month, year, budget_item_id, planned_amount) VALUES
  (v_user_id, 4, 2026, bi1, 9500000),
  (v_user_id, 4, 2026, bi2, 1500000),
  (v_user_id, 4, 2026, bi3, 1000000),
  (v_user_id, 4, 2026, bi4, 500000),
  (v_user_id, 4, 2026, bi5, 350000),
  (v_user_id, 4, 2026, bi6, 250000),
  (v_user_id, 4, 2026, bi7, 150000),
  (v_user_id, 4, 2026, bi8, 1500000);

-- ===== 7. TRANSACTIONS (Beberapa bulan terakhir) =====
INSERT INTO transactions (user_id, transaction_date, amount, category, subcategory, description) VALUES
  -- April 2026
  (v_user_id, '2026-04-01', 9500000, 'PENDAPATAN', 'Gaji', 'Gaji Bulanan April'),
  (v_user_id, '2026-04-01', 1500000, 'PENDAPATAN', 'Tunjangan', 'Tunjangan April'),
  (v_user_id, '2026-04-02', 45000, 'BIAYA_OPERASIONAL', 'Makan', 'Makan siang kantor'),
  (v_user_id, '2026-04-03', 150000, 'BIAYA_OPERASIONAL', 'Transportasi', 'Grab & Gojek minggu ini'),
  (v_user_id, '2026-04-04', 80000, 'BIAYA_OPERASIONAL', 'Hiburan', 'Netflix bulanan'),
  -- Maret 2026
  (v_user_id, '2026-03-01', 9500000, 'PENDAPATAN', 'Gaji', 'Gaji Bulanan Maret'),
  (v_user_id, '2026-03-05', 1500000, 'HUTANG', 'Cicilan', 'Cicilan Motor Maret'),
  (v_user_id, '2026-03-10', 250000, 'TAGIHAN', 'Internet', 'IndiHome Maret'),
  (v_user_id, '2026-03-10', 150000, 'TAGIHAN', 'BPJS', 'BPJS Kesehatan Maret'),
  (v_user_id, '2026-03-15', 320000, 'TAGIHAN', 'Listrik', 'PLN Maret'),
  (v_user_id, '2026-03-17', 1000000, 'TABUNGAN_INVESTASI', 'Investasi', 'Top-up Reksa Dana'),
  (v_user_id, '2026-03-20', 2000000, 'PENDAPATAN', 'Freelance', 'Project desain website'),
  (v_user_id, '2026-03-25', 350000, 'BIAYA_OPERASIONAL', 'Belanja', 'Belanja bulanan Indomaret'),
  -- Februari 2026
  (v_user_id, '2026-02-01', 9500000, 'PENDAPATAN', 'Gaji', 'Gaji Bulanan Februari'),
  (v_user_id, '2026-02-05', 1500000, 'HUTANG', 'Cicilan', 'Cicilan Motor Februari'),
  (v_user_id, '2026-02-14', 450000, 'BIAYA_OPERASIONAL', 'Makan', 'Valentine dinner');

-- ===== 8. PAYMENTS (April 2026) =====
INSERT INTO payments (user_id, budget_item_id, month, year, planned_amount, actual_amount, is_paid, paid_date) VALUES
  (v_user_id, bi8, 4, 2026, 1500000, 1500000, TRUE,  '2026-04-05'),
  (v_user_id, bi7, 4, 2026, 150000,  150000,  TRUE,  '2026-04-01'),
  (v_user_id, bi6, 4, 2026, 250000,  0,       FALSE, NULL),
  (v_user_id, bi5, 4, 2026, 350000,  0,       FALSE, NULL);

-- ===== 9. SAVINGS GOALS =====
INSERT INTO savings_goals (id, user_id, name, target_amount, initial_amount, current_amount, monthly_contribution, start_date, target_date, icon, color) VALUES
  (sg1, v_user_id, 'Dana Darurat 6x', 96000000, 10000000, 49920000, 500000, '2024-01-01', '2027-01-01', '🛡️', '#6366f1'),
  (sg2, v_user_id, 'DP Rumah', 200000000, 5000000, 60000000, 2000000, '2024-06-01', '2028-12-01', '🏠', '#10b981'),
  (sg3, v_user_id, 'Liburan Japan', 30000000, 0, 19500000, 1500000, '2025-07-01', '2026-10-01', '✈️', '#f59e0b');

-- ===== 10. KPR SIMULATION (Contoh) =====
INSERT INTO kpr_simulations (user_id, name, property_price, down_payment, loan_principal, loan_period_years, fixed_rate, fixed_period_years, floating_rate, start_date, monthly_income) VALUES
  (v_user_id, 'Simulasi Rumah Subsidi Bekasi', 450000000, 90000000, 360000000, 20, 0.0750, 3, 0.1100, '2026-07-01', 11000000);

-- ===== 11. ANNUAL GOALS (2026) =====
INSERT INTO annual_goals (id, user_id, year, goal_text, is_completed, sort_order) VALUES
  (g1, v_user_id, 2026, 'Lunasi kartu kredit BNI sebelum Juni 2026', FALSE, 1),
  (g2, v_user_id, 2026, 'Capai 60% target dana darurat', FALSE, 2),
  (g3, v_user_id, 2026, 'Investasi minimal Rp 1 juta per bulan konsisten', FALSE, 3);

RAISE NOTICE '✅ Seed data berhasil dimasukkan untuk user: %', v_user_id;

END $$;
