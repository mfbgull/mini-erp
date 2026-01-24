const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  const page = await context.newPage();
  
  await page.goto('http://localhost:5173/inventory/items');
  await page.waitForLoadState('networkidle');
  
  console.log('URL:', page.url());
  
  if (page.url().includes('/login')) {
    await page.fill('input[type="text"], input[name="username"], input[name="email"]', 'admin');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.goto('http://localhost:5173/inventory/items');
    await page.waitForLoadState('networkidle');
  }
  
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: 'screenshot-1-items-list.png', fullPage: true });
  
  const itemsPage = page.locator('.items-page').first();
  const pageBox = await itemsPage.boundingBox();
  console.log('.items-page bounding box:', pageBox);
  
  const card = page.locator('.item-card').first();
  const cardBox = await card.boundingBox();
  console.log('.item-card bounding box:', cardBox);
  
  const viewportBox = { width: 375, height: 812 };
  console.log('\n=== WIDTH ANALYSIS ===');
  console.log(`Viewport width: ${viewportBox.width}px`);
  console.log(`.items-page width: ${pageBox?.width}px`);
  console.log(`.item-card width: ${cardBox?.width}px`);
  
  if (pageBox && cardBox) {
    const cardPercentOfPage = (cardBox.width / pageBox.width * 100).toFixed(1);
    const cardPercentOfViewport = (cardBox.width / viewportBox.width * 100).toFixed(1);
    console.log(`Card width as % of .items-page: ${cardPercentOfPage}%`);
    console.log(`Card width as % of viewport: ${cardPercentOfViewport}%`);
  }
  
  const newItemBtn = page.locator('.mobile-action-bar button').first();
  const isNewItemBtnVisible = await newItemBtn.isVisible().catch(() => false);
  console.log(`\n"+ New Item" button visible before click: ${isNewItemBtnVisible}`);
  
  if (cardBox) {
    await card.click();
    await page.waitForTimeout(1000);
    console.log('\nClicked first card to open modal');
  }
  
  const modalVisible = await page.locator('.modal-overlay').first().isVisible().catch(() => false);
  console.log(`Modal overlay visible: ${modalVisible}`);
  
  const isNewItemBtnVisibleAfter = await newItemBtn.isVisible().catch(() => false);
  console.log(`"+ New Item" button visible after modal open: ${isNewItemBtnVisibleAfter}`);
  
  await page.screenshot({ path: 'screenshot-2-modal-open.png', fullPage: true });
  
  console.log('\n=== VERIFICATION REPORT ===');
  if (cardBox && pageBox) {
    const isFullWidth = cardBox.width >= pageBox.width * 0.95;
    console.log(`1. Card full width: ${isFullWidth ? 'PASS' : 'FAIL'} - Card is ${cardBox.width}px on ${pageBox.width}px container (${(cardBox.width/pageBox.width*100).toFixed(1)}%)`);
  } else {
    console.log(`1. Card full width: UNKNOWN - Could not measure elements`);
  }
  console.log(`2. FAB hidden on modal: ${modalVisible && !isNewItemBtnVisibleAfter ? 'PASS - FAB is hidden when modal opens' : 'FAIL - FAB is visible or modal not detected'}`);
  console.log('==========================\n');
  
  await browser.close();
})();
