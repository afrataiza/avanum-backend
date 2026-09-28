import { assertEquals } from "jsr:@std/assert";
import {
  ExpeditionReadingEventHandler,
  type ExpeditionReadingEventDependencies,
} from "./reading-event-handler.ts";
import type { UserExpeditionWithDefinition } from "./types.ts";
import type { ReadingDomainEvent } from "../reading/events/types.ts";

function expedition(
  objectiveType: UserExpeditionWithDefinition["expedition"]["objective_type"],
  overrides: Partial<UserExpeditionWithDefinition> = {},
): UserExpeditionWithDefinition {
  return {
    id: crypto.randomUUID(),
    user_id: "user-id",
    expedition_id: crypto.randomUUID(),
    current_value: 0,
    status: "active",
    started_at: "2026-09-25T10:00:00.000Z",
    completed_at: null,
    cancelled_at: null,
    created_at: "2026-09-25T10:00:00.000Z",
    updated_at: "2026-09-25T10:00:00.000Z",
    ...overrides,
    expedition: {
      id: crypto.randomUUID(),
      created_by: "user-id",
      name: "Expedição",
      description: null,
      objective_type: objectiveType,
      target_value: 100,
      starts_at: null,
      ends_at: null,
      active: true,
      created_at: "2026-09-25T10:00:00.000Z",
      updated_at: "2026-09-25T10:00:00.000Z",
    },
  };
}

function event(
  overrides: Partial<Extract<ReadingDomainEvent, { type: "reading_progressed" }>> = {},
): ReadingDomainEvent {
  return {
    eventId: "event-id",
    type: "reading_progressed",
    userId: "user-id",
    readingId: "reading-id",
    userBookId: "user-book-id",
    mediaType: "physical",
    previousUnits: 25,
    currentUnits: 40,
    deltaUnits: 15,
    occurredAt: "2026-09-25T10:00:00.000Z",
    ...overrides,
  };
}

function createDependencies(
  expeditions: UserExpeditionWithDefinition[],
) {
  const calls: Array<Record<string, unknown>> = [];

  const dependencies: ExpeditionReadingEventDependencies = {
    query: {
      async listUserExpeditions() {
        return expeditions;
      },
    },
    progress: {
      async applyProgress(_userId, input) {
        calls.push(input);
        return { already_applied: false };
      },
    },
  };

  return { dependencies, calls };
}

Deno.test("maps physical reading progress to pages_read", async () => {
  const { dependencies, calls } = createDependencies([
    expedition("pages_read"),
  ]);
  const handler = new ExpeditionReadingEventHandler(dependencies);

  await handler.handle(event());

  assertEquals(calls.length, 1);
  assertEquals(calls[0].amount, 15);
  assertEquals(calls[0].source, "reading_progressed");
  assertEquals(calls[0].sourceReference, "reading-id");
  assertEquals(calls[0].idempotencyKey, "reading:reading-id:progress:40");
});

Deno.test("maps audiobook progress to minutes_listened", async () => {
  const { dependencies, calls } = createDependencies([
    expedition("minutes_listened"),
  ]);
  const handler = new ExpeditionReadingEventHandler(dependencies);

  await handler.handle(event({ mediaType: "audiobook" }));

  assertEquals(calls.length, 1);
  assertEquals(calls[0].amount, 15);
});

Deno.test("maps completion to books_completed", async () => {
  const { dependencies, calls } = createDependencies([
    expedition("books_completed"),
  ]);
  const handler = new ExpeditionReadingEventHandler(dependencies);

  await handler.handle({
    eventId: "completion-event",
    type: "reading_completed",
    userId: "user-id",
    readingId: "reading-id",
    userBookId: "user-book-id",
    mediaType: "ebook",
    occurredAt: "2026-09-25T10:00:00.000Z",
  });

  assertEquals(calls.length, 1);
  assertEquals(calls[0].amount, 1);
  assertEquals(calls[0].source, "reading_completed");
  assertEquals(calls[0].idempotencyKey, "reading:reading-id:completed");
});

Deno.test("updates all matching active expeditions", async () => {
  const { dependencies, calls } = createDependencies([
    expedition("pages_read"),
    expedition("pages_read"),
    expedition("books_completed"),
  ]);
  const handler = new ExpeditionReadingEventHandler(dependencies);

  await handler.handle(event());

  assertEquals(calls.length, 2);
  assertEquals(calls[0].amount, 15);
  assertEquals(calls[1].amount, 15);
});

Deno.test("ignores non-matching, completed and inactive expeditions", async () => {
  const { dependencies, calls } = createDependencies([
    expedition("minutes_listened"),
    expedition("pages_read", { status: "completed" }),
    expedition("pages_read", {
      expedition: {
        ...expedition("pages_read").expedition,
        active: false,
      },
    }),
  ]);
  const handler = new ExpeditionReadingEventHandler(dependencies);

  await handler.handle(event());

  assertEquals(calls.length, 0);
});

Deno.test("ignores reading_started", async () => {
  const { dependencies, calls } = createDependencies([
    expedition("pages_read"),
    expedition("books_completed"),
    expedition("minutes_listened"),
  ]);
  const handler = new ExpeditionReadingEventHandler(dependencies);

  await handler.handle({
    eventId: "start-event",
    type: "reading_started",
    userId: "user-id",
    readingId: "reading-id",
    userBookId: "user-book-id",
    mediaType: "physical",
    occurredAt: "2026-09-25T10:00:00.000Z",
  });

  assertEquals(calls.length, 0);
});
