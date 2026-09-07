import type { Achievement, UserAchievement } from "./types.ts";

export interface UserAchievementWithDefinition extends UserAchievement {
  achievement: Achievement;
}

export class AchievementQueryService {
  constructor(private readonly supabase: any) {}

  async listAchievements() {
    const { data, error } = await this.supabase
      .from("achievements")
      .select("*")
      .eq("active", true)
      .order("threshold", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      throw new Error("Failed to list achievements");
    }

    return data as Achievement[];
  }

  async listUserAchievements(userId: string) {
    const { data, error } = await this.supabase
      .from("user_achievements")
      .select("*, achievement:achievements(*)")
      .eq("user_id", userId)
      .order("achieved_at", { ascending: false });

    if (error) {
      throw new Error("Failed to list user achievements");
    }

    return data as UserAchievementWithDefinition[];
  }
}
