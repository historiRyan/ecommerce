import * as puppeteer from "puppeteer-core";

const chromePath =
  "C:\\Users\\ryant\\.cache\\puppeteer\\chrome\\win64-151.0.7922.71\\chrome-win64\\chrome.exe";

(async (): Promise<void> => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();

  const consoleMessages: string[] = [];
  const errors: string[] = [];

  page.on("console", (msg) => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  page.on("pageerror", (err) => {
    errors.push(err.message);
  });

  page.on("requestfailed", (req) => {
    errors.push(`Request failed: ${req.url()} - ${req.failure()?.errorText}`);
  });

  try {
    await page.goto("http://localhost:5174", {
      waitUntil: "networkidle0",
      timeout: 20000,
    });
    await page
      .waitForFunction(() => document.body.innerText.length > 0, { timeout: 15000 })
      .catch((e) => errors.push(`Wait error: ${(e as Error).message}`));
    await new Promise((r) => setTimeout(r, 3000));
  } catch (e) {
    const err = e as Error;
    errors.push(`Navigation error: ${err.message}`);
  }

  console.log("\n=== CONSOLE MESSAGES ===");
  consoleMessages.forEach((m) => console.log(m));

  console.log("\n=== ERRORS ===");
  errors.forEach((e) => console.log(e));

  if (errors.length === 0 && consoleMessages.length === 0) {
    console.log("\nNo errors or console messages detected.");
  }

  const html = await page.content();
  if (html.includes("TokoRyan") || html.includes("Beranda")) {
    console.log("\nApp content detected in DOM.");
  } else {
    console.log("\nDOM content (first 500 chars):");
    console.log(html.slice(0, 500));
  }

  await browser.close();
})();
