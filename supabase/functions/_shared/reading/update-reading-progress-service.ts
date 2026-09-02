import type {
  Reading,
  UpdateReadingProgressInput,
} from "./types.ts";

interface SupabaseClient {
  rpc(
    functionName: string,
    params: Record<string, unknown>,
  ): PromiseLike<{
    data: Reading | null;
    error: { message: string } | null;
  }>;
}

export class UpdateReadingProgressService {
  constructor(
    private readonly supabase: SupabaseClient,
  ) {}

  async execute(
    userId: string,
    input: UpdateReadingProgressInput,
  ) {
    const { data: reading, error } =
      await this.supabase.rpc("update_reading_progress", {
        p_user_id: userId,
        p_reading_id: input.readingId,
        p_current_units: input.currentUnits,
      });

    if (error) {
      throw new Error(error.message);
    }

    return {
      reading,
    };
  }
}
