// Limits for /api/ask, so one person (or many throwaway accounts) can't run up the API bill.
//
// shortcut: counts live in this server's memory, so they reset on restart and are per
// server instance. Fine for the single VPS (clg.143.lat); move them to a database table
// if the app ever runs on several instances.

export const ASK_LIMITS = {
  perUser10Min: 10, // questions per user in any 10 minutes
  perUserDay: 50, // questions per user in 24 hours
  siteDay: 500, // questions for the whole site in 24 hours
};

const TEN_MIN = 10 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

const userHits = new Map<string, number[]>(); // user id -> times of their questions (oldest first)
let siteHits: number[] = [];
const answering = new Set<string>(); // users with an answer still streaming

export type LimitResult = { ok: true } | { ok: false; message: string; retryAfterSec: number };

const wait = (oldest: number, window: number, now: number) => Math.max(1, Math.ceil((oldest + window - now) / 1000));

/** Checks every limit; if all pass, records the question and marks the user as answering. */
export function takeAskSlot(userId: string, now = Date.now()): LimitResult {
  // Forget anything older than a day.
  const hits = (userHits.get(userId) ?? []).filter((t) => now - t < DAY);
  siteHits = siteHits.filter((t) => now - t < DAY);
  const last10Min = hits.filter((t) => now - t < TEN_MIN);

  if (answering.has(userId)) {
    return { ok: false, message: "Wait for the current answer to finish.", retryAfterSec: 5 };
  }
  if (last10Min.length >= ASK_LIMITS.perUser10Min) {
    return { ok: false, message: `Slow down: up to ${ASK_LIMITS.perUser10Min} questions every 10 minutes.`, retryAfterSec: wait(last10Min[0], TEN_MIN, now) };
  }
  if (hits.length >= ASK_LIMITS.perUserDay) {
    return { ok: false, message: `You've used today's ${ASK_LIMITS.perUserDay} questions. Try again tomorrow.`, retryAfterSec: wait(hits[0], DAY, now) };
  }
  if (siteHits.length >= ASK_LIMITS.siteDay) {
    return { ok: false, message: "Ask has reached its daily limit for the whole site. Try again tomorrow.", retryAfterSec: wait(siteHits[0], DAY, now) };
  }

  userHits.set(userId, [...hits, now]);
  siteHits.push(now);
  answering.add(userId);
  return { ok: true };
}

/** Call when the answer has finished (or failed, or the user left). */
export function releaseAskSlot(userId: string) {
  answering.delete(userId);
}

/** Tests only: start from a clean slate. */
export function resetAskLimits() {
  userHits.clear();
  siteHits = [];
  answering.clear();
}
