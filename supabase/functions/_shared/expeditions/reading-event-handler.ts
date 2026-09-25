import type { ReadingDomainEvent } from "../reading/events/types.ts";
import type { ExpeditionObjectiveType, UserExpeditionWithDefinition } from "./types.ts";

export interface ExpeditionReadingEventDependencies {
  listUserExpeditions(
    userId: string,
  ): Promise<UserExpeditionWithDefinition[]>;
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

export class ExpeditionReadingEventHandler {
  constructor(
    private readonly dependencies: ExpeditionReadingEventDependencies,
  ) {}

  async handle(event: ReadingDomainEvent): Promise<void> {
    if (event.type === "reading_started") {
      return;
    }

    const expeditions = await this.dependencies.listUserExpeditions(event.userId);

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
        event.eventId,
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
      event.eventId,
    );
  }

  private async applyToMatchingExpeditions(
    userId: string,
    expeditions: UserExpeditionWithDefinition[],
    objectiveType: ExpeditionObjectiveType,
    amount: number,
    source: string,
    sourceReference: string,
    eventId: string,
  ): Promise<void> {
    for (const userExpedition of expeditions) {
      if (
        userExpedition.status !== "active" ||
        !userExpedition.expedition.active ||
        userExpedition.expedition.objective_type !== objectiveType
      ) {
        continue;
      }

      await this.dependencies.applyProgress(userId, {
        userExpeditionId: userExpedition.id,
        amount,
        source,
        sourceReference,
        idempotencyKey: `reading-event:${eventId}`,
      });
    }
  }
}
