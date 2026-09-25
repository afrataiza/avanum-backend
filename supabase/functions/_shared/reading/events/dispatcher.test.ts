import { assertEquals } from "jsr:@std/assert";
import { ReadingEventDispatcher } from "./dispatcher.ts";
import type { ReadingDomainEvent } from "./types.ts";

const event: ReadingDomainEvent = {
  eventId: "event-id",
  type: "reading_started",
  userId: "user-id",
  readingId: "reading-id",
  userBookId: "user-book-id",
  mediaType: "physical",
  occurredAt: "2026-09-25T10:00:00.000Z",
};

Deno.test("dispatches events to registered handlers", async () => {
  const dispatcher = new ReadingEventDispatcher();
  const received: string[] = [];

  dispatcher.register({
    async handle(input) {
      received.push(input.eventId);
    },
  });

  dispatcher.register({
    async handle(input) {
      received.push(input.type);
    },
  });

  await dispatcher.dispatch([event]);

  assertEquals(received, ["event-id", "reading_started"]);
});

Deno.test("dispatches handlers in registration order", async () => {
  const dispatcher = new ReadingEventDispatcher();
  const sequence: number[] = [];

  dispatcher.register({
    async handle() {
      sequence.push(1);
    },
  });

  dispatcher.register({
    async handle() {
      sequence.push(2);
    },
  });

  await dispatcher.dispatch([event]);

  assertEquals(sequence, [1, 2]);
});
