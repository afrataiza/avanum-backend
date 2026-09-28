import type { ReadingDomainEvent } from "../reading/events/types.ts";
import type { ExpeditionObjectiveType, UserExpeditionWithDefinition } from "./types.ts";

export interface ExpeditionQueryPort {
  listUserExpeditions(
    userId: string,
  ): Promise<UserExpeditionWithDefinition[]>;
}

export interface ExpeditionProgressPort {
  applyProgress(
    userId: string,
    input: {
      userExpeditionId: string;
      amount: number;
      source: string;
      sourceReference?: string | null;
      idempotencyKey: string;
    },
  ): Promise<unknown>;
}

export interface ExpeditionReadingEventDependencies {
  query: ExpeditionQueryPort;
  progress: ExpeditionProgressPort;
}

export class ExpeditionReadingEventHandler {
  constructor(
    private readonly dependencies: ExpeditionReadingEventDependencies,
  ) {}

  async handle(event: ReadingDomainEvent): Promise<void> {
    if (event.type === "reading_started") {
      return;
    }

    const expeditions =
      await this.dependencies.query.listUserExpeditions(event.userId);

    if (event.type === "reading_progressed") {
      const objectiveType: ExpeditionObjectiveType =
        event.mediaType === "audiobook"
          ? "minutes_listened"
          : "pages_read";

      await this.applyToMatchingExpeditions(
        event.userId,
        expeditions,
        objectiveType,
        event.deltaUnits,
        "reading_progressed",
        event.readingId,
        `reading:${event.readingId}:progress:${event.currentUnits}`,
      );
      return;
    }

    await this.applyToMatchingExpeditions(
      event.userId,
      expeditions,
      "books_completed",
      1,
      "reading_completed",
      event.readingId,
      `reading:${event.readingId}:completed`,
    );
  }

  private async applyToMatchingExpeditions(
    userId: string,
    expeditions: UserExpeditionWithDefinition[],
    objectiveType: ExpeditionObjectiveType,
    amount: number,
    source: string,
    sourceReference: string,
    idempotencyKey: string,
  ): Promise<void> {
    for (const userExpedition of expeditions) {
      if (
        userExpedition.status !== "active" ||
        !userExpedition.expedition.active ||
        userExpedition.expedition.objective_type !== objectiveType
      ) {
        continue;
      }

      await this.dependencies.progress.applyProgress(userId, {
        userExpeditionId: userExpedition.id,
        amount,
        source,
        sourceReference,
        idempotencyKey,
      });
    }
  }
}
