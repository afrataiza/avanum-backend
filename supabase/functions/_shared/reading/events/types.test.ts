import { assertEquals, assertRejects } from "jsr:@std/assert";
import {
  createReadingCompletedEvent,
  createReadingProgressedEvent,
  createReadingStartedEvent,
} from "./types.ts";

Deno.test("creates a reading started event", () => {
  const event = createReadingStartedEvent({
    userId: "user-id",
    readingId: "reading-id",
    userBookId: "user-book-id",
    mediaType: "physical",
    occurredAt: "2026-09-25T10:00:00.000Z",
  });

  assertEquals(event.type, "reading_started");
  assertEquals(event.userId, "user-id");
  assertEquals(event.mediaType, "physical");
  assertEquals(typeof event.eventId, "string");
});

Deno.test("creates a progressed event with delta", () => {
  const event = createReadingProgressedEvent({
    userId: "user-id",
    readingId: "reading-id",
    userBookId: "user-book-id",
    mediaType: "ebook",
    previousUnits: 25,
    currentUnits: 40,
    occurredAt: "2026-09-25T10:00:00.000Z",
  });

  assertEquals(event.type, "reading_progressed");
  assertEquals(event.previousUnits, 25);
  assertEquals(event.currentUnits, 40);
  assertEquals(event.deltaUnits, 15);
});

Deno.test("rejects non-increasing progress event", async () => {
  await assertRejects(
    () =>
      Promise.resolve(
        createReadingProgressedEvent({
          userId: "user-id",
          readingId: "reading-id",
          userBookId: "user-book-id",
          mediaType: "physical",
          previousUnits: 40,
          currentUnits: 40,
          occurredAt: "2026-09-25T10:00:00.000Z",
        }),
      ),
    Error,
    "Reading progress event requires increased progress",
  );
});

Deno.test("creates a completed event", () => {
  const event = createReadingCompletedEvent({
    userId: "user-id",
    readingId: "reading-id",
    userBookId: "user-book-id",
    mediaType: "audiobook",
    occurredAt: "2026-09-25T10:00:00.000Z",
  });

  assertEquals(event.type, "reading_completed");
  assertEquals(event.mediaType, "audiobook");
});
