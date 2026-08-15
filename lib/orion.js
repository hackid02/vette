// orion.js — the contest's own data, so Vette can vet the whole field.
// Source: https://orionagents.org/api/hackathon/entries (public API).

let cache = { at: 0, data: null };
const TTL = 10 * 60 * 1000; // 10 min

export async function fetchEntries({ force = false } = {}) {
  if (!force && cache.data && Date.now() - cache.at < TTL) return cache.data;
  const res = await fetch("https://orionagents.org/api/hackathon/entries", {
    headers: { "user-agent": "VETTE/0.1 (field-vet; +https://vette-nu.vercel.app)" },
    signal: AbortSignal.timeout(20000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Orion API HTTP ${res.status}`);
  const json = await res.json();
  const entries = (json.entries || []).map((e) => ({
    id: e.id,
    name: e.name,
    builder: e.builderName,
    category: e.category,
    chain: e.chain,
    description: e.description,
    website: (e.websiteUrl || "").trim(),
    demo: (e.demoUrl || "").trim(),
    socials: {
      github: e.socialLinks?.github || null,
      twitter: e.socialLinks?.twitter || null,
      discord: e.socialLinks?.discord || null,
      telegram: e.socialLinks?.telegram || null,
    },
    intelligenceScore: e.intelligenceScore,
    status: e.status,
    submittedAt: e.submittedAt,
    wallet: e.submitterWallet || null,
    votes: e.votes,
    placement: e.placement,
  }));
  cache = { at: Date.now(), data: entries };
  return entries;
}
