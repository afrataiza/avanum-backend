import { assertEquals } from "jsr:@std/assert";

import { MapQueryService } from "./query-service.ts";

Deno.test("lists map regions with user progress", async () => {
  const region = {
    id: "region-id",
    slug: "first-steps",
    name: "Primeiros Passos",
    description: null,
    sort_order: 1,
    created_at: "2026-09-28T00:00:00.000Z",
    updated_at: "2026-09-28T00:00:00.000Z",
  };

  const node = {
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
  };

  const progress = {
    user_id: "user-id",
    node_id: "node-id",
    status: "discovered",
    unlocked_at: "2026-09-28T01:00:00.000Z",
    explored_at: null,
    source: "reading_started",
    source_reference: "reading-id",
    created_at: "2026-09-28T01:00:00.000Z",
    updated_at: "2026-09-28T01:00:00.000Z",
  };

  const dataByTable: Record<string, unknown[]> = {
    map_regions: [region],
    map_nodes: [node],
    user_map_progress: [progress],
  };

  const supabase = {
    from(table: string) {
      return {
        select() {
          return {
            eq: async () => ({ data: dataByTable[table], error: null }),
            order() {
              return {
                order: async () => ({
                  data: dataByTable[table],
                  error: null,
                }),
              };
            },
          };
        },
      };
    },
  };

  const service = new MapQueryService(supabase);
  const result = await service.getUserMap("user-id");

  assertEquals(result.length, 1);
  assertEquals(result[0].nodes[0].progress.status, "discovered");
  assertEquals(result[0].nodes[0].slug, "first-step");
});

Deno.test("defaults missing user progress to locked", async () => {
  const region = {
    id: "region-id",
    slug: "first-steps",
    name: "Primeiros Passos",
    description: null,
    sort_order: 1,
    created_at: "2026-09-28T00:00:00.000Z",
    updated_at: "2026-09-28T00:00:00.000Z",
  };

  const node = {
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
  };

  const supabase = {
    from(table: string) {
      return {
        select() {
          if (table === "user_map_progress") {
            return {
              eq: async () => ({ data: [], error: null }),
            };
          }

          return {
            order() {
              return {
                order: async () => ({
                  data: table === "map_regions" ? [region] : [node],
                  error: null,
                }),
              };
            },
          };
        },
      };
    },
  };

  const service = new MapQueryService(supabase);
  const result = await service.getUserMap("user-id");

  assertEquals(result[0].nodes[0].progress.status, "locked");
});
