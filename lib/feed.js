// feed.js — The Ledger builder. Shared by the /api/feed route and the /feed page.
// Merges three honest sources:
//   1. machine events from the autonomous run log (GitHub, live fetch + bundled fallback)
//   2. drift events computed BETWEEN consecutive runs (the agent noticing its own
//      observations change — nothing re-published, just recorded)
//   3. curated milestones, every one with an evidence link
import fs from "fs";
import path from "path";

const GITHUB_RAW =
  "https://raw.githubusercontent.com/hackid02/vette/main/data/agent-log.json";

async function fetchLog() {
  try {
    const res = await fetch(GITHUB_RAW, {
      headers: { "user-agent": "VETTE/0.1 (feed)" },
      signal: AbortSignal.timeout(12000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    try {
      return JSON.parse(
        fs.readFileSync(path.join(process.cwd(), "data", "agent-log.json"), "utf8")
      );
    } catch {
      return null;
    }
  }
}

function fmtWeiDelta(fromHex, toHex) {
  try {
    const a = BigInt(fromHex || "0x0");
    const b = BigInt(toHex || "0x0");
    const eth = Number(b - a) / 1e18;
    const sign = eth >= 0 ? "+" : "−";
    return `${sign}${Math.abs(eth).toFixed(3)} ETH`;
  } catch {
    return null;
  }
}

function computeDrift(runs) {
  const events = [];
  const sorted = [...(runs || [])].sort((a, b) => (a.at < b.at ? 1 : -1)); // newest first
  for (let i = 0; i < sorted.length - 1; i++) {
    const cur = sorted[i];
    const prev = sorted[i + 1];
    const prevByName = new Map((prev.checks || []).map((c) => [c.name, c]));
    for (const c of cur.checks || []) {
      const p = prevByName.get(c.name);
      if (!p) continue;
      const txDelta = (c.wallet?.txCount ?? 0) - (p.wallet?.txCount ?? 0);
      const siteChanged = (p.site?.note || "") !== (c.site?.note || "");
      const balChanged =
        c.wallet?.balanceWei !== p.wallet?.balanceWei && c.wallet?.balanceWei && p.wallet?.balanceWei;
      if (txDelta !== 0 || siteChanged || balChanged) {
        const parts = [];
        if (txDelta !== 0) parts.push(`tx count ${p.wallet?.txCount} → ${c.wallet?.txCount} (${txDelta > 0 ? "+" : ""}${txDelta})`);
        if (siteChanged) parts.push(`site ${p.site?.note || "?"} → ${c.site?.note || "?"}`);
        if (balChanged) parts.push(`balance ${fmtWeiDelta(p.wallet?.balanceWei, c.wallet?.balanceWei)}`);
        events.push({
          date: (cur.at || "").slice(0, 10),
          type: "DRIFT",
          title: `${c.name} moved between runs — ${parts.join(" · ")}`,
          detail: `The agent noticed its own reading change between run ${prev.id.slice(-6)} and run ${cur.id.slice(-6)}. Nothing was re-published; the ledger simply records that the chain moved.`,
          runId: cur.id,
          auto: true,
        });
      }
    }
  }
  return events.slice(0, 20);
}

export async function buildFeed() {
  const log = await fetchLog();
  const runs = (log?.runs || []).slice(0, 50);
  const milestones = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "data", "milestones.json"), "utf8")
  ).milestones;

  const runEvents = runs.map((r) => ({
    date: (r.at || "").slice(0, 10),
    type: "RUN",
    title: `Autonomous field check — ${r.entriesChecked} entries at block ${r.block}`,
    detail: `${(r.checks || []).filter((c) => c.site?.note === "up").length} site(s) up, ${(r.checks || []).filter((c) => c.wallet?.note === "active").length} wallet(s) active. Reason: ${r.reason}.`,
    runId: r.id,
    auto: true,
  }));

  const driftEvents = computeDrift(runs);

  const feed = [...runEvents, ...driftEvents, ...milestones].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : a.auto && !b.auto ? 1 : -1
  );

  return {
    stats: {
      runs: runs.length,
      lastRunAt: runs[0]?.at || null,
      entriesWatched: (runs[0]?.checks || []).length,
      catches: milestones.filter((m) => m.type === "CATCH").length,
      refusals: milestones.filter((m) => m.type === "REFUSAL").length,
    },
    feed: feed.slice(0, 40),
    source: log ? "live" : "bundled-fallback",
    fetchedAt: new Date().toISOString(),
  };
}
