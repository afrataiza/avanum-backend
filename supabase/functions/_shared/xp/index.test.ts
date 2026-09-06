import { assertEquals } from "jsr:@std/assert";

import type { XPBalance, XPTransaction } from "./index.ts";

deno.test("contratos de XP podem ser importados pelo módulo público", () => {
  const balance: XPBalance = {
    user_id: "user-1",
    total_xp: 10,
    created_at: "2026-09-06T12:00:00Z",
    updated_at: "2026-09-06T12:00:00Z",
  };

  const transaction: XPTransaction = {
    id: "transaction-1",
    user_id: "user-1",
    amount: 10,
    source: "reading_completed",
    source_reference: "reading-1",
    idempotency_key: "reading_completed:reading-1",
    created_at: "2026-09-06T12:00:00Z",
  };

  assertEquals(balance.user_id, transaction.user_id);
  assertEquals(balance.total_xp, transaction.amount);
});
