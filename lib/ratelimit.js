// ratelimit.js — in-memory sliding-window rate limiter.
// Keeps the open endpoints from being used as an amplification proxy and
// slows down anything that would get the shared egress IP banned mid-demo.
// Per-lambda on Vercel (acknowledged — a warm instance enforces it); expired
// keys are swept opportunistically so the Map cannot grow unbounded.

const windows = new Map(); // key -> { count, resetAt }
const MAX_ENTRIES = 1000;

export function rateLimit(key, { limit = 10, windowMs = 60000 } = {}) {
  const now = Date.now();
  // opportunistic sweep: when the map gets big, drop everything expired
  if (windows.size > MAX_ENTRIES) {
    for (const [k, v] of windows) {
      if (now >= v.resetAt) windows.delete(k);
    }
  }
  const cur = windows.get(key);
  if (!cur || now >= cur.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  cur.count += 1;
  if (cur.count > limit) {
    return { ok: false, retryAfterSec: Math.ceil((cur.resetAt - now) / 1000) };
  }
  return { ok: true };
}

export function clientIp(req) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
