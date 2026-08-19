// One-off: re-arm the UNLIMITED burner's open door for the camera take.
// approve(MAX, USDC, SwapRouter02) — same shot as the original drill.
import { ethers } from "ethers";
import fs from "fs";

const RPC = "https://mainnet.base.org";
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const ROUTER = "0x2626664c2603336E57B271c5C0b26F421741e481"; // SwapRouter02 (verified)
const MAX = (1n << 256n) - 1n;

const staging = JSON.parse(fs.readFileSync("data/staging.json", "utf8"));
const burner = staging.burners.find(b => b.address.toLowerCase() === "0xd5ea62cfe596fbdb19d604fd183258c8c500e5d1");
if (!burner || !burner.privateKey) { console.error("UNLIMITED burner key not found"); process.exit(1); }

const pad32 = (h) => h.slice(2).toLowerCase().padStart(64, "0");
const data = "0x095ea7b3" + pad32(ROUTER) + MAX.toString(16).padStart(64, "0");

const provider = new ethers.JsonRpcProvider(RPC);
const wallet = new ethers.Wallet(burner.privateKey, provider);

const bal = await provider.getBalance(burner.address);
console.log("burner ETH balance:", ethers.formatEther(bal));

const feeData = await provider.getFeeData();
const tx = await wallet.sendTransaction({
  to: USDC, data, gasLimit: 120000,
  maxFeePerGas: feeData.maxFeePerGas || 2000000000n,
  maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || 1000000n,
  chainId: 8453,
});
console.log("approve sent:", tx.hash);
const rc = await tx.wait();
console.log("confirmed in block", rc.blockNumber, "| status", rc.status === 1 ? "success" : "REVERTED");
