import {
  assertEquals,
  assertRejects,
} from "jsr:@std/assert";

import { StartReadingService } from "./start-reading-service.ts";
import type { ReadingRpcResult } from "./events/types.ts";
import type { Reading } from "./types.ts";

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
  data: ReadingRpcResult | null = null,
  error: { message: string } | null = null,
) {
  return {
    rpc: (
      _functionName: string,
      _params: Record<string, unknown>,
    ) => Promise.resolve({ data, error }),
  };
}

const startedEvent = {
  eventId: "event-id",
  type: "reading_started" as const,
  userId: "user-id",
  readingId: "reading-id",
  userBookId: "user-book-id",
  mediaType: "physical" as const,
  occurredAt: "2026-08-27T21:00:00.000Z",
};

Deno.test("starts a reading and returns domain events", async () => {
  const reading = createReading();
  const resultData: ReadingRpcResult = {
    reading,
    events: [startedEvent],
  };
  const service = new StartReadingService(createMockSupabase(resultData));

  const result = await service.execute(
    "user-id",
    {
      userBookId: "user-book-id",
      format: "physical",
      totalUnits: 278,
    },
  );

  assertEquals(result.reading, reading);
  assertEquals(result.events, [startedEvent]);
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
