export type DomainEvent = { type: string; payload?: unknown };

export function publishEvent(event: DomainEvent) {
  // Placeholder event publisher
  if (process.env.NODE_ENV === "development") {
    console.debug("Domain event", event);
  }
}

export const EventTypes = {
  PURCHASE_ORDER_UPDATED: "purchase_order.updated",
  PURCHASE_ORDER_CREATED: "purchase_order.created",
  GENERIC: "event.generic",
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

export function emitEvent(event: DomainEvent & { type?: EventType }) {
  return publishEvent({ type: event.type || EventTypes.GENERIC, payload: event.payload });
}
