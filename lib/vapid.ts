import { VAPID_PUBLIC_KEY } from './vapidPublic.ts';

const FALLBACK_VAPID_PRIVATE_KEY =
  'ZxVv4INLU3Kyh77uFJpLVok8LsIZ1Dq6W-qNpxGJvK0';

export { VAPID_PUBLIC_KEY };

export const VAPID_PRIVATE_KEY = (
  process.env.VAPID_PRIVATE_KEY || FALLBACK_VAPID_PRIVATE_KEY
).trim();

export const VAPID_SUBJECT = (
  process.env.VAPID_SUBJECT || 'mailto:admin@fxcracademy.vercel.app'
).trim();

export const VAPID_KEY_SOURCE: 'env' | 'default' =
  (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY) &&
  process.env.VAPID_PRIVATE_KEY
    ? 'env'
    : 'default';
