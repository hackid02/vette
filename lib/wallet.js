// wallet.js — client-only EIP-1193 wallet layer for the KILL move.
// Vette requests ONE thing: an approve(spender, 0) transaction. Nothing else.
// No keys, no custody, no other contracts. The user signs in their own wallet.
//
// Multi-wallet safe: modern extensions announce themselves via EIP-6963 and
// the user picks; legacy extensions are detected via window.ethereum et al.

const BASE_CHAIN_ID = 8453;
const BASE_CHAIN_HEX = "0x2105";

// ---------- EIP-6963 discovery ----------

let announced = new Map(); // rdns -> { info, provider }
let bound = false;

function bindEip6963() {
  if (typeof window === "undefined" || bound) return;
  bound = true;
  window.addEventListener("eip6963:announceProvider", (e) => {
    const d = e?.detail;
    if (d?.provider && d?.info?.rdns) announced.set(d.info.rdns, d);
  });
  try {
    window.dispatchEvent(new Event("eip6963:requestProvider"));
  } catch {}
}

// All wallets Vette can see, newest-first. EIP-6963 entries first (they are
// the modern ones), legacy injected providers after.
export function listWallets() {
  if (typeof window === "undefined") return [];
  bindEip6963();
  const wallets = [];
  for (const [rdns, d] of announced) {
    wallets.push({
      id: rdns,
      name: d.info?.name || rdns,
      icon: d.info?.icon || null,
      provider: d.provider,
    });
  }
  const seen = new Set(wallets.map((w) => w.provider));
  const legacy = [];
  if (window.ethereum && !seen.has(window.ethereum)) {
    const eth = window.ethereum;
    legacy.push({
      id: eth.isRabby ? "io.rabby" : eth.isMetaMask ? "io.metamask" : "injected",
      name: eth.isRabby ? "Rabby" : eth.isMetaMask ? "MetaMask" : "Injected Wallet",
      icon: null,
      provider: eth,
    });
  }
  if (window.okxwallet && !seen.has(window.okxwallet)) {
    legacy.push({ id: "com.okex.wallet", name: "OKX Wallet", icon: null, provider: window.okxwallet });
  }
  return [...wallets, ...legacy];
}

export function getProvider() {
  const w = listWallets()[0];
  return w ? w.provider : null;
}

export function hasWallet() {
  return listWallets().length > 0;
}

export function isSandboxedFrame() {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function isMobileDevice() {
  if (typeof window === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
}

function friendly(e) {
  const m = String(e?.message || e || "");
  if (/broadcast channel/i.test(m)) {
    // This error comes FROM the wallet extension itself: its content-script
    // channel failed to open (a known glitch in some extensions, especially
    // right after install or update — Trust Wallet's desktop extension in
    // particular). It is NOT about Vette running in a frame.
    return "That wallet's internal channel didn't open — a known glitch in some wallet extensions, often right after install or update. Open the extension and unlock it (or restart the browser), then retry — or pick a different wallet: CONNECT WALLET → choose another.";
  }
  return m;
}

function withTimeout(promise, ms, msg) {
  let t;
  const timeout = new Promise((_, rej) => {
    t = setTimeout(() => rej(new Error(msg)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

export async function connectWallet(walletOrProvider) {
  const p = walletOrProvider?.provider || walletOrProvider || getProvider();
  if (!p) {
    throw new Error("No wallet detected. Install MetaMask, Rabby, or Coinbase Wallet and reload.");
  }
  let accounts;
  try {
    accounts = await withTimeout(
      p.request({ method: "eth_requestAccounts" }),
      25000,
      "No wallet popup appeared within 25s. Unlock your wallet and retry — or if several extensions are installed, pick a different wallet from the list."
    );
  } catch (e) {
    throw new Error(friendly(e) || "Wallet rejected or failed to connect.");
  }
  if (!accounts || !accounts.length) throw new Error("No account returned by the wallet.");
  const chainId = await p.request({ method: "eth_chainId" }).catch(() => null);
  return {
    account: accounts[0].toLowerCase(),
    chainId: chainId ? parseInt(chainId, 16) : null,
    provider: p,
  };
}

export async function ensureBase(provider) {
  const chainId = await provider.request({ method: "eth_chainId" }).catch(() => null);
  const id = chainId ? parseInt(chainId, 16) : null;
  if (id === BASE_CHAIN_ID) return;
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_CHAIN_HEX }],
    });
  } catch (e) {
    if (e && e.code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: BASE_CHAIN_HEX,
            chainName: "Base",
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://mainnet.base.org"],
            blockExplorerUrls: ["https://base.blockscout.com"],
          },
        ],
      });
    } else {
      throw new Error("Switch your wallet to Base first. " + (e?.message || ""));
    }
  }
}

// approve(address,uint256)
const APPROVE_SELECTOR = "0x095ea7b3";

export function buildRevokeData(spender) {
  if (!/^0x[a-fA-F0-9]{40}$/.test(spender || "")) {
    throw new Error("Invalid spender address — refusing to build calldata.");
  }
  const pad32 = (hexNoPrefix) => hexNoPrefix.slice(2).toLowerCase().padStart(64, "0");
  return APPROVE_SELECTOR + pad32(spender) + "0".padStart(64, "0");
}

async function publicRpc(method, params) {
  const urls = ["https://mainnet.base.org", "https://base.drpc.org", "https://1rpc.io/base"];
  let lastErr = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
        signal: AbortSignal.timeout(15000),
      });
      const j = await res.json();
      if (j.error) throw new Error(j.error.message);
      return j.result;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("RPC failed");
}

export async function preflightRevoke(token, owner, spender) {
  try {
    await publicRpc("eth_call", [
      { from: owner, to: token, data: buildRevokeData(spender) },
      "latest",
    ]);
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: String(e.message || e).slice(0, 180) };
  }
}

export async function sendRevoke({ provider, account, token, spender }) {
  return provider.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: account,
        to: token,
        data: buildRevokeData(spender),
        value: "0x0", // no ETH moves. ever.
        chainId: BASE_CHAIN_HEX, // pinned: a mistimed network switch must reject, not sign on the wrong chain
      },
    ],
  });
}

export async function waitForReceipt(txHash, { timeoutMs = 45000 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await publicRpc("eth_getTransactionReceipt", [txHash]);
      if (r && r.blockNumber) {
        return {
          ok: true,
          status: r.status === "0x1" ? "success" : "reverted",
          receipt: r,
        };
      }
    } catch {
      // rpc hiccup — keep polling
    }
    await new Promise((res) => setTimeout(res, 2000));
  }
  return { ok: false, error: "Confirmation is taking long — check the explorer: " + txHash };
}
