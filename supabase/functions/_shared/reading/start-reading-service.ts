import type {
  Reading,
  StartReadingInput,
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

export class StartReadingService {
  constructor(
    private readonly supabase: SupabaseClient,
  ) {}

  async execute(
    userId: string,
    input: StartReadingInput,
  ) {
    const { data: reading, error } =
      await this.supabase.rpc("start_reading", {
        p_user_id: userId,
        p_user_book_id: input.userBookId,
        p_format: input.format,
        p_total_units: input.totalUnits,
      });

    if (error) {
      throw new Error(error.message);
    }

    return {
      reading,
    };
  }
}