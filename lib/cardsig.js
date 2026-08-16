// cardsig.js — HMAC-signed share cards.
// The card endpoint renders ONLY verdicts signed by the server with
// VETTE_CARD_SECRET. Query params alone are not proof — this is the
// "every claim traces to a receipt" guarantee, applied to the card.

import crypto from "node:crypto";

export function signCard({ v, s, t }) {
  const secret = process.env.VETTE_CARD_SECRET;
  if (!secret) return null;
  const payload = `${v}|${s ?? ""}|${t ?? ""}`;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex").slice(0, 32);
}

export function verifyCard({ v, s, t, sig }) {
  const secret = process.env.VETTE_CARD_SECRET;
  if (!secret) return false;
  const expect = signCard({ v, s, t });
  if (!expect) return false;
  const a = Buffer.from(String(sig || ""));
  const b = Buffer.from(expect);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function cardConfigured() {
  return !!process.env.VETTE_CARD_SECRET;
}
