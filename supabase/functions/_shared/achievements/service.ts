import type {
  Achievement,
  AchievementTrigger,
  UserAchievement,
} from "./types.ts";

export interface GrantAchievementInput {
  userId: string;
  achievementId: string;
  sourceReference?: string | null;
}

export interface GrantAchievementResult {
  achievement: Achievement;
  userAchievement: UserAchievement;
  alreadyGranted: boolean;
}

export interface EvaluateAchievementsInput {
  userId: string;
  trigger: AchievementTrigger;
  value: number;
  sourceReference?: string | null;
}

export interface EvaluateAchievementsResult {
  granted: UserAchievement[];
  alreadyGranted: UserAchievement[];
}

export interface AchievementClient {
  rpc(
    fn: "grant_achievement" | "evaluate_achievements",
    args: Record<string, unknown>,
  ): PromiseLike<{
    data: AchievementGrantRow | AchievementEvaluationRow | null;
    error: unknown;
  }>;
}

interface AchievementGrantRow {
  achievement: Achievement;
  user_achievement: UserAchievement;
  already_granted: boolean;
}

interface AchievementEvaluationRow {
  granted: UserAchievement[];
  already_granted: UserAchievement[];
}

export class AchievementService {
  constructor(private readonly client: AchievementClient) {}

  async grant(
    input: GrantAchievementInput,
  ): Promise<GrantAchievementResult> {
    if (!input.userId) {
      throw new Error("User id is required");
    }

    if (!input.achievementId) {
      throw new Error("Achievement id is required");
    }

    const { data, error } = await this.client.rpc("grant_achievement", {
      p_user_id: input.userId,
      p_achievement_id: input.achievementId,
      p_source_reference: input.sourceReference ?? null,
    });

    if (error) throw error;
    if (!data) throw new Error("Achievement grant returned no data");

    const result = data as AchievementGrantRow;

    return {
      achievement: result.achievement,
      userAchievement: result.user_achievement,
      alreadyGranted: result.already_granted,
    };
  }

  async evaluate(
    input: EvaluateAchievementsInput,
  ): Promise<EvaluateAchievementsResult> {
    if (!input.userId) {
      throw new Error("User id is required");
    }

    if (!input.trigger) {
      throw new Error("Achievement trigger is required");
    }

    if (!Number.isInteger(input.value) || input.value < 0) {
      throw new Error("Achievement value must be a non-negative integer");
    }

    const { data, error } = await this.client.rpc("evaluate_achievements", {
      p_user_id: input.userId,
      p_trigger: input.trigger,
      p_value: input.value,
      p_source_reference: input.sourceReference ?? null,
    });

    if (error) throw error;
    if (!data) throw new Error("Achievement evaluation returned no data");

    const result = data as AchievementEvaluationRow;

    return {
      granted: result.granted,
      alreadyGranted: result.already_granted,
    };
  }
}
