import { chromium } from 'playwright';

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
page.on('console', (msg) => {
	if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
});
await page.goto('http://localhost:5173');
await page.waitForSelector('text=Row and Column Operations Calculator');

// Select row 1 via its handle, submit default scale (1) won't do anything since disabled at 1x... use scale 2
const rowHandle = page.locator('[data-row-handle="0"]');
await rowHandle.click();
await page.waitForSelector('text=Submit');
const input = page.locator('input[type="text"]');
await input.fill('2');
await page.click('button:has-text("Submit")');
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/claude-1000/-workspaces-matrix-vibes/aafd3a79-adfe-43b5-9c77-c6143120bb6c/scratchpad/after-scale.png' });

// Now do a row swap via drag and drop: row 0 handle onto row 2 handle
const src = page.locator('[data-row-handle="1"]');
const dst = page.locator('[data-row-handle="2"]');
const srcBox = await src.boundingBox();
const dstBox = await dst.boundingBox();
await page.mouse.move(srcBox.x + srcBox.width / 2, srcBox.y + srcBox.height / 2);
await page.mouse.down();
await page.mouse.move(dstBox.x + dstBox.width / 2, dstBox.y + dstBox.height / 2, { steps: 10 });
await page.mouse.up();
await page.waitForTimeout(300);
// choose swap mode
const swapRadio = page.locator('input[value="swap"]');
if (await swapRadio.count()) {
	await swapRadio.click();
}
await page.click('button:has-text("Submit")');
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/claude-1000/-workspaces-matrix-vibes/aafd3a79-adfe-43b5-9c77-c6143120bb6c/scratchpad/after-swap.png', fullPage: true });

await browser.close();
console.log('DONE');
