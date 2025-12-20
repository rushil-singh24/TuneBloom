import { chromium } from 'playwright';

(async ()=>{
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/analytics', { waitUntil: 'networkidle' });
  const texts = ['Your Taste', 'Your Sound Profile', 'Your Sound Profile', 'Your Sound Profile', 'Top Genres', 'Your Music DNA', 'Like some tracks to see your taste analytics!'];
  for (const t of texts) {
    const count = await page.locator(`text=${t}`).count();
    console.log(`'${t}':`, count);
  }
  await browser.close();
})();