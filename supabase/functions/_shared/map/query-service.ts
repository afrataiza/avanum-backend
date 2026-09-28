import type { MapRegionWithNodes } from "./types.ts";

export class MapQueryService {
  constructor(private readonly supabase: any) {}

  async getUserMap(userId: string): Promise<MapRegionWithNodes[]> {
    if (!userId?.trim()) {
      throw new Error("User id is required");
    }

    const { data: regions, error: regionsError } = await this.supabase
      .from("map_regions")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });

    if (regionsError) {
      throw new Error("Failed to list map regions");
    }

    const { data: nodes, error: nodesError } = await this.supabase
      .from("map_nodes")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });

    if (nodesError) {
      throw new Error("Failed to list map nodes");
    }

    const { data: progress, error: progressError } = await this.supabase
      .from("user_map_progress")
      .select("*")
      .eq("user_id", userId);

    if (progressError) {
      throw new Error("Failed to list user map progress");
    }

    const progressByNode = new Map(
      (progress ?? []).map((item: any) => [item.node_id, item]),
    );

    return (regions ?? []).map((region: any) => ({
      ...region,
      nodes: (nodes ?? [])
        .filter((node: any) => node.region_id === region.id)
        .map((node: any) => ({
          ...node,
          progress: progressByNode.get(node.id) ?? {
            user_id: userId,
            node_id: node.id,
            status: "locked",
            unlocked_at: null,
            explored_at: null,
            source: null,
            source_reference: null,
            created_at: null,
            updated_at: null,
          },
        })),
    }));
  }
}
