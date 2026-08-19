// providers.js — all external data sources for VETTE.
// Everything the engine says must come from here: Base RPC, Blockscout v2, or a fetched website.
// Nothing is invented.
//
// Hardened 2026-08-16:
//   - fetchSite is SSRF-guarded: http(s) only, private/reserved IPs blocked,
//     every redirect hop re-validated.
//   - getApprovalLogs reports completeness: a FAILED scan is never "clean".

import dns from "node:dns/promises";

export const RPC_URLS = [
  "https://mainnet.base.org",
  "https://1rpc.io/base",
  "https://base.drpc.org",
];
export const BASESCAN = "https://base.blockscout.com";
export const EXPLORER_TX = "https://base.blockscout.com/tx/";
export const EXPLORER_ADDR = "https://base.blockscout.com/address/";

const UA = "VETTE/0.1 (agent-audit; +https://vette.agents)";

async function jget(url, { timeout = 20000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      headers: { accept: "application/json", "user-agent": UA },
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

// Retrying fetch for the heavy data sources — serverless egress IPs
// get rate-limited by explorers more often, so one attempt is not enough.
// 429s get a longer backoff: a rate-limit is transient by nature.
async function jgetRetry(url, { attempts = 2, timeout = 20000, delay = 1000 } = {}) {
  let lastErr = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await jget(url, { timeout });
    } catch (e) {
      lastErr = e;
      const limited = String(e?.message || "").includes("HTTP 429");
      const wait = limited ? delay * (i + 1) * 2 : delay * (i + 1);
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr || new Error(`Failed to fetch ${url}`);
}

export async function rpc(method, params = [], attempts = RPC_URLS.length) {
  let lastErr = null;
  for (let i = 0; i < attempts; i++) {
    const url = RPC_URLS[i % RPC_URLS.length];
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
        signal: AbortSignal.timeout(20000),
      });
      const json = await res.json();
      if (json.error) throw new Error(`RPC ${method}: ${json.error.message}`);
      return json.result;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error(`RPC ${method} failed on all endpoints`);
}

// ---------- onchain ----------

export async function getBlockNumber() {
  return parseInt(await rpc("eth_blockNumber"), 16);
}

export async function getBalance(addr) {
  return BigInt(await rpc("eth_getBalance", [addr, "latest"]));
}

export async function getCode(addr) {
  return await rpc("eth_getCode", [addr, "latest"]);
}

export async function getTxs(addr) {
  const d = await jgetRetry(`${BASESCAN}/api/v2/addresses/${addr}/transactions`);
  return (d.items || []).map((t) => ({
    hash: t.hash,
    ts: t.timestamp ? Date.parse(t.timestamp) : Date.now(),
    from: t.from?.hash || null,
    to: t.to?.hash || null,
    toName: t.to?.name || null,
    toVerified: !!t.to?.is_verified,
    toScam: !!t.to?.is_scam,
    toContract: !!t.to?.is_contract,
    value: toBig(t.value),
    input: t.raw_input || null,
    status: t.status || t.result || "unknown",
  }));
}

export async function getTokenTransfers(addr) {
  const d = await jgetRetry(`${BASESCAN}/api/v2/addresses/${addr}/token-transfers`);
  return (d.items || []).map((tt) => ({
    tx: tt.tx_hash,
    block: tt.block_number,
    ts: tt.timestamp ? Date.parse(tt.timestamp) : Date.now(),
    from: tt.from?.hash || null,
    to: tt.to?.hash || null,
    token: tt.token?.symbol || "UNKNOWN",
    tokenAddr: tt.token?.address_hash || tt.token?.address || null,
    decimals: tt.token?.decimals != null ? Number(tt.token.decimals) : 18,
    rawValue: toBig(tt.total?.value),
    usd: tt.total?.value_usd != null ? Number(tt.total.value_usd) : null,
  }));
}

// ---------- RPC fallback for token transfers ----------
// When Blockscout is down, transfer history comes from Transfer events via
// bounded eth_getLogs windows (same technique as the approval scan). If any
// window fails, complete=false and the caller must treat the result as a
// lower bound — never as the full picture.
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const TRANSFER_WINDOWS = 14; // ~140k blocks ≈ 3.3 days back

export async function getTokenTransfersRpc(addr, windows = TRANSFER_WINDOWS) {
  const addrTopic = "0x000000000000000000000000" + addr.slice(2).toLowerCase();
  const latestHex = await rpc("eth_blockNumber");
  const latest = parseInt(latestHex, 16);
  const ranges = [];
  for (let w = 0; w < windows; w++) {
    const to = latest - w * LOG_WINDOW;
    const from = Math.max(0, to - LOG_WINDOW);
    ranges.push({ from, to });
    if (from === 0) break;
  }
  const results = await Promise.all(
    ranges.flatMap(({ from, to }) =>
      // outbound (topic1 = addr) + inbound (topic2 = addr), per window
      [addrTopic, null].map((topic1) =>
        rpc("eth_getLogs", [
          {
            fromBlock: "0x" + from.toString(16),
            toBlock: "0x" + to.toString(16),
            topics: topic1 ? [TRANSFER_TOPIC, topic1] : [TRANSFER_TOPIC, null, addrTopic],
          },
        ])
          .then((logs) => ({ ok: true, logs }))
          .catch(() => ({ ok: false, logs: null }))
      )
    )
  );
  const items = [];
  let complete = true;
  for (const r of results) {
    if (!r.ok || r.logs === null) {
      complete = false;
      continue;
    }
    for (const l of r.logs || []) {
      items.push({
        tx: l.transactionHash,
        block: parseInt(l.blockNumber, 16),
        from: topicAddr(l.topics?.[1]),
        to: topicAddr(l.topics?.[2]),
        tokenAddr: (l.address || "").toLowerCase(),
        token: "UNKNOWN",
        decimals: 18,
        rawValue: l.data && l.data.length >= 66 ? BigInt(l.data) : 0n,
        usd: null,
      });
    }
  }
  // resolve symbols for the distinct tokens (capped, so a busy wallet cannot
  // trigger hundreds of contract reads)
  const distinct = [...new Set(items.map((t) => t.tokenAddr))].slice(0, 12);
  await Promise.all(
    distinct.map(async (tk) => {
      const sym = await getTokenSymbol(tk);
      if (sym) for (const t of items) if (t.tokenAddr === tk) t.token = sym;
    })
  );
  // keep the newest first, like the explorer shape
  items.sort((a, b) => b.block - a.block);
  return { items, complete };
}

// Approval events (ERC20/ERC721): topic0 = keccak("Approval(address,address,uint256)")
const APPROVAL_TOPIC = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";
const LOG_WINDOW = 10000; // public RPC range cap
const APPROVAL_WINDOWS = 16; // ~160k blocks ≈ 3.7 days back (parallel fetch, bounded by RPC health)
export const APPROVAL_SCOPE = { LOG_WINDOW, APPROVAL_WINDOWS };

function topicAddr(topic) {
  if (!topic) return null;
  return "0x" + topic.slice(26).toLowerCase();
}

// Approval events WHERE THE TARGET IS THE OWNER, via bounded RPC log scan.
// Returns { logs, complete }: complete=false means at least one window failed,
// and the caller must treat the absence of findings as "unknown", never "clean".
export async function getApprovalLogs(addr) {
  const ownerTopic = "0x000000000000000000000000" + addr.slice(2).toLowerCase();
  const latestHex = await rpc("eth_blockNumber");
  const latest = parseInt(latestHex, 16);
  // windows: [latest-W, latest], [latest-2W, latest-W), ... — parallel fetch
  const ranges = [];
  for (let w = 0; w < APPROVAL_WINDOWS; w++) {
    const to = latest - w * LOG_WINDOW;
    const from = Math.max(0, to - LOG_WINDOW);
    ranges.push({ from, to });
    if (from === 0) break;
  }
  const results = await Promise.all(
    ranges.map(({ from, to }) =>
      rpc("eth_getLogs", [
        {
          fromBlock: "0x" + from.toString(16),
          toBlock: "0x" + to.toString(16),
          topics: [APPROVAL_TOPIC, ownerTopic],
        },
      ])
        .then((logs) => ({ ok: true, logs }))
        .catch(() => ({ ok: false, logs: null }))
    )
  );
  const out = [];
  let complete = true;
  for (const r of results) {
    if (!r.ok || r.logs === null) {
      complete = false;
      continue;
    }
    for (const l of r.logs || []) {
      out.push({
        tx: l.transactionHash,
        block: parseInt(l.blockNumber, 16),
        tokenAddr: (l.address || "").toLowerCase(),
        owner: topicAddr(l.topics?.[1]),
        spender: topicAddr(l.topics?.[2]),
        value: l.data && l.data.length >= 66 ? BigInt(l.data) : 0n,
      });
    }
  }
  out.sort((a, b) => b.block - a.block);
  return { logs: out, complete };
}

const ALLOWANCE_SELECTOR = "0xdd62ed3e";

// token symbol via direct contract read — works for any wallet, including
// fresh burners with no transfer history (the drill caught "(token)" labels).
const SYMBOL_SELECTOR = "0x95d89b41";
const symbolCache = new Map();

export async function getTokenSymbol(tokenAddr) {
  if (!tokenAddr) return null;
  if (symbolCache.has(tokenAddr)) return symbolCache.get(tokenAddr);
  try {
    const out = await rpc("eth_call", [{ to: tokenAddr, data: SYMBOL_SELECTOR }, "latest"]);
    const hex = String(out).slice(2);
    if (!hex || hex.length < 128) return null;
    const len = parseInt(hex.slice(64, 128), 16);
    if (len === 0 || 128 + len * 2 > hex.length) return null;
    const str = Buffer.from(hex.slice(128, 128 + len * 2), "hex").toString("utf8").replace(/\0/g, "");
    const val = str.trim() || null;
    symbolCache.set(tokenAddr, val);
    return val;
  } catch {
    return null;
  }
}
function pad32(hexNoPrefix) {
  return hexNoPrefix.slice(2).toLowerCase().padStart(64, "0");
}

// Current live allowance: allowance(owner, spender) on the token contract.
export async function currentAllowance(tokenAddr, owner, spender) {
  const data = ALLOWANCE_SELECTOR + pad32(owner) + pad32(spender);
  try {
    const out = await rpc("eth_call", [{ to: tokenAddr, data }, "latest"]);
    return BigInt(out);
  } catch {
    return 0n;
  }
}

const MAX_UINT = (1n << 256n) - 1n;

export async function getSmartContract(addr) {
  try {
    const d = await jget(`${BASESCAN}/api/v2/smart-contracts/${addr}`);
    return {
      name: d.name || null,
      verified: !!d.is_verified,
      scam: !!d.is_scam,
      proxy: d.proxy_type || null,
    };
  } catch {
    return null;
  }
}

// ---------- website ----------

// Addresses "published" by the site = present in visible copy, in link paths
// (e.g. explorer links), or in explicit data attributes. Query strings
// (?address=…) are navigation, NOT publication — a site linking to its own
// demo wallets must not be treated as declaring those wallets as its own.
export function extractAddresses(html, text, title, desc) {
  const set = new Set();
  const push = (s) => {
    if (!s) return;
    const re = /0x[a-fA-F0-9]{40}/g;
    let m;
    while ((m = re.exec(s))) set.add(m[0].toLowerCase());
  };
  push(text);
  push(title);
  push(desc);
  // link paths (before any query string)
  const hrefRe = /href\s*=\s*["']([^"']+)["']/gi;
  let h;
  while ((h = hrefRe.exec(html))) {
    const path = h[1].split("?")[0];
    push(path);
  }
  // explicit data attributes that declare an address
  const attrRe = /data-(?:q|address|wallet|contract)\s*=\s*["']([^"']+)["']/gi;
  let a;
  while ((a = attrRe.exec(html))) push(a[1]);
  return [...set];
}

export function extractLinks(html) {
  if (!html) return [];
  const out = [];
  const re = /<a\s[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    out.push({ href: m[1].trim(), text: m[2].replace(/<[^>]+>/g, "").trim() });
  }
  return out;
}

export function normalizeUrl(u) {
  if (!u) return null;
  u = u.trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  let parsed;
  try {
    parsed = new URL(u);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null; // no ftp://, file://, etc.
  return parsed.href;
}

// ---------- SSRF guards ----------

function isPrivateIp(ip) {
  if (!ip) return true;
  if (ip.startsWith("::ffff:")) ip = ip.slice(7);
  const parts = ip.split(".").map(Number);
  const v4 = parts.length === 4 && parts.every((p) => Number.isInteger(p) && p >= 0 && p <= 255);
  if (v4) {
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast/reserved
    return false;
  }
  // ipv6: link-local, loopback, unique-local, unspecified
  const low = ip.toLowerCase();
  if (low === "::" || low === "::1") return true;
  if (low.startsWith("fe8") || low.startsWith("fe9") || low.startsWith("fea") || low.startsWith("feb")) return true;
  if (low.startsWith("fc") || low.startsWith("fd")) return true;
  return false;
}

async function validateHost(hostname) {
  // returns {ok:true} or {ok:false, reason}
  if (hostname === "localhost" || hostname.endsWith(".local")) {
    return { ok: false, reason: "private hostname" };
  }
  try {
    const addrs = await dns.lookup(hostname, { all: true });
    if (!addrs || !addrs.length) return { ok: false, reason: "host does not resolve" };
    for (const a of addrs) {
      if (isPrivateIp(a.address)) return { ok: false, reason: "private or reserved address" };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "DNS lookup failed" };
  }
}

const MAX_REDIRECTS = 3;

export async function fetchSite(rawUrl) {
  const url = normalizeUrl(rawUrl);
  if (!url) return { ok: false, error: "Invalid URL", url: rawUrl };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    // SSRF: validate the host of every hop, manual redirects.
    let current = new URL(url);
    let res = null;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const hostCheck = await validateHost(current.hostname);
      if (!hostCheck.ok) {
        return { ok: false, error: `Refused to fetch ${current.hostname}: ${hostCheck.reason}`, url };
      }
      res = await fetch(current.href, {
        headers: { "user-agent": "Mozilla/5.0 (compatible; VETTE-audit/0.1)" },
        signal: ctrl.signal,
        redirect: "manual",
        cache: "no-store",
      });
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (!loc) return { ok: false, error: "Redirect without location", url };
        current = new URL(loc, current);
        continue;
      }
      break;
    }
    if (!res) return { ok: false, error: "Fetch failed", url };
    const html = await res.text();
    const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]?.trim() || null;
    const desc =
      (html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) || [])[1] ||
      null;
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .replace(/&gt;/gi, ">")
      .replace(/&lt;/gi, "<")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&nbsp;/gi, " ")
      .trim();
    const links = extractLinks(html);
    const socials = {
      x: links.find((l) => /(^https?:\/\/(x\.com|twitter\.com)\/)/i.test(l.href))?.href || null,
      github: links.find((l) => /github\.com\//i.test(l.href))?.href || null,
      discord: links.find((l) => /discord\.(com|gg)\//i.test(l.href))?.href || null,
      telegram: links.find((l) => /t\.me\//i.test(l.href))?.href || null,
    };
    const demo = links.find((l) => /(demo|app|try|live)/i.test(l.href + " " + l.text))?.href || null;
    return {
      ok: true,
      url: res.url || url,
      status: res.status,
      title,
      desc,
      text,
      links,
      socials,
      demo,
      addresses: extractAddresses(html, text, title, desc),
    };
  } catch (e) {
    return { ok: false, error: e.name === "AbortError" ? "Timeout fetching site" : String(e.message || e), url };
  } finally {
    clearTimeout(t);
  }
}

// ---------- helpers ----------

export function toBig(v) {
  if (v == null) return 0n;
  if (typeof v === "bigint") return v;
  if (typeof v === "number") return BigInt(Math.round(v));
  const s = String(v).trim();
  if (!s || s === "null") return 0n;
  try {
    if (s.startsWith("0x")) return BigInt(s);
    if (/^\d+$/.test(s)) return BigInt(s);
    return 0n;
  } catch {
    return 0n;
  }
}

export function fmtEth(wei) {
  const w = toBig(wei);
  const neg = w < 0n;
  const a = neg ? -w : w;
  const whole = a / 10n ** 18n;
  const frac = (a % 10n ** 18n).toString().padStart(18, "0").slice(0, 4);
  return `${neg ? "-" : ""}${whole.toLocaleString("en-US")}.${frac} ETH`;
}

export function fmtUnits(raw, decimals = 18) {
  const r = toBig(raw);
  // near-max-uint256 = the classic "unlimited" allowance
  if (r >= MAX_UINT_BIG - MAX_UINT_BIG / 1000000n) return "∞ (unlimited)";
  const d = BigInt(Math.max(0, Math.min(18, decimals || 18)));
  const whole = r / 10n ** d;
  const frac = (r % 10n ** d).toString().padStart(Number(d), "0").slice(0, 2);
  return `${whole.toLocaleString("en-US")}${frac !== "00" && frac !== "0" ? "." + frac : ""}`;
}

export function shortAddr(a) {
  if (!a) return "?";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function ageDays(ts) {
  return Math.max(0, Math.round((Date.now() - ts) / 86400000));
}

export const MAX_UINT_BIG = MAX_UINT;
