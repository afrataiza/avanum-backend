import type { Reading } from "./types.ts";

interface SupabaseClient {
  rpc(
    functionName: string,
    params: Record<string, unknown>,
  ): PromiseLike<{
    data: Reading | null;
    error: { message: string } | null;
  }>;
}

export class ReadingDetailsService {
  constructor(
    private readonly supabase: SupabaseClient,
  ) {}

  async execute(userId: string, readingId: string) {
    const { data: reading, error } = await this.supabase.rpc(
      "get_reading",
      {
        p_user_id: userId,
        p_reading_id: readingId,
      },
    );

    if (error) {
      throw new Error(error.message);
    }

    if (!reading) {
      throw new Error("Reading not found");
    }

    return { reading };
  }
}
