import type {
  ReadingRpcResult,
  ReadingDomainEvent,
} from "./events/types.ts";
import type { UpdateReadingProgressInput } from "./types.ts";

interface SupabaseClient {
  rpc(
    functionName: string,
    params: Record<string, unknown>,
  ): PromiseLike<{
    data: ReadingRpcResult | null;
    error: { message: string } | null;
  }>;
}

export class UpdateReadingProgressService {
  constructor(private readonly supabase: SupabaseClient) {}

  async execute(
    userId: string,
    input: UpdateReadingProgressInput,
  ): Promise<ReadingRpcResult> {
    const { data, error } = await this.supabase.rpc(
      "update_reading_progress",
      {
        p_user_id: userId,
        p_reading_id: input.readingId,
        p_current_units: input.currentUnits,
      },
    );

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Reading progress update returned no data");
    }

    return {
      reading: data.reading,
      events: data.events as ReadingDomainEvent[],
    };
  }
}
