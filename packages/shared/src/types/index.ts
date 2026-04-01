// packages/shared/src/types/index.ts
// All TypeScript types for the app

// ===== ASSET TYPES =====
export type AssetCategory = 'kas_setara_kas' | 'investasi' | 'tetap';
export type DebtTerm = 'jangka_pendek' | 'jangka_panjang';
export type CashflowDirection = 'masuk' | 'keluar';
export type CashflowCategory = 'pendapatan' | 'kewajiban_cicilan' | 'masa_depan_investasi' | 'kebutuhan_sehari_hari';
export type BudgetCategory = 'PENDAPATAN' | 'TABUNGAN_INVESTASI' | 'TAGIHAN' | 'BIAYA_OPERASIONAL' | 'HUTANG';
export type BudgetFrequency = 'bulanan' | 'tahunan';
export type HealthStatus = 'sehat' | 'warning' | 'bahaya';

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  category: AssetCategory;
  amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Debt {
  id: string;
  user_id: string;
  name: string;
  term: DebtTerm;
  total_amount: number;
  monthly_payment: number;
  interest_rate: number;
  due_date?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface NetWorthSnapshot {
  id: string;
  user_id: string;
  snapshot_date: string;
  total_assets: number;
  assets_kas: number;
  assets_investasi: number;
  assets_tetap: number;
  total_debts: number;
  debts_jangka_pendek: number;
  debts_jangka_panjang: number;
  net_worth: number;
  growth_percentage?: number;
  created_at: string;
}

export interface CashflowItem {
  id: string;
  user_id: string;
  name: string;
  direction: CashflowDirection;
  category: CashflowCategory;
  amount: number;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

export interface KPRSimulation {
  id: string;
  user_id: string;
  name: string;
  property_price: number;
  down_payment: number;
  loan_principal: number;
  loan_period_years: number;
  fixed_rate: number;
  fixed_period_years: number;
  floating_rate: number;
  floating_period_years?: number;
  remaining_principal_at_floating?: number;
  start_date?: string;
  monthly_income?: number;
  npoptkp: number;
  ppn_discount: number;
  ajb_rate: number;
  bbn_rate: number;
  notary_fee: number;
  bank_fee_1: number;
  bank_fee_2: number;
  bank_fee_3: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetItem {
  id: string;
  user_id: string;
  name: string;
  category: BudgetCategory;
  amount: number;
  frequency: BudgetFrequency;
  due_date?: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetPlan {
  id: string;
  user_id: string;
  month: number;
  year: number;
  budget_item_id: string;
  planned_amount: number;
  created_at: string;
  budget_items?: BudgetItem;
}

export interface Transaction {
  id: string;
  user_id: string;
  transaction_date: string;
  amount: number;
  category: BudgetCategory;
  subcategory?: string;
  description?: string;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  initial_amount: number;
  current_amount: number;
  monthly_contribution: number;
  start_date?: string;
  target_date?: string;
  icon?: string;
  color?: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface DebtDetail {
  id: string;
  user_id: string;
  name: string;
  total_amount: number;
  monthly_minimum: number;
  interest_rate_monthly: number;
  category?: string;
  start_date?: string;
  extra_monthly_payment: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  budget_item_id: string;
  month: number;
  year: number;
  planned_amount: number;
  actual_amount: number;
  is_paid: boolean;
  paid_date?: string;
  created_at: string;
}

export interface AnnualGoal {
  id: string;
  user_id: string;
  year: number;
  goal_text: string;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
}

// ===== CALCULATED RESULT TYPES =====
export interface NetWorthResult {
  totalAssets: number;
  totalDebts: number;
  netWorth: number;
  breakdown: {
    assets: {
      kas_setara_kas: number;
      investasi: number;
      tetap: number;
    };
    debts: {
      jangka_pendek: number;
      jangka_panjang: number;
    };
  };
}

export interface CashFlowResult {
  totalKasMasuk: number;
  totalKasKeluar: number;
  surplusDefisit: number;
  totalKewajiban: number;
  totalMasaDepan: number;
  totalKebutuhan: number;
}

export interface FinancialCheckupItem {
  name: string;
  formula: string;
  recommendation: string;
  value: number;
  status: HealthStatus;
  description?: string;
}

export interface AmortizationRow {
  period: number;
  date: Date;
  beginningBalance: number;
  principalPayment: number;
  interestPayment: number;
  totalPayment: number;
  endingBalance: number;
  phaseIndex?: number;   // 0 = Fix, 1..N = phase berjenjang, N+1 = Floating cap
  phaseLabel?: string;   // e.g. "Fix", "Transisi 1 (8%)", "Floating"
}

export interface KPRResult {
  schedule: AmortizationRow[];
  summary: {
    loanPrincipal: number;
    totalPrincipalPaid: number;
    totalInterestPaid: number;
    totalPaid: number;
    interestToPrincipalRatio: number;
    minInstallment: number;
    maxInstallment: number;
    remainingAtFloating: number;
  };
}

export interface KPRAdditionalCosts {
  bphtb: number;
  ppn: number;
  ajb: number;
  bbn: number;
  notaryFee: number;
  bankFees: number;
  total: number;
}

export interface SavingsProgress {
  totalSaved: number;
  remaining: number;
  progressPercent: number;
  monthsLeft: number | null;
  isCompleted: boolean;
}

export interface MonthlyOverview {
  carryOver: number;
  income: number;
  saved: number;
  spent: number;
  debtPaid: number;
  remainingBalance: number;
}

export interface BudgetLineItem {
  name: string;
  planned: number;
  actual: number;
}
