import type { ReadingDomainEvent } from "../reading/events/types.ts";
import type { MapNodeWithProgress, MapNodeStatus } from "./types.ts";

export interface MapNodeQueryPort {
  listNodes(): Promise<MapNodeWithProgress[]>;
}

export interface MapProgressPort {
  applyProgress(input: {
    userId: string;
    nodeId: string;
    targetStatus: MapNodeStatus;
    source: string;
    sourceReference: string;
  }): Promise<unknown>;
}

export interface MapReadingEventDependencies {
  query: MapNodeQueryPort;
  progress: MapProgressPort;
}

export class MapReadingEventHandler {
  constructor(
    private readonly dependencies: MapReadingEventDependencies,
  ) {}

  async handle(event: ReadingDomainEvent): Promise<void> {
    const nodes = await this.dependencies.query.listNodes();

    if (event.type === "reading_started") {
      await this.applyMatchingNode(
        event.userId,
        nodes,
        "reading_started",
        null,
        "discovered",
        event.type,
        event.readingId,
      );
      return;
    }

    if (event.type === "reading_completed") {
      await this.applyMatchingNode(
        event.userId,
        nodes,
        "reading_completed",
        null,
        "discovered",
        event.type,
        event.readingId,
      );
    }
  }

  private async applyMatchingNode(
    userId: string,
    nodes: MapNodeWithProgress[],
    unlockType: string,
    unlockReference: string | null,
    targetStatus: MapNodeStatus,
    source: string,
    sourceReference: string,
  ): Promise<void> {
    for (const node of nodes) {
      if (
        node.unlock_type !== unlockType ||
        node.unlock_reference !== unlockReference
      ) {
        continue;
      }

      await this.dependencies.progress.applyProgress({
        userId,
        nodeId: node.id,
        targetStatus,
        source,
        sourceReference,
      });
    }
  }
}
