import { chromium } from 'playwright';

(async ()=>{
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  const url = process.argv[2] || 'http://localhost:5176/analytics';
  console.log('Visiting', url);
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    // take screenshot
    await page.screenshot({ path: 'ui-screenshot.png', fullPage: true });
    const html = await page.content();
    console.log('PAGE HTML SNIPPET:', html.slice(0, 800));
  } catch (e) {
    console.log('NAV ERROR:', e.toString());
  }
  await browser.close();
})();