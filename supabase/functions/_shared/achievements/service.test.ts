import {
  assertEquals,
  assertRejects,
} from "jsr:@std/assert";

import { AchievementService } from "./service.ts";
import type { Achievement, UserAchievement } from "./types.ts";

function createMockClient(
  grantData: {
    achievement: Achievement;
    user_achievement: UserAchievement;
    already_granted: boolean;
  } | null = null,
  evaluateData: {
    granted: UserAchievement[];
    already_granted: UserAchievement[];
  } | null = null,
  error: unknown = null,
) {
  return {
    rpc: (
      functionName: "grant_achievement" | "evaluate_achievements",
      _params: Record<string, unknown>,
    ) => {
      if (functionName === "grant_achievement") {
        return Promise.resolve({ data: grantData, error });
      }

      return Promise.resolve({ data: evaluateData, error });
    },
  };
}

const achievement: Achievement = {
  id: "achievement-id",
  code: "first_reading",
  name: "Primeira leitura",
  description: "Inicie sua primeira aventura de leitura.",
  trigger: "reading_started",
  threshold: 1,
  metadata: {},
  active: true,
  created_at: "2026-09-07T10:00:00.000Z",
  updated_at: "2026-09-07T10:00:00.000Z",
};

const userAchievement: UserAchievement = {
  id: "user-achievement-id",
  user_id: "user-id",
  achievement_id: "achievement-id",
  source_reference: "reading-id",
  achieved_at: "2026-09-07T10:00:00.000Z",
};

Deno.test("grants an achievement and maps the RPC result", async () => {
  const service = new AchievementService(
    createMockClient({
      achievement,
      user_achievement: userAchievement,
      already_granted: false,
    }),
  );

  const result = await service.grant({
    userId: "user-id",
    achievementId: "achievement-id",
    sourceReference: "reading-id",
  });

  assertEquals(result, {
    achievement,
    userAchievement,
    alreadyGranted: false,
  });
});

Deno.test("reports when an achievement was already granted", async () => {
  const service = new AchievementService(
    createMockClient({
      achievement,
      user_achievement: userAchievement,
      already_granted: true,
    }),
  );

  const result = await service.grant({
    userId: "user-id",
    achievementId: "achievement-id",
  });

  assertEquals(result.alreadyGranted, true);
});

Deno.test("evaluates achievements from a trigger and value", async () => {
  const service = new AchievementService(
    createMockClient(
      null,
      {
        granted: [userAchievement],
        already_granted: [],
      },
    ),
  );

  const result = await service.evaluate({
    userId: "user-id",
    trigger: "reading_started",
    value: 1,
    sourceReference: "reading-id",
  });

  assertEquals(result, {
    granted: [userAchievement],
    alreadyGranted: [],
  });
});

Deno.test("requires a user id when granting", async () => {
  const service = new AchievementService(createMockClient());

  await assertRejects(
    () =>
      service.grant({
        userId: "",
        achievementId: "achievement-id",
      }),
    Error,
    "User id is required",
  );
});

Deno.test("requires an achievement id when granting", async () => {
  const service = new AchievementService(createMockClient());

  await assertRejects(
    () =>
      service.grant({
        userId: "user-id",
        achievementId: "",
      }),
    Error,
    "Achievement id is required",
  );
});

Deno.test("requires a trigger when evaluating", async () => {
  const service = new AchievementService(createMockClient());

  await assertRejects(
    () =>
      service.evaluate({
        userId: "user-id",
        trigger: "",
        value: 1,
      }),
    Error,
    "Achievement trigger is required",
  );
});

Deno.test("rejects a negative evaluation value", async () => {
  const service = new AchievementService(createMockClient());

  await assertRejects(
    () =>
      service.evaluate({
        userId: "user-id",
        trigger: "books_completed",
        value: -1,
      }),
    Error,
    "Achievement value must be a non-negative integer",
  );
});

Deno.test("rejects a non-integer evaluation value", async () => {
  const service = new AchievementService(createMockClient());

  await assertRejects(
    () =>
      service.evaluate({
        userId: "user-id",
        trigger: "books_completed",
        value: 1.5,
      }),
    Error,
    "Achievement value must be a non-negative integer",
  );
});

Deno.test("propagates grant RPC errors", async () => {
  const rpcError = new Error("Achievement RPC failed");
  const service = new AchievementService(
    createMockClient(null, null, rpcError),
  );

  await assertRejects(
    () =>
      service.grant({
        userId: "user-id",
        achievementId: "achievement-id",
      }),
    Error,
    "Achievement RPC failed",
  );
});

Deno.test("rejects an empty grant RPC response", async () => {
  const service = new AchievementService(createMockClient());

  await assertRejects(
    () =>
      service.grant({
        userId: "user-id",
        achievementId: "achievement-id",
      }),
    Error,
    "Achievement grant returned no data",
  );
});

Deno.test("propagates evaluation RPC errors", async () => {
  const rpcError = new Error("Achievement evaluation failed");
  const service = new AchievementService(
    createMockClient(null, null, rpcError),
  );

  await assertRejects(
    () =>
      service.evaluate({
        userId: "user-id",
        trigger: "reading_started",
        value: 1,
      }),
    Error,
    "Achievement evaluation failed",
  );
});

Deno.test("rejects an empty evaluation RPC response", async () => {
  const service = new AchievementService(createMockClient());

  await assertRejects(
    () =>
      service.evaluate({
        userId: "user-id",
        trigger: "reading_started",
        value: 1,
      }),
    Error,
    "Achievement evaluation returned no data",
  );
});
