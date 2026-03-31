-- Supabase Migration: 001_initial_schema.sql
-- Jalankan di Supabase SQL Editor atau via supabase db push

-- ===== ENUMS =====
CREATE TYPE asset_category AS ENUM ('kas_setara_kas', 'investasi', 'tetap');
CREATE TYPE debt_term AS ENUM ('jangka_pendek', 'jangka_panjang');
CREATE TYPE cashflow_direction AS ENUM ('masuk', 'keluar');
CREATE TYPE cashflow_category_type AS ENUM ('pendapatan', 'kewajiban_cicilan', 'masa_depan_investasi', 'kebutuhan_sehari_hari');
CREATE TYPE budget_category AS ENUM ('PENDAPATAN', 'TABUNGAN_INVESTASI', 'TAGIHAN', 'BIAYA_OPERASIONAL', 'HUTANG');
CREATE TYPE budget_frequency AS ENUM ('bulanan', 'tahunan');

-- ===== USERS (extends Supabase auth.users) =====
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  currency TEXT DEFAULT 'IDR',
  locale TEXT DEFAULT 'id-ID',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: auto-create user row saat auth user baru dibuat
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== ASSETS =====
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category asset_category NOT NULL,
  amount DECIMAL(18,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_assets_user ON assets(user_id);

-- ===== DEBTS =====
CREATE TABLE debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  term debt_term NOT NULL,
  total_amount DECIMAL(18,2) DEFAULT 0,
  monthly_payment DECIMAL(18,2) DEFAULT 0,
  interest_rate DECIMAL(5,4) DEFAULT 0,
  due_date INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_debts_user ON debts(user_id);

-- ===== NET WORTH SNAPSHOTS =====
CREATE TABLE net_worth_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  snapshot_date DATE NOT NULL,
  total_assets DECIMAL(18,2) DEFAULT 0,
  assets_kas DECIMAL(18,2) DEFAULT 0,
  assets_investasi DECIMAL(18,2) DEFAULT 0,
  assets_tetap DECIMAL(18,2) DEFAULT 0,
  total_debts DECIMAL(18,2) DEFAULT 0,
  debts_jangka_pendek DECIMAL(18,2) DEFAULT 0,
  debts_jangka_panjang DECIMAL(18,2) DEFAULT 0,
  net_worth DECIMAL(18,2) DEFAULT 0,
  growth_percentage DECIMAL(8,6),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date)
);
CREATE INDEX idx_snapshots_user_date ON net_worth_snapshots(user_id, snapshot_date);

-- ===== CASHFLOW ITEMS =====
CREATE TABLE cashflow_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  direction cashflow_direction NOT NULL,
  category cashflow_category_type NOT NULL,
  amount DECIMAL(18,2) DEFAULT 0,
  is_recurring BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_cashflow_user ON cashflow_items(user_id);

-- ===== KPR SIMULATIONS =====
CREATE TABLE kpr_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT DEFAULT 'Simulasi KPR',
  property_price DECIMAL(18,2) NOT NULL,
  down_payment DECIMAL(18,2) NOT NULL,
  loan_principal DECIMAL(18,2) NOT NULL,
  loan_period_years INTEGER NOT NULL,
  fixed_rate DECIMAL(6,4) NOT NULL,
  fixed_period_years INTEGER NOT NULL,
  floating_rate DECIMAL(6,4) NOT NULL,
  floating_period_years INTEGER,
  remaining_principal_at_floating DECIMAL(18,2),
  start_date DATE,
  monthly_income DECIMAL(18,2),
  npoptkp DECIMAL(18,2) DEFAULT 75000000,
  ppn_discount DECIMAL(5,2) DEFAULT 1.0,
  ajb_rate DECIMAL(5,4) DEFAULT 0.01,
  bbn_rate DECIMAL(5,4) DEFAULT 0.02,
  notary_fee DECIMAL(18,2) DEFAULT 5000000,
  bank_fee_1 DECIMAL(18,2) DEFAULT 0,
  bank_fee_2 DECIMAL(18,2) DEFAULT 0,
  bank_fee_3 DECIMAL(18,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_kpr_user ON kpr_simulations(user_id);

-- ===== BUDGET ITEMS (Master) =====
CREATE TABLE budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category budget_category NOT NULL,
  amount DECIMAL(18,2) DEFAULT 0,
  frequency budget_frequency DEFAULT 'bulanan',
  due_date INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_budget_items_user ON budget_items(user_id, category);

-- ===== BUDGET PLANS (Rencana Bulanan) =====
CREATE TABLE budget_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  budget_item_id UUID REFERENCES budget_items(id) ON DELETE CASCADE NOT NULL,
  planned_amount DECIMAL(18,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month, year, budget_item_id)
);
CREATE INDEX idx_budget_plans_user_month ON budget_plans(user_id, year, month);

-- ===== TRANSACTIONS (Budget Tracking Harian) =====
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  transaction_date DATE NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  category budget_category NOT NULL,
  subcategory TEXT,
  description TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_user_category ON transactions(user_id, category);

-- ===== SAVINGS GOALS =====
CREATE TABLE savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_amount DECIMAL(18,2) NOT NULL,
  initial_amount DECIMAL(18,2) DEFAULT 0,
  current_amount DECIMAL(18,2) DEFAULT 0,
  monthly_contribution DECIMAL(18,2) DEFAULT 0,
  start_date DATE,
  target_date DATE,
  icon TEXT,
  color TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_savings_user ON savings_goals(user_id);

-- ===== DEBT DETAILS (Rincian Hutang) =====
CREATE TABLE debt_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  total_amount DECIMAL(18,2) NOT NULL,
  monthly_minimum DECIMAL(18,2) DEFAULT 0,
  interest_rate_monthly DECIMAL(6,4) DEFAULT 0,
  category TEXT,
  start_date DATE,
  extra_monthly_payment DECIMAL(18,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== PAYMENTS (Tracker Pembayaran 12 Bulan) =====
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  budget_item_id UUID REFERENCES budget_items(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  planned_amount DECIMAL(18,2) DEFAULT 0,
  actual_amount DECIMAL(18,2) DEFAULT 0,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, budget_item_id, month, year)
);
CREATE INDEX idx_payments_user_month ON payments(user_id, year, month);

-- ===== ANNUAL GOALS =====
CREATE TABLE annual_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  goal_text TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== ROW LEVEL SECURITY =====
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE net_worth_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashflow_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpr_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE annual_goals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "user_own_data" ON public.users FOR ALL USING (auth.uid() = id);
CREATE POLICY "user_own_assets" ON assets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_debts" ON debts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_snapshots" ON net_worth_snapshots FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_cashflow" ON cashflow_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_kpr" ON kpr_simulations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_budget_items" ON budget_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_budget_plans" ON budget_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_transactions" ON transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_savings" ON savings_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_debt_details" ON debt_details FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_payments" ON payments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_annual_goals" ON annual_goals FOR ALL USING (auth.uid() = user_id);

-- ===== UPDATED_AT TRIGGER =====
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON debts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON cashflow_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON kpr_simulations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON budget_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON savings_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON debt_details FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
