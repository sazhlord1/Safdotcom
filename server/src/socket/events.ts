export const SOCKET_EVENTS = {
  // Server → Client
  QUEUE_UPDATED: "queue:updated",
  SWAP_NEW_OFFER: "swap:new-offer",
  SWAP_REQUEST_RECEIVED: "swap:request-received",
  SWAP_RESPONSE: "swap:response",
  QUEUE_CLOSED: "queue:closed",

  // Client → Server
  SUBSCRIBE: "queue:subscribe",
  UNSUBSCRIBE: "queue:unsubscribe",
} as const;
