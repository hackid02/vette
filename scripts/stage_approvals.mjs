// stage_approvals.mjs — fires the drill: each funded burner sends a REAL
// approve() transaction on Base mainnet.
//   unlimited → approve(max uint, USDC, Uniswap SwapRouter02)   [WARNING]
//   shady     → approve(1,000 USDC, unverified contract)        [DANGEROUS]
//   clean     → approve(100 USDC, router) then approve(0)       [COMPLIANT]
// Prints every tx hash. Then Vette audits them and the kill switch closes
// the dangerous one on camera.
import { ethers } from "ethers";
import fs from "fs";
import path from "path";

const RPC = "https://mainnet.base.org";
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const ROUTER = "0x2626664c2603336E57B271c5C0b26F421741e481"; // SwapRouter02 (verified)
const SHADY = "0x7c1bFb0a20b729c60e772bA3eBa9ab7091B7fdc9"; // unverified contract

const APPROVE = "0x095ea7b3";
const MAX = (1n << 256n) - 1n;
const ONE_K_USDC = 1000n * 10n ** 6n; // USDC has 6 decimals
const HUNDRED_USDC = 100n * 10n ** 6n;

const pad32 = (h) => h.slice(2).toLowerCase().padStart(64, "0");
const approveData = (spender, amount) =>
  APPROVE + pad32(spender) + amount.toString(16).padStart(64, "0");

function load() {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "staging.json"), "utf8"));
}
function save(data) {
  fs.writeFileSync(path.join(process.cwd(), "data", "staging.json"), JSON.stringify(data, null, 2));
}

const provider = new ethers.JsonRpcProvider(RPC);

async function send(wallet, to, data, label) {
  const feeData = await provider.getFeeData();
  const tx = await wallet.sendTransaction({
    to,
    data,
    gasLimit: 120000,
    maxFeePerGas: feeData.maxFeePerGas || 2000000000n,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || 1000000n,
    chainId: 8453,
  });
  console.log(`  ✓ ${label} sent: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`    confirmed in block ${receipt.blockNumber} · status ${receipt.status === 1 ? "success" : "REVERTED"}`);
  return tx.hash;
}

async function main() {
  const data = load();
  for (const b of data.burners) {
    if (!b.funded) {
      const bal = await provider.getBalance(b.address);
      if (bal === 0n) {
        console.log(`${b.role}: NOT FUNDED (0 ETH) — skipping. Send 0.0001 ETH first.`);
        continue;
      }
      console.log(`${b.role}: ${ethers.formatEther(bal)} ETH available`);
      const wallet = new ethers.Wallet(b.privateKey, provider);
      try {
        if (b.role === "unlimited") {
          b.txs.push({ type: "approve", to: USDC, spender: ROUTER, label: "unlimited USDC → SwapRouter02", hash: await send(wallet, USDC, approveData(ROUTER, MAX), "unlimited USDC → SwapRouter02") });
        } else if (b.role === "shady") {
          b.txs.push({ type: "approve", to: USDC, spender: SHADY, label: "1,000 USDC → unverified contract", hash: await send(wallet, USDC, approveData(SHADY, ONE_K_USDC), "1,000 USDC → unverified contract") });
        } else if (b.role === "clean") {
          b.txs.push({ type: "approve", to: USDC, spender: ROUTER, label: "100 USDC → router", hash: await send(wallet, USDC, approveData(ROUTER, HUNDRED_USDC), "100 USDC → router") });
          b.txs.push({ type: "revoke", to: USDC, spender: ROUTER, label: "closed it again (approve 0)", hash: await send(wallet, USDC, approveData(ROUTER, 0n), "closed it again (approve 0)") });
        }
        b.funded = true;
      } catch (e) {
        console.log(`  ✗ ${b.role} failed: ${e.shortMessage || e.message}`);
      }
    } else {
      console.log(`${b.role}: already ran (${b.txs.length} tx(s)). Skipping.`);
    }
  }
  save(data);
  console.log("\n=== DRILL FIRED — now audit each burner ===");
  for (const b of data.burners) {
    console.log(`POST /api/audit { address: ${b.address} }`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
