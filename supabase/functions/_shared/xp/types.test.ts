import { assertEquals } from "jsr:@std/assert";

import type { XPBalance, XPTransaction } from "./types.ts";

deno.test("XPBalance representa o saldo de XP do usuário", () => {
  const balance: XPBalance = {
    user_id: "user-1",
    total_xp: 120,
    created_at: "2026-09-06T12:00:00Z",
    updated_at: "2026-09-06T12:00:00Z",
  };

  assertEquals(balance.total_xp, 120);
});

deno.test("XPTransaction representa uma concessão de XP auditável", () => {
  const transaction: XPTransaction = {
    id: "transaction-1",
    user_id: "user-1",
    amount: 20,
    source: "reading_completed",
    source_reference: "reading-1",
    idempotency_key: "reading_completed:reading-1",
    created_at: "2026-09-06T12:00:00Z",
  };

  assertEquals(transaction.source, "reading_completed");
  assertEquals(transaction.amount, 20);
  assertEquals(transaction.idempotency_key, "reading_completed:reading-1");
});
