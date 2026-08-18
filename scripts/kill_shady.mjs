// kill_shady.mjs — THE KILL SHOT, fired by the drill crew.
// SHADY approved 1,000 USDC to an unverified contract. Vette found it:
// DANGEROUS 82. Now we end it: approve(spender, 0) from the burner itself.
import { ethers } from "ethers";
import fs from "fs";
import path from "path";

const RPC = "https://mainnet.base.org";
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const SHADY_SPENDER = "0x7c1bFb0a20b729c60e772bA3eBa9ab7091B7fdc9";

const APPROVE = "0x095ea7b3";
const pad32 = (h) => h.slice(2).toLowerCase().padStart(64, "0");
const revokeData = APPROVE + pad32(SHADY_SPENDER) + "0".padStart(64, "0");

const data = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "data", "staging.json"), "utf8")
);
const shady = data.burners.find((b) => b.role === "shady");
if (!shady) {
  console.error("shady burner not found");
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(RPC);
const wallet = new ethers.Wallet(shady.privateKey, provider);

async function main() {
  // preflight: simulate first — never sign a failing tx
  try {
    await provider.call({ from: wallet.address, to: USDC, data: revokeData });
    console.log("preflight: approve(0) would succeed ✅");
  } catch (e) {
    console.error("preflight FAILED:", e.shortMessage || e.message);
    process.exit(1);
  }

  const feeData = await provider.getFeeData();
  const tx = await wallet.sendTransaction({
    to: USDC,
    data: revokeData,
    gasLimit: 120000,
    maxFeePerGas: feeData.maxFeePerGas || 2000000000n,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || 1000000n,
    chainId: 8453,
  });
  console.log(`⚡ KILL SENT: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`confirmed in block ${receipt.blockNumber} · status ${receipt.status === 1 ? "success ✅" : "REVERTED ❌"}`);
  console.log(`explorer: https://base.blockscout.com/tx/${tx.hash}`);

  // verify: allowance should now read 0
  const ALLOWANCE = "0xdd62ed3e";
  const allowData = ALLOWANCE + pad32(wallet.address) + pad32(SHADY_SPENDER);
  const out = await provider.call({ to: USDC, data: allowData });
  console.log("allowance now:", BigInt(out).toString(), BigInt(out) === 0n ? "(0 — door closed ✅)" : "(still open!)");

  shady.txs.push({ type: "kill", to: USDC, spender: SHADY_SPENDER, label: "THE KILL", hash: tx.hash });
  fs.writeFileSync(path.join(process.cwd(), "data", "staging.json"), JSON.stringify(data, null, 2));
  console.log("staging.json updated with the kill tx");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
