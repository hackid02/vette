// Verify the mandate-page result states render honestly: incomplete, full breaches,
// clean, and partial (lower-bound) states.
import { chromium } from "playwright";

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });

  const fillAndVerify = async () => {
    await page.goto("http://localhost:3000/mandate", { waitUntil: "networkidle" });
    await page.locator('input[placeholder="ETH, USDC, BTC"]').fill("ETH, BTC");
    await page.locator('input[placeholder^="0x…"]').fill("0x61e17391f084ad083FA5C199D4F0d350A4CF4282");
    await page.getByRole("button", { name: /VERIFY THE MANDATE/i }).click();
  };

  const outcome = async () => {
    const body = await page.locator("body").innerText();
    return {
      amberPure: await page.locator("text=breach scan could not complete").count(),
      partialBanner: await page.locator("text=Partial scan — the explorer").count(),
      greenPromise: await page.locator("text=✓ No breaches found").count(),
      breachList: await page.locator("text=every one carries evidence").count(),
      bigCount: (await page.locator("span.mono.text-6xl").count())
        ? (await page.locator("span.mono.text-6xl").first().textContent()).trim()
        : null,
    };
  };

  // ---- TEST A: real API (explorer currently unhealthy → incomplete or partial) ----
  await fillAndVerify();
  await page.waitForSelector("text=mandate ruling", { timeout: 180000 });
  await page.waitForFunction(() => {
    const t = document.body.innerText;
    return t.includes("breach scan could not complete") || t.includes("Partial scan") ||
           t.includes("every one carries evidence") || t.includes("kept the promise");
  }, { timeout: 200000 });
  const A = await outcome();
  console.log("TEST A (real API):", JSON.stringify(A));
  await page.screenshot({ path: "/tmp/state-a-real.png" });

  // ---- TEST B: mocked full data → 17 breaches ----
  await page.route("**/api/audit", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({
    address: "0x61e17391f084ad083FA5C199D4F0d350A4CF4282",
    verdict: "DANGEROUS", score: 2, breachCount: 17, breachLowerBound: false, deviationCheckIncomplete: false,
    scopeLabel: "recent ~160000 blocks + live allowance probes",
    findings: [
      { level: "danger", title: "Traded outside its own whitelist (17 transfer(s))", detail: "moved USDC.", evidence: { type: "tx", value: "0xabc", label: "transfer tx" } },
      { level: "danger", title: "Open unverified spender", detail: "USDC allowance to an unverified contract.", evidence: { type: "wallet", value: "0x61e1", label: "spender" } },
    ],
  }) }));
  await fillAndVerify();
  await page.waitForSelector("text=every one carries evidence", { timeout: 30000 });
  const B = await outcome();
  console.log("TEST B (full 17):", JSON.stringify(B));

  // ---- TEST C: mocked clean wallet ----
  await page.unroute("**/api/audit");
  await page.route("**/api/audit", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({
    address: "0x61e17391f084ad083FA5C199D4F0d350A4CF4282",
    verdict: "COMPLIANT", score: 100, breachCount: 0, breachLowerBound: false, deviationCheckIncomplete: false,
    scopeLabel: "recent ~160000 blocks + live allowance probes", findings: [],
  }) }));
  await fillAndVerify();
  await page.waitForSelector("text=✓ No breaches found", { timeout: 30000 });
  const C = await outcome();
  console.log("TEST C (clean):", JSON.stringify(C));

  // ---- TEST D: mocked partial scan → lower bound ----
  await page.unroute("**/api/audit");
  await page.route("**/api/audit", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({
    address: "0x61e17391f084ad083FA5C199D4F0d350A4CF4282",
    verdict: "DANGEROUS", score: 2, breachCount: 7, breachLowerBound: true, deviationCheckIncomplete: true,
    scopeLabel: "recent ~160000 blocks + live allowance probes",
    findings: [
      { level: "danger", title: "Traded outside its own whitelist (7 transfer(s))", detail: "moved USDC.", evidence: { type: "tx", value: "0xabc", label: "transfer tx" } },
      { level: "warning", kind: "deviation-incomplete", title: "Mandate deviation check could not complete — token transfer history partially unreachable", detail: "partial RPC scan." },
    ],
  }) }));
  await fillAndVerify();
  await page.waitForSelector("text=Partial scan — the explorer", { timeout: 30000 });
  const D = await outcome();
  console.log("TEST D (partial ≥):", JSON.stringify(D));
  await page.screenshot({ path: "/tmp/state-d-partial.png" });

  await browser.close();
};

run().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
