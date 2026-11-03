import { beforeEach, describe, expect, it } from "vitest";
import { ASK_LIMITS, releaseAskSlot, resetAskLimits, takeAskSlot } from "@/lib/ask/rate-limit";

const MIN = 60 * 1000;

describe("/ask rate limits", () => {
  beforeEach(resetAskLimits);

  // Ask one question and let it finish, at time `t`.
  const askAndFinish = (user: string, t: number) => {
    const r = takeAskSlot(user, t);
    releaseAskSlot(user);
    return r;
  };

  it("allows one answer at a time per user", () => {
    expect(takeAskSlot("a", 0).ok).toBe(true);
    expect(takeAskSlot("a", 1000)).toMatchObject({ ok: false, message: expect.stringContaining("current answer") });
    expect(takeAskSlot("b", 1000).ok).toBe(true); // other users are not blocked
    releaseAskSlot("a");
    expect(takeAskSlot("a", 2000).ok).toBe(true);
  });

  it("caps questions per 10 minutes, then frees up", () => {
    for (let i = 0; i < ASK_LIMITS.perUser10Min; i++) expect(askAndFinish("a", i * 1000).ok).toBe(true);
    const blocked = askAndFinish("a", 30 * 1000);
    expect(blocked).toMatchObject({ ok: false, message: expect.stringContaining("Slow down") });
    if (!blocked.ok) expect(blocked.retryAfterSec).toBeGreaterThan(0);
    expect(askAndFinish("a", 11 * MIN).ok).toBe(true);
  });

  it("caps questions per user per day", () => {
    // Spread over the day so the 10-minute limit never trips.
    for (let i = 0; i < ASK_LIMITS.perUserDay; i++) expect(askAndFinish("a", i * 11 * MIN).ok).toBe(true);
    expect(askAndFinish("a", ASK_LIMITS.perUserDay * 11 * MIN)).toMatchObject({ ok: false, message: expect.stringContaining("today") });
  });

  it("caps the whole site per day, across many accounts", () => {
    for (let i = 0; i < ASK_LIMITS.siteDay; i++) expect(askAndFinish(`user-${i}`, i).ok).toBe(true);
    expect(askAndFinish("new-account", ASK_LIMITS.siteDay)).toMatchObject({ ok: false, message: expect.stringContaining("whole site") });
  });
});
