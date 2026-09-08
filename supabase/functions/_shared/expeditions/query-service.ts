import type { UserExpeditionWithDefinition } from "./types.ts";

export class ExpeditionQueryService {
  constructor(private readonly supabase: any) {}

  async listUserExpeditions(userId: string) {
    const { data, error } = await this.supabase
      .from("user_expeditions")
      .select("*, expedition:expeditions(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error("Failed to list user expeditions");
    }

    return data as UserExpeditionWithDefinition[];
  }

  async getUserExpedition(userId: string, userExpeditionId: string) {
    const { data, error } = await this.supabase
      .from("user_expeditions")
      .select("*, expedition:expeditions(*)")
      .eq("id", userExpeditionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error("Failed to get user expedition");
    }
    if (!data) {
      throw new Error("Expedition not found");
    }

    return data as UserExpeditionWithDefinition;
  }
}
