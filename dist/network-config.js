// Optional TURN configuration for networks that cannot connect directly.
// Supply short-lived TURN credentials through your own credential service;
// never place a provider API secret in this public file.
globalThis.SHITHEAD_ICE_SERVERS ||= [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
];
