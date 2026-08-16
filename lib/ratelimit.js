// ratelimit.js — in-memory sliding-window rate limiter.
// Keeps the open endpoints from being used as an amplification proxy and
// slows down anything that would get the shared egress IP banned mid-demo.

const windows = new Map(); // key -> { count, resetAt }

export function rateLimit(key, { limit = 10, windowMs = 60000 } = {}) {
  const now = Date.now();
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
