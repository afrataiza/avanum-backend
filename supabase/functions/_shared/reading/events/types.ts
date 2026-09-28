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

export function createReadingStartedEvent(input: {
  userId: string;
  readingId: string;
  userBookId: string;
  mediaType: ReadingFormat;
  occurredAt: string;
}): ReadingStartedEvent {
  return {
    eventId: crypto.randomUUID(),
    type: "reading_started",
    userId: input.userId,
    readingId: input.readingId,
    userBookId: input.userBookId,
    mediaType: input.mediaType,
    occurredAt: input.occurredAt,
  };
}

export function createReadingProgressedEvent(input: {
  userId: string;
  readingId: string;
  userBookId: string;
  mediaType: ReadingFormat;
  previousUnits: number;
  currentUnits: number;
  occurredAt: string;
}): ReadingProgressedEvent {
  if (input.currentUnits <= input.previousUnits) {
    throw new Error("Reading progress event requires increased progress");
  }

  return {
    eventId: crypto.randomUUID(),
    type: "reading_progressed",
    userId: input.userId,
    readingId: input.readingId,
    userBookId: input.userBookId,
    mediaType: input.mediaType,
    previousUnits: input.previousUnits,
    currentUnits: input.currentUnits,
    deltaUnits: input.currentUnits - input.previousUnits,
    occurredAt: input.occurredAt,
  };
}

export function createReadingCompletedEvent(input: {
  userId: string;
  readingId: string;
  userBookId: string;
  mediaType: ReadingFormat;
  occurredAt: string;
}): ReadingCompletedEvent {
  return {
    eventId: crypto.randomUUID(),
    type: "reading_completed",
    userId: input.userId,
    readingId: input.readingId,
    userBookId: input.userBookId,
    mediaType: input.mediaType,
    occurredAt: input.occurredAt,
  };
}
