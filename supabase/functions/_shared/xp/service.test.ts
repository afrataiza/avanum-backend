import {
  assertEquals,
  assertRejects,
} from "jsr:@std/assert";

import { XPService } from "./service.ts";
import type { XPTransaction } from "./types.ts";

function createMockClient(
  data: {
    transaction: XPTransaction;
    total_xp: number;
    already_granted: boolean;
  } | null = null,
  error: unknown = null,
) {
  return {
    rpc: (
      _functionName: "grant_xp",
      _params: Record<string, unknown>,
    ) => Promise.resolve({ data, error }),
  };
}

const transaction: XPTransaction = {
  id: "transaction-id",
  user_id: "user-id",
  amount: 10,
  source: "reading_started",
  source_reference: "reading-id",
  idempotency_key: "reading:reading-id:started",
  created_at: "2026-09-07T10:00:00.000Z",
};

Deno.test("grants XP and maps the RPC result", async () => {
  const service = new XPService(
    createMockClient({
      transaction,
      total_xp: 10,
      already_granted: false,
    }),
  );

  const result = await service.grant({
    userId: "user-id",
    amount: 10,
    source: "reading_started",
    sourceReference: "reading-id",
    idempotencyKey: "reading:reading-id:started",
  });

  assertEquals(result, {
    transaction,
    totalXp: 10,
    alreadyGranted: false,
  });
});

Deno.test("reports when XP was already granted", async () => {
  const service = new XPService(
    createMockClient({
      transaction,
      total_xp: 10,
      already_granted: true,
    }),
  );

  const result = await service.grant({
    userId: "user-id",
    amount: 10,
    source: "reading_started",
    idempotencyKey: "reading:reading-id:started",
  });

  assertEquals(result.alreadyGranted, true);
  assertEquals(result.totalXp, 10);
});

Deno.test("rejects a non-positive XP amount", async () => {
  const service = new XPService(createMockClient());

  await assertRejects(
    () =>
      service.grant({
        userId: "user-id",
        amount: 0,
        source: "reading_started",
        idempotencyKey: "key",
      }),
    Error,
    "XP amount must be a positive integer",
  );
});

Deno.test("rejects a non-integer XP amount", async () => {
  const service = new XPService(createMockClient());

  await assertRejects(
    () =>
      service.grant({
        userId: "user-id",
        amount: 2.5,
        source: "reading_started",
        idempotencyKey: "key",
      }),
    Error,
    "XP amount must be a positive integer",
  );
});

Deno.test("requires a user id", async () => {
  const service = new XPService(createMockClient());

  await assertRejects(
    () =>
      service.grant({
        userId: "",
        amount: 10,
        source: "reading_started",
        idempotencyKey: "key",
      }),
    Error,
    "User id is required",
  );
});

Deno.test("requires a source", async () => {
  const service = new XPService(createMockClient());

  await assertRejects(
    () =>
      service.grant({
        userId: "user-id",
        amount: 10,
        source: "",
        idempotencyKey: "key",
      }),
    Error,
    "XP source is required",
  );
});

Deno.test("requires an idempotency key", async () => {
  const service = new XPService(createMockClient());

  await assertRejects(
    () =>
      service.grant({
        userId: "user-id",
        amount: 10,
        source: "reading_started",
        idempotencyKey: "",
      }),
    Error,
    "XP idempotency key is required",
  );
});

Deno.test("propagates RPC errors", async () => {
  const rpcError = new Error("XP RPC failed");
  const service = new XPService(createMockClient(null, rpcError));

  await assertRejects(
    () =>
      service.grant({
        userId: "user-id",
        amount: 10,
        source: "reading_started",
        idempotencyKey: "key",
      }),
    Error,
    "XP RPC failed",
  );
});

Deno.test("rejects an empty RPC response", async () => {
  const service = new XPService(createMockClient());

  await assertRejects(
    () =>
      service.grant({
        userId: "user-id",
        amount: 10,
        source: "reading_started",
        idempotencyKey: "key",
      }),
    Error,
    "XP grant returned no data",
  );
});
