export type AchievementTrigger = string;

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  trigger: AchievementTrigger;
  threshold: number;
  metadata: Record<string, unknown>;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  source_reference: string | null;
  achieved_at: string;
}
