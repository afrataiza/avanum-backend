import {
  assertEquals,
  assertRejects,
} from "jsr:@std/assert";

import { AchievementQueryService } from "./query-service.ts";

function createQueryClient() {
  const calls: string[] = [];

  const chain = (data: unknown, error: unknown = null) => {
    const query = {
      select: (value: string) => {
        calls.push(`select:${value}`);
        return query;
      },
      eq: (field: string, value: unknown) => {
        calls.push(`eq:${field}:${String(value)}`);
        return query;
      },
      order: (field: string, options: unknown) => {
        calls.push(`order:${field}:${JSON.stringify(options)}`);
        return query;
      },
      then: (resolve: (value: unknown) => unknown) =>
        Promise.resolve(resolve({ data, error })),
    };

    return query;
  };

  return {
    client: {
      from: (table: string) => {
        calls.push(`from:${table}`);
        return chain([]);
      },
    },
    calls,
  };
}

Deno.test("lists active achievements ordered by threshold", async () => {
  const { client, calls } = createQueryClient();
  const service = new AchievementQueryService(client);

  const result = await service.listAchievements();

  assertEquals(result, []);
  assertEquals(calls, [
    "from:achievements",
    "select:*",
    "eq:active:true",
    'order:threshold:{"ascending":true}',
    'order:id:{"ascending":true}',
  ]);
});

Deno.test("lists only the authenticated user's achievements", async () => {
  const { client, calls } = createQueryClient();
  const service = new AchievementQueryService(client);

  const result = await service.listUserAchievements("user-id");

  assertEquals(result, []);
  assertEquals(calls, [
    "from:user_achievements",
    "select:*, achievement:achievements(*)",
    "eq:user_id:user-id",
    'order:achieved_at:{"ascending":false}',
  ]);
});

Deno.test("propagates catalog query errors", async () => {
  const client = {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            order: () => ({
              then: (resolve: (value: unknown) => unknown) =>
                Promise.resolve(resolve({
                  data: null,
                  error: new Error("query failed"),
                })),
            }),
          }),
        }),
      }),
    }),
  };

  const service = new AchievementQueryService(client);

  await assertRejects(
    () => service.listAchievements(),
    Error,
    "Failed to list achievements",
  );
});

Deno.test("propagates user achievements query errors", async () => {
  const client = {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            then: (resolve: (value: unknown) => unknown) =>
              Promise.resolve(resolve({
                data: null,
                error: new Error("query failed"),
              })),
          }),
        }),
      }),
    }),
  };

  const service = new AchievementQueryService(client);

  await assertRejects(
    () => service.listUserAchievements("user-id"),
    Error,
    "Failed to list user achievements",
  );
});
