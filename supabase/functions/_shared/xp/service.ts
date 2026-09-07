import type { XPSource, XPTransaction } from "./types.ts";

export interface GrantXPInput {
  userId: string;
  amount: number;
  source: XPSource;
  sourceReference?: string | null;
  idempotencyKey: string;
}

export interface GrantXPResult {
  transaction: XPTransaction;
  totalXp: number;
  alreadyGranted: boolean;
}

export interface XPGrantClient {
  rpc(
    fn: "grant_xp",
    args: {
      p_user_id: string;
      p_amount: number;
      p_source: string;
      p_source_reference: string | null;
      p_idempotency_key: string;
    },
  ): PromiseLike<{ data: XPGrantRow | null; error: unknown }>;
}

interface XPGrantRow {
  transaction: XPTransaction;
  total_xp: number;
  already_granted: boolean;
}

export class XPService {
  constructor(private readonly client: XPGrantClient) {}

  async grant(input: GrantXPInput): Promise<GrantXPResult> {
    if (!Number.isInteger(input.amount) || input.amount <= 0) {
      throw new Error("XP amount must be a positive integer");
    }

    if (!input.userId) {
      throw new Error("User id is required");
    }

    if (!input.source) {
      throw new Error("XP source is required");
    }

    if (!input.idempotencyKey) {
      throw new Error("XP idempotency key is required");
    }

    const { data, error } = await this.client.rpc("grant_xp", {
      p_user_id: input.userId,
      p_amount: input.amount,
      p_source: input.source,
      p_source_reference: input.sourceReference ?? null,
      p_idempotency_key: input.idempotencyKey,
    });

    if (error) throw error;
    if (!data) throw new Error("XP grant returned no data");

    return {
      transaction: data.transaction,
      totalXp: data.total_xp,
      alreadyGranted: data.already_granted,
    };
  }
}
