// capture_shots.mjs — real viewport screenshots for the thread images.
// Opens the actual site, runs the real flows, scrolls to the right spot,
// and captures the viewport exactly as a judge would see it. No collages.
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUT = path.join(process.cwd(), "brand", "thread", "raw2");
fs.mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:3000";

async function viewportShot(page, anchor, name) {
  await anchor.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await anchor.evaluate((el) => el.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(500);
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

  // img2 — demo wallet report (DANGEROUS doors, real findings)
  console.log("▶ img2: demo report viewport…");
  await page.goto(BASE + "/audit?address=0x61e17391f084ad083FA5C199D4F0d350A4CF4282", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: /VET THIS/ }).click();
  await page.locator(".paper").first().waitFor({ timeout: 90000 });
  await viewportShot(page, page.locator(".paper").first(), "img2.png");

  // img3 — mandate builder with a live mandate written
  console.log("▶ img3: mandate builder viewport…");
  await page.goto(BASE + "/mandate", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  await page.locator("input").first().fill("ETH, USDC");
  await page.waitForTimeout(300);
  await viewportShot(page, page.locator("div.panel").filter({ hasText: "step 1 · your rules" }).first(), "img3.png");

  // img4 — the refusal: BaseScout site-only audit
  console.log("▶ img4: the refusal viewport…");
  await page.goto(BASE + "/audit?url=" + encodeURIComponent("https://base-scout-seven.vercel.app/"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: /VET THIS/ }).click();
  await page.locator(".paper").first().waitFor({ timeout: 90000 });
  await viewportShot(page, page.locator(".paper").first(), "img4.png");

  // img5 — the feed: stats + drill entry
  console.log("▶ img5: feed drill viewport…");
  await page.goto(BASE + "/feed", { waitUntil: "domcontentloaded" });
  await page.locator("main ol > li").first().waitFor({ timeout: 30000 });
  await viewportShot(page, page.locator("main ol > li").first(), "img5.png");

  // img6 — SHADY after the kill (COMPLIANT 100)
  console.log("▶ img6: SHADY post-kill viewport…");
  await page.goto(BASE + "/audit?address=0xe07f3B4088926bF2B3F74ca2D5D762680BFBBeb4", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: /VET THIS/ }).click();
  await page.locator(".paper").first().waitFor({ timeout: 90000 });
  await viewportShot(page, page.locator(".paper").first(), "img6.png");

  // img7 — the ledger timeline band
  console.log("▶ img7: ledger timeline viewport…");
  await page.goto(BASE + "/feed", { waitUntil: "domcontentloaded" });
  await page.locator("main ol > li").nth(1).waitFor({ timeout: 30000 });
  await viewportShot(page, page.locator("main ol > li").nth(1), "img7.png");

  await browser.close();
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
