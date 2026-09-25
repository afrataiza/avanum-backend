import type {
  Reading,
  ReadingFormat,
} from "../types.ts";

export type ReadingEventType =
  | "reading_started"
  | "reading_progressed"
  | "reading_completed";

export interface ReadingDomainEventBase {
  eventId: string;
  type: ReadingEventType;
  userId: string;
  readingId: string;
  userBookId: string;
  mediaType: ReadingFormat;
  occurredAt: string;
}

export interface ReadingStartedEvent extends ReadingDomainEventBase {
  type: "reading_started";
}

export interface ReadingProgressedEvent extends ReadingDomainEventBase {
  type: "reading_progressed";
  previousUnits: number;
  currentUnits: number;
  deltaUnits: number;
}

export interface ReadingCompletedEvent extends ReadingDomainEventBase {
  type: "reading_completed";
}

export type ReadingDomainEvent =
  | ReadingStartedEvent
  | ReadingProgressedEvent
  | ReadingCompletedEvent;

export interface ReadingRpcResult {
  reading: Reading;
  events: ReadingDomainEvent[];
}
