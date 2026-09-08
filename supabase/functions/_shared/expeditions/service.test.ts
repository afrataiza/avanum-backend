import { assertEquals, assertRejects } from "jsr:@std/assert";
import { ExpeditionService } from "./service.ts";
import type { CreateExpeditionInput } from "./types.ts";

function createMockClient(data: unknown = { ok: true }, error: unknown = null) {
  return {
    rpc: (_name: string, _params: Record<string, unknown>) =>
      Promise.resolve({ data, error }),
  };
}

const createInput: CreateExpeditionInput = {
  name: "Ler 5 livros",
  description: "Uma meta para este mês",
  objectiveType: "books_completed",
  targetValue: 5,
};

Deno.test("creates an expedition", async () => {
  const service = new ExpeditionService(createMockClient({ id: "user-expedition-id" }));
  const result = await service.create("user-id", createInput);
  assertEquals(result, { id: "user-expedition-id" });
});

Deno.test("requires an expedition name", async () => {
  const service = new ExpeditionService(createMockClient());
  await assertRejects(
    () => service.create("user-id", { ...createInput, name: "" }),
    Error,
    "Expedition name is required",
  );
});

Deno.test("rejects an invalid objective type", async () => {
  const service = new ExpeditionService(createMockClient());
  await assertRejects(
    () => service.create("user-id", { ...createInput, objectiveType: "invalid" as never }),
    Error,
    "Invalid expedition objective type",
  );
});

Deno.test("rejects a non-positive target", async () => {
  const service = new ExpeditionService(createMockClient());
  await assertRejects(
    () => service.create("user-id", { ...createInput, targetValue: 0 }),
    Error,
    "Expedition target must be a positive integer",
  );
});

Deno.test("rejects an invalid period", async () => {
  const service = new ExpeditionService(createMockClient());
  await assertRejects(
    () => service.create("user-id", {
      ...createInput,
      startsAt: "2026-09-10T00:00:00.000Z",
      endsAt: "2026-09-09T00:00:00.000Z",
    }),
    Error,
    "Expedition end must be after start",
  );
});

Deno.test("applies expedition progress", async () => {
  const service = new ExpeditionService(createMockClient({
    user_expedition: { current_value: 3, status: "active" },
    already_applied: false,
  }));

  const result = await service.applyProgress("user-id", {
    userExpeditionId: "user-expedition-id",
    amount: 1,
    source: "reading_completed",
    sourceReference: "reading-id",
    idempotencyKey: "reading:reading-id:completed",
  });

  assertEquals(result.already_applied, false);
});

Deno.test("rejects non-positive progress", async () => {
  const service = new ExpeditionService(createMockClient());
  await assertRejects(
    () => service.applyProgress("user-id", {
      userExpeditionId: "user-expedition-id",
      amount: 0,
      source: "reading_completed",
      idempotencyKey: "event-id",
    }),
    Error,
    "Progress amount must be a positive integer",
  );
});

Deno.test("requires progress idempotency key", async () => {
  const service = new ExpeditionService(createMockClient());
  await assertRejects(
    () => service.applyProgress("user-id", {
      userExpeditionId: "user-expedition-id",
      amount: 1,
      source: "reading_completed",
      idempotencyKey: "",
    }),
    Error,
    "Idempotency key is required",
  );
});

Deno.test("cancels an active expedition", async () => {
  const service = new ExpeditionService(createMockClient({ id: "user-expedition-id", status: "cancelled" }));
  const result = await service.cancel("user-id", "user-expedition-id");
  assertEquals(result.status, "cancelled");
});
