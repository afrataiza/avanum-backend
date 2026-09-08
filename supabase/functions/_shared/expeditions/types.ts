export type ExpeditionObjectiveType =
  | "books_completed"
  | "pages_read"
  | "minutes_listened";

export type ExpeditionStatus = "active" | "completed" | "cancelled";

export interface Expedition {
  id: string;
  created_by: string | null;
  name: string;
  description: string | null;
  objective_type: ExpeditionObjectiveType;
  target_value: number;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserExpedition {
  id: string;
  user_id: string;
  expedition_id: string;
  current_value: number;
  status: ExpeditionStatus;
  started_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserExpeditionWithDefinition extends UserExpedition {
  expedition: Expedition;
}

export interface CreateExpeditionInput {
  name: string;
  description?: string | null;
  objectiveType: ExpeditionObjectiveType;
  targetValue: number;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface ApplyExpeditionProgressInput {
  userExpeditionId: string;
  amount: number;
  source: string;
  sourceReference?: string | null;
  idempotencyKey: string;
}
