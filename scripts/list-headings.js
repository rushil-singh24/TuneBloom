import { chromium } from 'playwright';

(async ()=>{
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/analytics', { waitUntil: 'networkidle' });
  const hs = await page.$$eval('h1,h2,h3,h4', n => n.map(x => x.innerText));
  console.log('Headings:', hs);
  await browser.close();
})();