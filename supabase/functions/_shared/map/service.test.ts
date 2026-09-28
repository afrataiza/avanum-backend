import { assertEquals, assertRejects } from "jsr:@std/assert";

import { MapService } from "./service.ts";

function createClient(result: unknown = {
  user_id: "user-id",
  node_id: "node-id",
  status: "discovered",
}) {
  const calls: Array<{ fn: string; args: Record<string, unknown> }> = [];

  return {
    calls,
    rpc(fn: string, args: Record<string, unknown>) {
      calls.push({ fn, args });
      return Promise.resolve({ data: result, error: null });
    },
  };
}

Deno.test("applies map progress through RPC", async () => {
  const client = createClient();
  const service = new MapService(client);

  const result = await service.applyProgress({
    userId: "user-id",
    nodeId: "node-id",
    targetStatus: "discovered",
    source: "reading_started",
    sourceReference: "reading-id",
  });

  assertEquals(result.status, "discovered");
  assertEquals(client.calls, [{
    fn: "apply_map_node_progress",
    args: {
      p_user_id: "user-id",
      p_node_id: "node-id",
      p_target_status: "discovered",
      p_source: "reading_started",
      p_source_reference: "reading-id",
    },
  }]);
});

Deno.test("requires user id", async () => {
  const service = new MapService(createClient());

  await assertRejects(
    () =>
      service.applyProgress({
        userId: "",
        nodeId: "node-id",
        targetStatus: "discovered",
      }),
    Error,
    "User id is required",
  );
});

Deno.test("requires map node id", async () => {
  const service = new MapService(createClient());

  await assertRejects(
    () =>
      service.applyProgress({
        userId: "user-id",
        nodeId: "",
        targetStatus: "discovered",
      }),
    Error,
    "Map node id is required",
  );
});

Deno.test("rejects invalid map node status", async () => {
  const service = new MapService(createClient());

  await assertRejects(
    () =>
      service.applyProgress({
        userId: "user-id",
        nodeId: "node-id",
        targetStatus: "invalid" as never,
      }),
    Error,
    "Invalid map node status",
  );
});
