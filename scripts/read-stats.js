import { chromium } from 'playwright';

(async ()=>{
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/analytics', { waitUntil: 'networkidle' });
  const nums = await page.$$eval('.text-3xl', els => els.map(e => e.innerText));
  console.log('stat numbers:', nums);
  const likedCount = await page.$$eval('.text-green-400', els => els.map(e => e.innerText));
  console.log('likedCount (green):', likedCount);
  await browser.close();
})();