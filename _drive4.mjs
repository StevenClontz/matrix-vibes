import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
page.on('console', m => console.log('CONSOLE', m.type(), m.text()));
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto('http://localhost:5173');
await page.waitForSelector('text=Row and Column Operations Calculator');
await page.evaluate(() => {
  const el = document.querySelector('[data-row-handle="0"]');
  console.log('found el', !!el);
});
await page.locator('[data-row-handle="0"]').click({ force: true });
await page.waitForTimeout(500);
const cls = await page.locator('[data-row-handle="0"]').getAttribute('class');
console.log('class after click', cls);
await browser.close();
