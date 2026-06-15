from playwright.sync_api import sync_playwright
import sys

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto('http://localhost:3010/reports/accounts-receivable')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)
    
    # Screenshot
    page.screenshot(path='/tmp/ar_report.png', full_page=True)
    
    # Get page title
    title = page.title()
    print(f"Page title: {title}")
    print(f"URL: {page.url}")
    print()
    
    # Get all text content (first 3000 chars)
    text = page.inner_text('body')
    print("=== BODY TEXT ===")
    print(text[:3000])
    
    # Check for common elements
    print("\n=== KEY ELEMENTS ===")
    headers = page.locator('h1, h2, h3, h4, h5, h6').all()
    print(f"Headers ({len(headers)}):")
    for h in headers:
        print(f"  {h.tag_name}: {h.inner_text()}")
    
    tables = page.locator('table, .ag-root, div[role="grid"]').all()
    print(f"\nTables/Grids found: {len(tables)}")
    
    buttons = page.locator('button, a[role="button"], .btn, [class*="btn"]').all()
    print(f"Buttons: {len(buttons)}")
    for b in buttons:
        print(f"  [{b.tag_name}] text='{b.inner_text()[:60]}' visible={b.is_visible()}")
    
    inputs = page.locator('input, select, textarea').all()
    print(f"\nInputs: {len(inputs)}")
    
    # Check for toast messages or errors
    errors = page.locator('.error, .alert-danger, [role="alert"], .toast-error').all()
    print(f"\nError elements: {len(errors)}")
    for e in errors:
        print(f"  {e.inner_text()[:200]}")
    
    # Console logs
    print("\n=== CONSOLE LOGS ===")
    logs = []
    page.on('console', lambda msg: logs.append(f"[{msg.type}] {msg.text}"))
    page.reload()
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)
    for log in logs:
        print(log)
    
    browser.close()
