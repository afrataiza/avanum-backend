import type {
  Reading,
  UpdateReadingStatusInput,
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

export class UpdateReadingStatusService {
  constructor(
    private readonly supabase: SupabaseClient,
  ) {}

  async execute(
    userId: string,
    input: UpdateReadingStatusInput,
  ) {
    const { data: reading, error } =
      await this.supabase.rpc("update_reading_status", {
        p_user_id: userId,
        p_reading_id: input.readingId,
        p_status: input.status,
      });

    if (error) {
      throw new Error(error.message);
    }

    return {
      reading,
    };
  }
}
