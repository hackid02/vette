// stage_burners.mjs — creates three fresh burner wallets for the live-fire drill.
// Prints each address + how much ETH to send. Keys are saved ONLY to
// data/staging.json (gitignored — never committed).
//
// The drill: we stage real approvals, Vette catches them, then we kill them
// on camera. Every transaction is real Base mainnet activity by our own
// wallets. Nothing is faked — it's a fire drill, and the fire is real.
import { ethers } from "ethers";
import fs from "fs";
import path from "path";

const OUT = path.join(process.cwd(), "data", "staging.json");

const ROLES = [
  {
    name: "unlimited",
    note: "approves max-uint USDC to the Uniswap router (a WARNING: unlimited allowance to a verified contract)",
  },
  {
    name: "shady",
    note: "approves 1,000 USDC to an UNVERIFIED contract (a DANGER: the door Vette was built to catch)",
  },
  {
    name: "clean",
    note: "approves, then immediately closes it (a COMPLIANT: healthy hygiene)",
  },
];

function load() {
  try {
    return JSON.parse(fs.readFileSync(OUT, "utf8"));
  } catch {
    return { burners: [] };
  }
}

const data = load();

for (const role of ROLES) {
  if (data.burners.some((b) => b.role === role.name)) continue; // don't regen existing
  const w = ethers.Wallet.createRandom();
  data.burners.push({
    role: role.name,
    address: w.address,
    privateKey: w.privateKey,
    note: role.note,
    funded: false,
    txs: [],
  });
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(data, null, 2));

console.log("=== VETTE LIVE-FIRE DRILL — FUNDING STEP ===\n");
console.log("Send 0.0001 ETH (~$0.19) on BASE to each address below.\n");
for (const b of data.burners) {
  console.log(`${b.role.toUpperCase().padEnd(10)} ${b.address}`);
  console.log(`   ${b.note}\n`);
}
console.log(`Keys saved to ${OUT} (gitignored — never committed).`);
console.log("\nAfter funding, run: node scripts/stage_approvals.mjs");
