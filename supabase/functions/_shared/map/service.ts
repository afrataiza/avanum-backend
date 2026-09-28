import type {
  ApplyMapNodeProgressInput,
  MapNodeStatus,
  UserMapProgress,
} from "./types.ts";

const STATUSES: MapNodeStatus[] = [
  "locked",
  "discovered",
  "explored",
];

export class MapService {
  constructor(private readonly supabase: any) {}

  async applyProgress(input: ApplyMapNodeProgressInput): Promise<UserMapProgress> {
    if (!input.userId?.trim()) {
      throw new Error("User id is required");
    }

    if (!input.nodeId?.trim()) {
      throw new Error("Map node id is required");
    }

    if (!STATUSES.includes(input.targetStatus)) {
      throw new Error("Invalid map node status");
    }

    const { data, error } = await this.supabase.rpc("apply_map_node_progress", {
      p_user_id: input.userId,
      p_node_id: input.nodeId,
      p_target_status: input.targetStatus,
      p_source: input.source ?? null,
      p_source_reference: input.sourceReference ?? null,
    });

    if (error) {
      throw new Error(error.message || "Failed to apply map node progress");
    }

    if (!data) {
      throw new Error("Map progress returned no data");
    }

    return data as UserMapProgress;
  }
}
