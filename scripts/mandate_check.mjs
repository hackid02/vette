// One-off check: does the mandate page show the big breach count after VERIFY?
import { chromium } from "playwright";

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto("http://localhost:3000/mandate", { waitUntil: "networkidle" });

  // fill "only trades" + wallet, like DEMO_SCRIPT ACT IV
  await page.locator('input[placeholder="ETH, USDC, BTC"]').fill("ETH, BTC");
  await page.locator('input[placeholder^="0x…"]').fill("0x61e17391f084ad083FA5C199D4F0d350A4CF4282");
  await page.getByRole("button", { name: /VERIFY THE MANDATE/i }).click();

  // wait for the ruling to render (scan takes ~30-45s)
  await page.waitForSelector("text=breaches — every one carries evidence", { timeout: 90000 });
  await page.waitForTimeout(1500);

  // find the big count element right before the overline
  const count = await page.locator("span.mono.text-6xl").first().textContent();
  console.log("BIG COUNT ON PAGE:", count?.trim());

  await page.screenshot({ path: "/tmp/mandate17.png", fullPage: false });
  // also grab the ruling area only
  const box = await page.locator("text=breaches — every one carries evidence").boundingBox();
  if (box) {
    await page.screenshot({ path: "/tmp/mandate17-close.png", clip: { x: Math.max(0, box.x - 60), y: Math.max(0, box.y - 160), width: 700, height: 340 } });
  }
  await browser.close();
};

run().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
