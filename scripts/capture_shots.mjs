// capture_shots.mjs — re-capture thread images img2..img7 from the CURRENT
// product (post-Alibi, post-CoinOp). Real viewport screenshots, site's own
// visual language. Overwrites brand/thread/img*.png.
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUT = path.join(process.cwd(), "brand", "thread");
const BASE = "http://localhost:3000";

async function shot(page, locator, name) {
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(450);
  const buf = await page.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 675 } });
  fs.writeFileSync(path.join(OUT, name), buf);
  console.log("✓ captured", name);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 900 },
    deviceScaleFactor: 2,
  });

  // img2 — the engine/receipt band ("It doesn't vibe-check. It checks.")
  console.log("▶ img2: engine/receipt band…");
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await shot(page, page.locator('h2', { hasText: "It doesn't vibe-check" }), "img2-trust.png");

  // img3 — the moves section (AUDIT · THE ALIBI · KILL)
  console.log("▶ img3: the moves…");
  await shot(page, page.getByText("the moves", { exact: true }).first(), "img3-tools.png");

  // img4 — the refusal: BaseScout site-only audit → open UNVERIFIABLE paper
  console.log("▶ img4: the refusal…");
  await page.goto(BASE + "/audit?url=" + encodeURIComponent("https://base-scout-seven.vercel.app/"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: /VET THIS/ }).click();
  await page.locator(".paper").first().waitFor({ timeout: 90000 });
  await shot(page, page.locator(".paper").first(), "img4-unverifiable.png");

  // img5 — the drill entry in the ledger (kill tx visible)
  console.log("▶ img5: drill entry…");
  await page.goto(BASE + "/feed", { waitUntil: "domcontentloaded" });
  const drill = page.getByText("Live-fire drill").first();
  try {
    await drill.waitFor({ timeout: 20000 });
    await shot(page, drill, "img5-drill.png");
  } catch {
    console.log("   drill anchor not found — falling back to kill tx link");
    await shot(page, page.getByText("0x03f63de2").first(), "img5-drill.png");
  }

  // img6 — SHADY after the kill: COMPLIANT 100 with the closed door
  console.log("▶ img6: SHADY post-kill…");
  await page.goto(BASE + "/audit?address=0xe07f3B4088926bF2B3F74ca2D5D762680BFBBeb4", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: /VET THIS/ }).click();
  await page.locator(".paper").first().waitFor({ timeout: 120000 });
  await shot(page, page.locator(".paper").first(), "img6-kill.png");

  // img7 — the ledger timeline (fresh entries, machine-written)
  console.log("▶ img7: ledger timeline…");
  await page.goto(BASE + "/feed", { waitUntil: "domcontentloaded" });
  await page.locator("main ol > li").first().waitFor({ timeout: 30000 });
  await shot(page, page.locator("main ol > li").first(), "img7-ledger.png");

  await browser.close();
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
