// alibi.js — THE ALIBI: "Every court needs a defense."
// Accuse any wallet. Vette rebuilds the money-trail from the chain and shows
// where every coin went — hop by hop. Deterministic classification:
//
//   RETURNED  — value sent out, then sent back to the accused
//   SENT ON   — value moved onward to another wallet
//   RESTING   — value still sitting where it landed
//   CONVERTED — value left as a different asset (a swap)
//
// Verdicts:
//   THE MONEY CAME HOME — tracked outbound value came back to the wallet
//   THE MONEY LEFT      — tracked value rests elsewhere, return < threshold
//   TRAIL TOO SHALLOW   — not enough reachable history to say either way
//
// Vette never decides motive. The trail is a matter of receipts.

const RETURN_SHARE = 0.6; // ≥60% of tracked outbound value back → came home
const LEFT_SHARE = 0.6; //   ≥60% resting/sent away → the money left

// A real token symbol is printable ASCII. Symbols with hidden marks
// ("EṬH", "USDC ") are imitation tokens — dust sent to fake value.
function cleanSymbol(sym) {
  if (!sym) return null;
  if (!/^[\x20-\x7E]{2,14}$/.test(sym)) return null;
  return sym.trim() || null;
}

const DEX_ROUTER_HINTS = /swap|router|aggregator|1inch|0x|uniswap|aerodrome|odos|paraswap|matcha|kyber|dex/i;

function sameToken(a, b) {
  return (a || "").toLowerCase() === (b || "").toLowerCase();
}

export function buildTimeline({ address, transfers }) {
  const acc = address.toLowerCase();
  const events = [];
  let totalIn = 0n;
  let totalOut = 0n;

  for (const t of transfers || []) {
    const from = (t.from || "").toLowerCase();
    const to = (t.to || "").toLowerCase();
    const val = BigInt(t.rawValue || 0);
    const sym = cleanSymbol(t.token);
    const t2 = { ...t, token: sym || "IMITATION", imitation: !sym };
    if (from === acc) {
      totalOut += val;
      events.push({ dir: "OUT", ...t2, raw: val });
    } else if (to === acc) {
      totalIn += val;
      events.push({ dir: "IN", ...t2, raw: val });
    }
  }

  events.sort((a, b) => (b.block || 0) - (a.block || 0));
  return { events, totalIn, totalOut };
}

// Follow the top outflows one hop: what did the recipient do with the value?
export function traceHops({ address, transfers, maxHops = 3 }) {
  const acc = address.toLowerCase();
  const { events } = buildTimeline({ address, transfers });
  let outflows = events.filter((e) => e.dir === "OUT" && e.raw > 0n);
  const realFlows = outflows.filter((e) => !e.imitation);
  // imitation dust is only shown when nothing real is in reach
  outflows = (realFlows.length ? realFlows : outflows).slice(0, maxHops);
  const hops = [];

  for (const out of outflows) {
    const recipient = out.to;
    // everything the recipient received of that token after this transfer,
    // and everything it sent onward
    const recipEvents = (transfers || []).filter(
      (t) =>
        (t.from || "").toLowerCase() === recipient &&
        sameToken(t.tokenAddr, out.tokenAddr)
    );

    let returned = 0n;
    let sentOn = 0n;
    for (const r of recipEvents) {
      if ((r.to || "").toLowerCase() === acc) returned += BigInt(r.rawValue || 0);
      else if (r.rawValue) sentOn += BigInt(r.rawValue || 0);
    }

    let label;
    if (returned > 0n && returned >= (BigInt(out.rawValue || 0) * 3n) / 4n) {
      label = "RETURNED";
    } else if (sentOn > 0n) {
      label = DEX_ROUTER_HINTS.test((recipient || "") + " " + (out.toName || "")) ? "CONVERTED" : "SENT ON";
    } else {
      label = "RESTING";
    }

    hops.push({
      tx: out.tx,
      token: out.token,
      raw: out.raw,
      usd: out.usd,
      to: out.to,
      toName: out.toName || null,
      label,
      returned,
      sentOn,
      block: out.block,
    });
  }
  return hops;
}

export function runAlibi({ address, transfers, charge = "", scope = "" }) {
  const { totalIn, totalOut, events } = buildTimeline({ address, transfers });
  const hops = traceHops({ address, transfers });

  // classify the tracked value
  let returnedTotal = 0n;
  let leftTotal = 0n;
  for (const h of hops) {
    if (h.label === "RETURNED") returnedTotal += h.raw;
    else leftTotal += h.raw;
  }
  const tracked = returnedTotal + leftTotal;

  let verdict;
  let verdictDetail;
  if (tracked === 0n) {
    verdict = "TRAIL TOO SHALLOW";
    verdictDetail =
      "The chain history within reach does not contain enough outbound value to follow. Vette will not invent a trail — the alibi is only as deep as the data.";
  } else if (returnedTotal * 5n >= tracked * 3n) {
    // returned ≥ 60% of tracked
    verdict = "THE MONEY CAME HOME";
    verdictDetail =
      "Most of the tracked outbound value was sent back to the wallet. On the evidence of the chain, the funds are home.";
  } else if (leftTotal * 5n >= tracked * 3n) {
    verdict = "THE MONEY LEFT";
    verdictDetail =
      "Most of the tracked outbound value rests in other wallets or moved onward. The trail shows where it went — motive is a matter for humans.";
  } else {
    verdict = "TRAIL TOO SHALLOW";
    verdictDetail =
      "The value splits between returned and departed without a clear majority. More history would sharpen the answer.";
  }

  const outEvents = events.filter((e) => e.dir === "OUT").slice(0, 10);
  const inEvents = events.filter((e) => e.dir === "IN").slice(0, 5);
  const s = (v) => (typeof v === "bigint" ? v.toString() : v);

  return {
    address,
    charge: charge || "Where did the money go?",
    verdict,
    verdictDetail,
    timeline: {
      outbound: outEvents.map((e) => ({ tx: e.tx, token: e.token, raw: s(e.raw), usd: e.usd, to: e.to, block: e.block, ts: e.ts })),
      inbound: inEvents.map((e) => ({ tx: e.tx, token: e.token, raw: s(e.raw), usd: e.usd, from: e.from, block: e.block, ts: e.ts })),
    },
    hops: hops.map((h) => ({ ...h, raw: s(h.raw), returned: s(h.returned), sentOn: s(h.sentOn) })),
    scope,
    deterministic: true,
  };
}
