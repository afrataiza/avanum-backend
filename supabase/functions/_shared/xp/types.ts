export type XPSource = string;

export interface XPBalance {
  user_id: string;
  total_xp: number;
  created_at: string;
  updated_at: string;
}

export interface XPTransaction {
  id: string;
  user_id: string;
  amount: number;
  source: XPSource;
  source_reference: string | null;
  idempotency_key: string;
  created_at: string;
}
