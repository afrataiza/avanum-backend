import {
  assertEquals,
  assertRejects,
} from "jsr:@std/assert";

import { UpdateReadingStatusService } from "./update-reading-status-service.ts";
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

Deno.test("pauses a reading", async () => {
  const pausedReading = {
    ...reading,
    status: "paused" as const,
    paused_at: "2026-09-04T13:00:00.000Z",
  };

  const service = new UpdateReadingStatusService(
    createMockSupabase(pausedReading),
  );

  const result = await service.execute("user-id", {
    readingId: "reading-id",
    status: "paused",
  });

  assertEquals(result.reading, pausedReading);
});

Deno.test("resumes a paused reading", async () => {
  const resumedReading = {
    ...reading,
    status: "reading" as const,
    paused_at: null,
  };

  const service = new UpdateReadingStatusService(
    createMockSupabase(resumedReading),
  );

  const result = await service.execute("user-id", {
    readingId: "reading-id",
    status: "reading",
  });

  assertEquals(result.reading, resumedReading);
});

Deno.test("abandons a reading", async () => {
  const abandonedReading = {
    ...reading,
    status: "abandoned" as const,
    paused_at: null,
  };

  const service = new UpdateReadingStatusService(
    createMockSupabase(abandonedReading),
  );

  const result = await service.execute("user-id", {
    readingId: "reading-id",
    status: "abandoned",
  });

  assertEquals(result.reading, abandonedReading);
});

Deno.test("does not change a completed reading", async () => {
  const service = new UpdateReadingStatusService(
    createMockSupabase(
      null,
      { message: "Completed reading cannot change status" },
    ),
  );

  await assertRejects(
    () =>
      service.execute("user-id", {
        readingId: "reading-id",
        status: "paused",
      }),
    Error,
    "Completed reading cannot change status",
  );
});

Deno.test("does not change an abandoned reading", async () => {
  const service = new UpdateReadingStatusService(
    createMockSupabase(
      null,
      { message: "Abandoned reading cannot change status" },
    ),
  );

  await assertRejects(
    () =>
      service.execute("user-id", {
        readingId: "reading-id",
        status: "reading",
      }),
    Error,
    "Abandoned reading cannot change status",
  );
});

Deno.test("does not pause an already paused reading", async () => {
  const service = new UpdateReadingStatusService(
    createMockSupabase(
      null,
      { message: "Reading is already paused" },
    ),
  );

  await assertRejects(
    () =>
      service.execute("user-id", {
        readingId: "reading-id",
        status: "paused",
      }),
    Error,
    "Reading is already paused",
  );
});

Deno.test("does not activate an already active reading", async () => {
  const service = new UpdateReadingStatusService(
    createMockSupabase(
      null,
      { message: "Reading is already active" },
    ),
  );

  await assertRejects(
    () =>
      service.execute("user-id", {
        readingId: "reading-id",
        status: "reading",
      }),
    Error,
    "Reading is already active",
  );
});

Deno.test("returns error when reading does not exist", async () => {
  const service = new UpdateReadingStatusService(
    createMockSupabase(null, { message: "Reading not found" }),
  );

  await assertRejects(
    () =>
      service.execute("user-id", {
        readingId: "unknown",
        status: "paused",
      }),
    Error,
    "Reading not found",
  );
});
