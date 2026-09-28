import {
  assertEquals,
  assertRejects,
} from "jsr:@std/assert";

import { UpdateReadingProgressService } from "./update-reading-progress-service.ts";
import type { ReadingRpcResult } from "./events/types.ts";
import type { Reading } from "./types.ts";

function createReading(
  overrides: Partial<Reading> = {},
): Reading {
  return {
    id: "reading-id",
    user_book_id: "user-book-id",
    format: "physical",
    total_units: 300,
    current_units: 100,
    status: "reading",
    started_at: "2026-09-02T18:00:00.000Z",
    paused_at: null,
    completed_at: null,
    created_at: "2026-09-02T18:00:00.000Z",
    updated_at: "2026-09-02T18:00:00.000Z",
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

Deno.test("updates reading progress and returns its event", async () => {
  const reading = createReading({ current_units: 150 });
  const resultData: ReadingRpcResult = {
    reading,
    events: [{
      eventId: "event-id",
      type: "reading_progressed",
      userId: "user-id",
      readingId: "reading-id",
      userBookId: "user-book-id",
      mediaType: "physical",
      previousUnits: 100,
      currentUnits: 150,
      deltaUnits: 50,
      occurredAt: reading.updated_at,
    }],
  };

  const service = new UpdateReadingProgressService(
    createMockSupabase(resultData),
  );

  const result = await service.execute("user-id", {
    readingId: "reading-id",
    currentUnits: 150,
  });

  assertEquals(result.reading, reading);
  assertEquals(result.events[0].deltaUnits, 50);
});

Deno.test("returns no events for a no-op progress update", async () => {
  const reading = createReading({ current_units: 150 });
  const service = new UpdateReadingProgressService(
    createMockSupabase({
      reading,
      events: [],
    }),
  );

  const result = await service.execute("user-id", {
    readingId: "reading-id",
    currentUnits: 150,
  });

  assertEquals(result.events, []);
});

Deno.test("returns progress and completion events when reading completes", async () => {
  const reading = createReading({
    current_units: 300,
    status: "completed",
    completed_at: "2026-09-02T19:00:00.000Z",
  });

  const service = new UpdateReadingProgressService(
    createMockSupabase({
      reading,
      events: [
        {
          eventId: "progress-event",
          type: "reading_progressed",
          userId: "user-id",
          readingId: "reading-id",
          userBookId: "user-book-id",
          mediaType: "physical",
          previousUnits: 250,
          currentUnits: 300,
          deltaUnits: 50,
          occurredAt: reading.updated_at,
        },
        {
          eventId: "completion-event",
          type: "reading_completed",
          userId: "user-id",
          readingId: "reading-id",
          userBookId: "user-book-id",
          mediaType: "physical",
          occurredAt: reading.completed_at!,
        },
      ],
    }),
  );

  const result = await service.execute("user-id", {
    readingId: "reading-id",
    currentUnits: 300,
  });

  assertEquals(result.events.map((event) => event.type), [
    "reading_progressed",
    "reading_completed",
  ]);
});

Deno.test("allows audiobook progress in minutes", async () => {
  const reading = createReading({
    format: "audiobook",
    total_units: 600,
    current_units: 240,
  });

  const service = new UpdateReadingProgressService(
    createMockSupabase({
      reading,
      events: [],
    }),
  );

  const result = await service.execute("user-id", {
    readingId: "reading-id",
    currentUnits: 240,
  });

  assertEquals(result.reading, reading);
});

Deno.test("rejects decreasing progress", async () => {
  const service = new UpdateReadingProgressService(
    createMockSupabase(null, {
      message: "Reading progress cannot decrease",
    }),
  );

  await assertRejects(
    () =>
      service.execute("user-id", {
        readingId: "reading-id",
        currentUnits: 99,
      }),
    Error,
    "Reading progress cannot decrease",
  );
});

Deno.test("rejects progress above total units", async () => {
  const service = new UpdateReadingProgressService(
    createMockSupabase(null, {
      message: "Current progress cannot exceed total units",
    }),
  );

  await assertRejects(
    () =>
      service.execute("user-id", {
        readingId: "reading-id",
        currentUnits: 301,
      }),
    Error,
    "Current progress cannot exceed total units",
  );
});

Deno.test("rejects paused reading", async () => {
  const service = new UpdateReadingProgressService(
    createMockSupabase(null, {
      message: "Reading cannot be updated with its current status",
    }),
  );

  await assertRejects(
    () =>
      service.execute("user-id", {
        readingId: "reading-id",
        currentUnits: 150,
      }),
    Error,
    "Reading cannot be updated with its current status",
  );
});

Deno.test("returns error when reading does not exist", async () => {
  const service = new UpdateReadingProgressService(
    createMockSupabase(null, { message: "Reading not found" }),
  );

  await assertRejects(
    () =>
      service.execute("user-id", {
        readingId: "unknown",
        currentUnits: 100,
      }),
    Error,
    "Reading not found",
  );
});
