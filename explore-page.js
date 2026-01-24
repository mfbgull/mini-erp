const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  await page.goto('http://localhost:3010');
  await page.waitForLoadState('networkidle');
  
  const usernameInput = await page.$('input[type="text"]');
  const passwordInput = await page.$('input[type="password"]');
  
  if (usernameInput && passwordInput) {
    await usernameInput.fill('admin');
    await passwordInput.fill('admin123');
    
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
  }
  
  const itemsLink = await page.$('a.nav-sub-item:has-text("Items")');
  if (itemsLink) {
    await itemsLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
  }
  
  const pageContent = await page.evaluate(() => {
    const items = [];
    document.querySelectorAll('*').forEach(el => {
      const text = el.textContent || '';
      const cls = el.className?.toString() || '';
      if ((text.includes('Raw Materials') || text.includes('Finished Goods') || text.includes('Steel') || text.includes('Bolt')) && el.children.length > 0) {
        items.push({
          tag: el.tagName,
          class: cls.substring(0, 80),
          text: text.substring(0, 100),
          children: el.children.length
        });
      }
    });
    return items;
  });
  console.log('Found items content:', JSON.stringify(pageContent, null, 2));
  
  const allElements = await page.evaluate(() => {
    const elements = [];
    const seen = new Set();
    document.querySelectorAll('*').forEach(el => {
      const text = el.textContent?.trim() || '';
      if (text && !seen.has(text) && (text.includes('Raw Material') || text.includes('Finished Good') || text.length > 10)) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 50 && rect.height > 30) {
          seen.add(text);
          elements.push({
            tag: el.tagName,
            text: text.substring(0, 80),
            class: el.className?.toString().substring(0, 60) || 'none'
          });
        }
      }
    });
    return elements.slice(0, 30);
  });
  console.log('All elements:', JSON.stringify(allElements, null, 2));
  
  const rawMaterialsSection = await page.$(':text("Raw Materials")');
  if (rawMaterialsSection) {
    console.log('Found Raw Materials section');
    let parent = rawMaterialsSection;
    for (let i = 0; i < 5; i++) {
      parent = parent.parentElement();
      if (parent) {
        const parentHTML = await parent.innerHTML();
        console.log(`Parent level ${i}:`, parentHTML.substring(0, 300));
      }
    }
  }
  
  await page.screenshot({ path: '/home/fawad/ai/minierp/items-page.png', fullPage: true });
  console.log('Items page screenshot saved');
  
  await browser.close();
})();
