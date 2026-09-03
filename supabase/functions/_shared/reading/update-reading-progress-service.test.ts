import {
  assertEquals,
  assertRejects,
} from "jsr:@std/assert";

import { UpdateReadingProgressService } from "./update-reading-progress-service.ts";
import type { Reading } from "./types.ts";

function createMockSupabase(
  reading: Reading | null = null,
  error: { message: string } | null = null,
) {
  return {
    rpc: (
      _functionName: string,
      _params: Record<string, unknown>,
    ) => Promise.resolve({
      data: reading,
      error,
    }),
  };
}

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

Deno.test("updates reading progress", async () => {
  const reading = createReading({ current_units: 150 });
  const supabase = createMockSupabase(reading);
  const service = new UpdateReadingProgressService(supabase);

  const result = await service.execute("user-id", {
    readingId: "reading-id",
    currentUnits: 150,
  });

  assertEquals(result.reading, reading);
});

Deno.test("allows audiobook progress in minutes", async () => {
  const reading = createReading({
    format: "audiobook",
    total_units: 600,
    current_units: 240,
  });
  const supabase = createMockSupabase(reading);
  const service = new UpdateReadingProgressService(supabase);

  const result = await service.execute("user-id", {
    readingId: "reading-id",
    currentUnits: 240,
  });

  assertEquals(result.reading, reading);
});

Deno.test("completes reading when total units are reached", async () => {
  const reading = createReading({
    current_units: 300,
    status: "completed",
    completed_at: "2026-09-02T19:00:00.000Z",
  });
  const supabase = createMockSupabase(reading);
  const service = new UpdateReadingProgressService(supabase);

  const result = await service.execute("user-id", {
    readingId: "reading-id",
    currentUnits: 300,
  });

  assertEquals(result.reading, reading);
});

Deno.test("rejects decreasing progress", async () => {
  const supabase = createMockSupabase(
    null,
    { message: "Reading progress cannot decrease" },
  );
  const service = new UpdateReadingProgressService(supabase);

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
  const supabase = createMockSupabase(
    null,
    { message: "Current progress cannot exceed total units" },
  );
  const service = new UpdateReadingProgressService(supabase);

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
  const supabase = createMockSupabase(
    null,
    { message: "Reading cannot be updated with its current status" },
  );
  const service = new UpdateReadingProgressService(supabase);

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

Deno.test("rejects abandoned reading", async () => {
  const supabase = createMockSupabase(
    null,
    { message: "Reading cannot be updated with its current status" },
  );
  const service = new UpdateReadingProgressService(supabase);

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

Deno.test("rejects completed reading", async () => {
  const supabase = createMockSupabase(
    null,
    { message: "Reading cannot be updated with its current status" },
  );
  const service = new UpdateReadingProgressService(supabase);

  await assertRejects(
    () =>
      service.execute("user-id", {
        readingId: "reading-id",
        currentUnits: 300,
      }),
    Error,
    "Reading cannot be updated with its current status",
  );
});

Deno.test("returns error when reading does not exist", async () => {
  const supabase = createMockSupabase(
    null,
    { message: "Reading not found" },
  );
  const service = new UpdateReadingProgressService(supabase);

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
