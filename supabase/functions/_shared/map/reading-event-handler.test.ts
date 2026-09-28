import { assertEquals } from "jsr:@std/assert";

import {
  MapReadingEventHandler,
  type MapNodeQueryPort,
  type MapProgressPort,
} from "./reading-event-handler.ts";
import type { MapNodeWithProgress } from "./types.ts";
import type { ReadingDomainEvent } from "../reading/events/types.ts";

function node(overrides: Partial<MapNodeWithProgress> = {}): MapNodeWithProgress {
  return {
    id: "node-id",
    region_id: "region-id",
    slug: "first-step",
    name: "Primeiro Passo",
    description: null,
    unlock_type: "reading_started",
    unlock_reference: null,
    position_x: 80,
    position_y: 120,
    sort_order: 1,
    created_at: "2026-09-28T00:00:00.000Z",
    updated_at: "2026-09-28T00:00:00.000Z",
    progress: {
      user_id: "user-id",
      node_id: "node-id",
      status: "locked",
      unlocked_at: null,
      explored_at: null,
      source: null,
      source_reference: null,
      created_at: "2026-09-28T00:00:00.000Z",
      updated_at: "2026-09-28T00:00:00.000Z",
    },
    ...overrides,
  };
}

function event(
  type: ReadingDomainEvent["type"],
): ReadingDomainEvent {
  const base = {
    eventId: "event-id",
    type,
    userId: "user-id",
    readingId: "reading-id",
    userBookId: "user-book-id",
    mediaType: "ebook" as const,
    occurredAt: "2026-09-28T00:00:00.000Z",
  };

  if (type === "reading_started") {
    return base as ReadingDomainEvent;
  }

  if (type === "reading_completed") {
    return base as ReadingDomainEvent;
  }

  return {
    ...base,
    previousUnits: 0,
    currentUnits: 10,
    deltaUnits: 10,
  };
}

class FakeQuery implements MapNodeQueryPort {
  constructor(private readonly nodes: MapNodeWithProgress[]) {}
  async listNodes() {
    return this.nodes;
  }
}

class FakeProgress implements MapProgressPort {
  calls: Array<Record<string, unknown>> = [];

  async applyProgress(input: Record<string, unknown>) {
    this.calls.push(input);
  }
}

Deno.test("unlocks first step on reading_started", async () => {
  const progress = new FakeProgress();
  const handler = new MapReadingEventHandler({
    query: new FakeQuery([node()]),
    progress,
  });

  await handler.handle(event("reading_started"));

  assertEquals(progress.calls, [{
    userId: "user-id",
    nodeId: "node-id",
    targetStatus: "discovered",
    source: "reading_started",
    sourceReference: "reading-id",
  }]);
});

Deno.test("unlocks first reading on reading_completed", async () => {
  const progress = new FakeProgress();
  const handler = new MapReadingEventHandler({
    query: new FakeQuery([
      node({
        id: "reading-node",
        slug: "first-reading",
        name: "Primeira Leitura",
        unlock_type: "reading_completed",
        position_x: 180,
        position_y: 120,
        sort_order: 2,
      }),
    ]),
    progress,
  });

  await handler.handle(event("reading_completed"));

  assertEquals(progress.calls, [{
    userId: "user-id",
    nodeId: "reading-node",
    targetStatus: "discovered",
    source: "reading_completed",
    sourceReference: "reading-id",
  }]);
});

Deno.test("ignores nodes for different unlock events", async () => {
  const progress = new FakeProgress();
  const handler = new MapReadingEventHandler({
    query: new FakeQuery([
      node({
        unlock_type: "reading_completed",
      }),
    ]),
    progress,
  });

  await handler.handle(event("reading_started"));

  assertEquals(progress.calls, []);
});

Deno.test("ignores reading_progressed until a matching progress rule exists", async () => {
  const progress = new FakeProgress();
  const handler = new MapReadingEventHandler({
    query: new FakeQuery([node()]),
    progress,
  });

  await handler.handle(event("reading_progressed"));

  assertEquals(progress.calls, []);
});
