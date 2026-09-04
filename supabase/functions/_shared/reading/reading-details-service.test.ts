import {
  assertEquals,
  assertRejects,
} from "jsr:@std/assert";

import { ReadingDetailsService } from "./reading-details-service.ts";
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

const reading: Reading = {
  id: "reading-id",
  user_book_id: "user-book-id",
  format: "physical",
  total_units: 278,
  current_units: 120,
  status: "reading",
  started_at: "2026-09-04T12:00:00.000Z",
  paused_at: null,
  completed_at: null,
  created_at: "2026-09-04T12:00:00.000Z",
  updated_at: "2026-09-04T12:00:00.000Z",
};

Deno.test("returns a reading", async () => {
  const service = new ReadingDetailsService(
    createMockSupabase(reading),
  );

  const result = await service.execute("user-id", "reading-id");

  assertEquals(result.reading, reading);
});

Deno.test("returns a paused reading", async () => {
  const pausedReading = {
    ...reading,
    status: "paused" as const,
    paused_at: "2026-09-04T13:00:00.000Z",
  };

  const service = new ReadingDetailsService(
    createMockSupabase(pausedReading),
  );

  const result = await service.execute("user-id", "reading-id");

  assertEquals(result.reading, pausedReading);
});

Deno.test("returns an abandoned reading", async () => {
  const abandonedReading = {
    ...reading,
    status: "abandoned" as const,
  };

  const service = new ReadingDetailsService(
    createMockSupabase(abandonedReading),
  );

  const result = await service.execute("user-id", "reading-id");

  assertEquals(result.reading, abandonedReading);
});

Deno.test("returns a completed reading", async () => {
  const completedReading = {
    ...reading,
    current_units: 278,
    status: "completed" as const,
    completed_at: "2026-09-04T14:00:00.000Z",
  };

  const service = new ReadingDetailsService(
    createMockSupabase(completedReading),
  );

  const result = await service.execute("user-id", "reading-id");

  assertEquals(result.reading, completedReading);
});

Deno.test("returns error when reading does not exist", async () => {
  const service = new ReadingDetailsService(
    createMockSupabase(null, { message: "Reading not found" }),
  );

  await assertRejects(
    () => service.execute("user-id", "unknown"),
    Error,
    "Reading not found",
  );
});

Deno.test("returns an RPC error", async () => {
  const service = new ReadingDetailsService(
    createMockSupabase(null, { message: "Database unavailable" }),
  );

  await assertRejects(
    () => service.execute("user-id", "reading-id"),
    Error,
    "Database unavailable",
  );
});
