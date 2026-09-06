export type XPSource =
  | "reading_started"
  | "reading_progress"
  | "reading_completed"
  | "achievement"
  | "expedition";

export interface XPBalance {
  id: string;
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
  source_id: string | null;
  created_at: string;
}
