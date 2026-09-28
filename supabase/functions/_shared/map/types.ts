export type MapNodeStatus = "locked" | "discovered" | "explored";

export type MapUnlockType =
  | "manual"
  | "reading_started"
  | "reading_completed"
  | "achievement_granted"
  | "expedition_completed";

export interface MapRegion {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MapNode {
  id: string;
  region_id: string;
  slug: string;
  name: string;
  description: string | null;
  unlock_type: MapUnlockType;
  unlock_reference: string | null;
  position_x: number;
  position_y: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface UserMapProgress {
  user_id: string;
  node_id: string;
  status: MapNodeStatus;
  unlocked_at: string | null;
  explored_at: string | null;
  source: string | null;
  source_reference: string | null;
  created_at: string;
  updated_at: string;
}

export interface MapNodeWithProgress extends MapNode {
  progress: UserMapProgress;
}

export interface MapRegionWithNodes extends MapRegion {
  nodes: MapNodeWithProgress[];
}

export interface ApplyMapNodeProgressInput {
  userId: string;
  nodeId: string;
  targetStatus: MapNodeStatus;
  source?: string | null;
  sourceReference?: string | null;
}
