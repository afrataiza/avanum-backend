import type { ReadingDomainEvent } from "./types.ts";

export interface ReadingEventHandler {
  handle(event: ReadingDomainEvent): Promise<void>;
}

export class ReadingEventDispatcher {
  private readonly handlers: ReadingEventHandler[] = [];

  register(handler: ReadingEventHandler): void {
    this.handlers.push(handler);
  }

  async dispatch(events: ReadingDomainEvent[]): Promise<void> {
    for (const event of events) {
      for (const handler of this.handlers) {
        await handler.handle(event);
      }
    }
  }
}
