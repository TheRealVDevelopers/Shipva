/**
 * Tracking token TTL constants. The actual JWT signing lives in the
 * Cloud Function (`issueTrackingToken`) — clients only consume the
 * token and check expiry locally for UX.
 */
export const TRACKING_TOKEN_TTL_DAYS = 14;
export const TRACKING_TOKEN_TTL_MS = TRACKING_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

export function isTrackingTokenExpired(expiresAtIso: string, now = Date.now()): boolean {
  return new Date(expiresAtIso).getTime() < now;
}
