import type {
  ApplyExpeditionProgressInput,
  CreateExpeditionInput,
  ExpeditionObjectiveType,
} from "./types.ts";

const OBJECTIVE_TYPES: ExpeditionObjectiveType[] = [
  "books_completed",
  "pages_read",
  "minutes_listened",
];

export class ExpeditionService {
  constructor(private readonly supabase: any) {}

  async create(userId: string, input: CreateExpeditionInput) {
    this.validateUserId(userId);
    this.validateCreateInput(input);

    const { data, error } = await this.supabase.rpc("create_expedition", {
      p_user_id: userId,
      p_name: input.name,
      p_description: input.description ?? null,
      p_objective_type: input.objectiveType,
      p_target_value: input.targetValue,
      p_starts_at: input.startsAt ?? null,
      p_ends_at: input.endsAt ?? null,
    });

    if (error) {
      throw new Error(error.message || "Failed to create expedition");
    }

    return data;
  }

  async applyProgress(userId: string, input: ApplyExpeditionProgressInput) {
    this.validateUserId(userId);

    if (!input.userExpeditionId?.trim()) {
      throw new Error("User expedition id is required");
    }
    if (!Number.isInteger(input.amount) || input.amount <= 0) {
      throw new Error("Progress amount must be a positive integer");
    }
    if (!input.source?.trim()) {
      throw new Error("Progress source is required");
    }
    if (!input.idempotencyKey?.trim()) {
      throw new Error("Idempotency key is required");
    }

    const { data, error } = await this.supabase.rpc("apply_expedition_progress", {
      p_user_id: userId,
      p_user_expedition_id: input.userExpeditionId,
      p_amount: input.amount,
      p_source: input.source,
      p_source_reference: input.sourceReference ?? null,
      p_idempotency_key: input.idempotencyKey,
    });

    if (error) {
      throw new Error(error.message || "Failed to apply expedition progress");
    }

    return data;
  }

  async cancel(userId: string, userExpeditionId: string) {
    this.validateUserId(userId);
    if (!userExpeditionId?.trim()) {
      throw new Error("User expedition id is required");
    }

    const { data, error } = await this.supabase.rpc("cancel_expedition", {
      p_user_id: userId,
      p_user_expedition_id: userExpeditionId,
    });

    if (error) {
      throw new Error(error.message || "Failed to cancel expedition");
    }

    return data;
  }

  private validateUserId(userId: string) {
    if (!userId?.trim()) {
      throw new Error("User id is required");
    }
  }

  private validateCreateInput(input: CreateExpeditionInput) {
    if (!input.name?.trim()) {
      throw new Error("Expedition name is required");
    }
    if (!OBJECTIVE_TYPES.includes(input.objectiveType)) {
      throw new Error("Invalid expedition objective type");
    }
    if (!Number.isInteger(input.targetValue) || input.targetValue <= 0) {
      throw new Error("Expedition target must be a positive integer");
    }
    if (input.startsAt && Number.isNaN(Date.parse(input.startsAt))) {
      throw new Error("Invalid expedition start date");
    }
    if (input.endsAt && Number.isNaN(Date.parse(input.endsAt))) {
      throw new Error("Invalid expedition end date");
    }
    if (input.startsAt && input.endsAt && new Date(input.endsAt) <= new Date(input.startsAt)) {
      throw new Error("Expedition end must be after start");
    }
  }
}
