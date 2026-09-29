import {
  assertEquals,
  assertRejects,
} from "jsr:@std/assert";

import { StartReadingService } from "./start-reading-service.ts";
import type { Reading } from "./types.ts";
import type { ReadingRpcResult } from "./events/types.ts";

function createReading(overrides: Partial<Reading> = {}): Reading {
  return {
    id: "reading-id",
    user_book_id: "user-book-id",
    format: "physical",
    total_units: 278,
    current_units: 0,
    status: "reading",
    started_at: "2026-08-27T21:00:00.000Z",
    paused_at: null,
    completed_at: null,
    created_at: "2026-08-27T21:00:00.000Z",
    updated_at: "2026-08-27T21:00:00.000Z",
    ...overrides,
  };
}

function createMockSupabase(
  rpcResult: ReadingRpcResult | null = null,
  error: { message: string } | null = null,
) {
  return {
    rpc: (
      _functionName: string,
      _params: Record<string, unknown>,
    ) => Promise.resolve({
      data: rpcResult,
      error,
    }),
  };
}

Deno.test("starts a reading", async () => {
  const reading: Reading = {
    id: "reading-id",
    user_book_id: "user-book-id",
    format: "physical",
    total_units: 278,
    current_units: 0,
    status: "reading",
    started_at: "2026-08-27T21:00:00.000Z",
    paused_at: null,
    completed_at: null,
    created_at: "2026-08-27T21:00:00.000Z",
    updated_at: "2026-08-27T21:00:00.000Z",
  };

  const supabase = createMockSupabase({
    reading,
    events: [{
      eventId: "event-id",
      type: "reading_started",
      userId: "user-id",
      readingId: reading.id,
      userBookId: reading.user_book_id,
      mediaType: reading.format,
      occurredAt: reading.started_at,
    }],
  });

  const service = new StartReadingService(supabase);

  const result = await service.execute(
    "user-id",
    {
      userBookId: "user-book-id",
      format: "physical",
      totalUnits: 278,
    },
  );

  assertEquals(result.reading, reading);
  assertEquals(result.events.length, 1);
  assertEquals(result.events[0].type, "reading_started");
});

Deno.test(
  "does not start a book with an active reading",
  async () => {
    const service = new StartReadingService(
      createMockSupabase(null, {
        message: "User book already has an active reading",
      }),
    );

    await assertRejects(
      () =>
        service.execute(
          "user-id",
          {
            userBookId: "user-book-id",
            format: "physical",
            totalUnits: 278,
          },
        ),
      Error,
      "User book already has an active reading",
    );
  },
);

Deno.test(
  "does not start a completed book",
  async () => {
    const service = new StartReadingService(
      createMockSupabase(null, {
        message: "Book cannot be started with its current status",
      }),
    );

    await assertRejects(
      () =>
        service.execute(
          "user-id",
          {
            userBookId: "user-book-id",
            format: "physical",
            totalUnits: 278,
          },
        ),
      Error,
      "Book cannot be started with its current status",
    );
  },
);

Deno.test(
  "returns error when user book does not exist",
  async () => {
    const service = new StartReadingService(
      createMockSupabase(null, {
        message: "User book not found",
      }),
    );

    await assertRejects(
      () =>
        service.execute(
          "user-id",
          {
            userBookId: "unknown",
            format: "physical",
            totalUnits: 278,
          },
        ),
      Error,
      "User book not found",
    );
  },
);
