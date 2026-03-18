export interface RoyaltyRow {
  income_type: string;
  during_term_pct: number;
  post_term_pct: number;
}

export interface DealData {
  deal_title: string | null;
  date: string | null;
  status: string | null;
  term_years: number | null;
  term_notes: string | null;
  early_exit: string | null;
  catalog_reversion: string | null;
  unexploited_reversion: string | null;
  scope_existing: string | null;
  scope_new: string | null;
  territory: string | null;
  royalty_calculation: string | null;
  advance_initial_usd: number | null;
  advance_initial_notes: string | null;
  advance_rollover_usd: number | null;
  advance_rollover_conditions: string | null;
  recoupment_rate: number | null;
  royalties: RoyaltyRow[] | null;
  accounting_frequency: string | null;
  accounting_days: number | null;
  pipeline_calc_available: boolean | null;
  audit_rights: string | null;
  additional_notes: string | null;
}

export interface StoredDeal {
  id: string;
  created_at: string;
  data: DealData;
}
