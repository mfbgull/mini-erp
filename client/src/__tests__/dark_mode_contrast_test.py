"""
Dark Mode Contrast Test — Playwright
Verifies buttons and labels have proper visible colors in dark mode.
Handles auto-login (user may already be authenticated).
"""
import sys, json
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3010"

def rgb_str_to_tuple(s):
    s = s.strip()
    if s.startswith('rgba'):
        s = s[5:-1]
    elif s.startswith('rgb'):
        s = s[4:-1]
    parts = [int(x.strip()) for x in s.split(',')[:3]]
    return tuple(parts)

def luminance(r, g, b):
    def ch(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)

def contrast_ratio(c1, c2):
    l1 = luminance(*c1)
    l2 = luminance(*c2)
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

def check_element(page, selector, description, min_ratio=3.0):
    try:
        el = page.locator(selector).first
        if not el.is_visible(timeout=2000):
            return {"selector": selector, "desc": description, "status": "SKIP", "reason": "Not visible"}
        
        bg = el.evaluate("el => getComputedStyle(el).backgroundColor")
        color = el.evaluate("el => getComputedStyle(el).color")
        
        bg_rgb = rgb_str_to_tuple(bg)
        text_rgb = rgb_str_to_tuple(color)
        ratio = contrast_ratio(bg_rgb, text_rgb)
        
        issues = []
        if ratio < min_ratio:
            issues.append(f"Low contrast: ratio={ratio:.2f} (min={min_ratio})")
        if bg_rgb == text_rgb:
            issues.append(f"INVISIBLE TEXT: bg=color={bg}")
        if ratio < 1.5:
            issues.append("CRITICAL: Nearly invisible text")
        
        return {
            "selector": selector,
            "desc": description,
            "status": "PASS" if not issues else "FAIL",
            "bg": bg,
            "color": color,
            "ratio": round(ratio, 2),
            "issues": issues
        }
    except Exception as e:
        return {"selector": selector, "desc": description, "status": "ERROR", "error": str(e)}

def run_tests():
    results = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()
        
        # --- Go to app (auto-login if authenticated via cookie/localStorage) ---
        print("Loading app...")
        page.goto(f"{BASE}/", wait_until="networkidle")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(3000)
        
        current_url = page.url
        print(f"  Current URL: {current_url}")
        
        # If we're on login page, try to log in
        if 'login' in current_url.lower():
            print("  On login page — filling credentials...")
            page.fill('#username', 'admin')
            page.fill('#password', 'admin123')
            page.click('button.login-button')
            page.wait_for_timeout(5000)
            page.wait_for_load_state("networkidle")
            current_url = page.url
            print(f"  After login URL: {current_url}")
        
        # --- Enable dark mode ---
        print("Enabling dark mode...")
        # First try via localStorage (fastest, most reliable)
        page.evaluate("localStorage.setItem('miniERP-darkMode', 'true')")
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(3000)
        
        # Verify dark mode
        has_dark = page.evaluate("document.documentElement.classList.contains('dark')")
        print(f"  Dark mode active (html.dark): {has_dark}")
        results.append({
            "test": "dark_mode_active",
            "desc": "Dark mode class on <html>",
            "status": "PASS" if has_dark else "FAIL",
            "detail": f"html.dark={has_dark}"
        })
        
        # Take base screenshot
        page.screenshot(path="/tmp/dark_mode_base.png", full_page=True)
        
        # --- Helper to check a page ---
        def check_page(page_name, route, selectors):
            print(f"\n--- {page_name} ---")
            page.goto(f"{BASE}{route}", wait_until="networkidle")
            page.wait_for_timeout(3000)
            page.screenshot(path=f"/tmp/dark_mode_{page_name.lower().replace(' ','_')}.png", full_page=True)
            
            for sel, desc in selectors:
                results.append(check_element(page, sel, f"{page_name} {desc}"))
        
        # --- Dashboard ---
        check_page("Dashboard", "/dashboard", [
            (".stat-label", "stat-label"),
            (".stat-value", "stat-value"),
            (".kpi-label", "kpi-label"),
            (".kpi-value", "kpi-value"),
            (".summary-label", "summary-label"),
            (".summary-value", "summary-value"),
            (".btn-primary", ".btn-primary"),
            (".btn-secondary", ".btn-secondary"),
            ("label", "<label>"),
        ])
        
        # --- Sales ---
        check_page("Sales", "/sales", [
            (".btn-primary", ".btn-primary"),
            (".btn-secondary", ".btn-secondary"),
            ("label", "<label>"),
            (".preview-stat-label", ".preview-stat-label"),
            (".preview-stat-value", ".preview-stat-value"),
            (".status-label", ".status-label"),
            (".amount-label", ".amount-label"),
            (".detail-label", ".detail-label"),
        ])
        
        # --- Inventory ---
        check_page("Inventory", "/inventory", [
            (".btn-primary", ".btn-primary"),
            (".btn-secondary", ".btn-secondary"),
            ("label", "<label>"),
            (".stat-label", ".stat-label"),
            (".stat-value", ".stat-value"),
            (".form-label", ".form-label"),
        ])
        
        # --- Customers ---
        check_page("Customers", "/customers", [
            (".btn-primary", ".btn-primary"),
            (".btn-secondary", ".btn-secondary"),
            ("label", "<label>"),
            (".stat-label", ".stat-label"),
            (".stat-value", ".stat-value"),
            (".detail-label", ".detail-label"),
        ])
        
        # --- Login page (for label checks) ---
        check_page("Login", "/login", [
            ("label", "<label>"),
            (".login-button", ".login-button"),
        ])
        
        browser.close()
    
    # --- Analyze Results ---
    print("\n" + "="*80)
    print("DARK MODE CONTRAST TEST RESULTS")
    print("="*80)
    
    passes = sum(1 for r in results if r["status"] == "PASS")
    fails = sum(1 for r in results if r["status"] == "FAIL")
    errors = sum(1 for r in results if r["status"] == "ERROR")
    skips = sum(1 for r in results if r["status"] == "SKIP")
    
    print(f"\nTotal: {len(results)} | PASS: {passes} | FAIL: {fails} | ERROR: {errors} | SKIP: {skips}")
    
    if fails > 0:
        print("\n--- FAILURES ---")
        for r in results:
            if r["status"] == "FAIL":
                print(f"  ❌ {r['desc']} ({r['selector']})")
                print(f"     bg={r.get('bg','?')}  text={r.get('color','?')}  ratio={r.get('ratio','?')}")
                for issue in r.get("issues", []):
                    print(f"     ⚠ {issue}")
    
    if errors > 0:
        print("\n--- ERRORS ---")
        for r in results:
            if r["status"] == "ERROR":
                print(f"  ❌ {r['desc']} ({r['selector']}): {r.get('error','?')}")
    
    print("\nScreenshots saved to /tmp/dark_mode_*.png")
    
    # Save JSON results
    summary = {
        "total": len(results),
        "pass": passes,
        "fail": fails,
        "error": errors,
        "skip": skips,
        "failures": [r for r in results if r["status"] == "FAIL"],
    }
    with open("/tmp/dark_mode_test_results.json", "w") as f:
        json.dump(summary, f, indent=2)
    
    sys.exit(0 if fails == 0 else 1)

if __name__ == "__main__":
    run_tests()
