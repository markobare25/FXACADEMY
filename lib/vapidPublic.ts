const FALLBACK_VAPID_PUBLIC_KEY =
  'BOVw1FBKxPCwOzIPJJqQmSS-hfYSWrbbrxGBFdY0xJarrmu5ValkD7-yq0d8wxX0JGZZLI9bYBnibhG0Bf7Af6A';

const viteEnvPublic =
  typeof import.meta !== 'undefined' &&
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ? (import.meta as unknown as { env?: Record<string, string | undefined> }).env!
        .VITE_VAPID_PUBLIC_KEY ||
      (import.meta as unknown as { env?: Record<string, string | undefined> }).env!
        .NEXT_PUBLIC_VAPID_PUBLIC_KEY
    : undefined;

const nodeEnvPublic =
  typeof process !== 'undefined' && process.env
    ? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
      process.env.VAPID_PUBLIC_KEY ||
      process.env.VITE_VAPID_PUBLIC_KEY
    : undefined;

export const VAPID_PUBLIC_KEY = (
  nodeEnvPublic ||
  viteEnvPublic ||
  FALLBACK_VAPID_PUBLIC_KEY
).trim();
