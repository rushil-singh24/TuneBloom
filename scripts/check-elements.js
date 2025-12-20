import { chromium } from 'playwright';

(async ()=>{
  const url = process.argv[2] || 'http://localhost:5173/analytics';
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  const bodyText = await page.evaluate(()=>document.body.innerText);
  console.log('Contains "Your Taste"?', bodyText.includes('Your Taste'));
  console.log('Contains "Your Sound Profile"?', bodyText.includes('Your Sound Profile'));
  const svgCount = await page.evaluate(()=>document.querySelectorAll('svg').length);
  console.log('SVG elements on page:', svgCount);
  await page.screenshot({path:'ui-screenshot-2.png', fullPage:true});
  await browser.close();
})();