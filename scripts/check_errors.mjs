import puppeteer from "puppeteer";

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();

  const consoleMessages = [];
  const errors = [];

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
    await page.goto("http://localhost:5174", { waitUntil: "networkidle0", timeout: 15000 });
    await page.waitForTimeout(3000);
  } catch (e) {
    errors.push(`Navigation error: ${e.message}`);
  }

  console.log("\n=== CONSOLE MESSAGES ===");
  consoleMessages.forEach((m) => console.log(m));

  console.log("\n=== ERRORS ===");
  errors.forEach((e) => console.log(e));

  if (errors.length === 0 && consoleMessages.length === 0) {
    console.log("\nNo errors or console messages detected.");
  }

  await browser.close();
})();
