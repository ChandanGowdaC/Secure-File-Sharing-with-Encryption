import os
import time
from playwright.sync_api import sync_playwright

BASE_URL = "https://secure-file-sharing-with-encryption-tau.vercel.app"
CHROME_PATH = os.path.expandvars(r"%LOCALAPPDATA%\ms-playwright\chromium-1243\chrome-win64\chrome.exe")
OUT_DIR = os.path.abspath(r"user_manual\screenshots")

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME_PATH, headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 840}, device_scale_factor=1.5)
    page.goto(f"{BASE_URL}/login", wait_until="networkidle")
    page.fill("input[placeholder='Username or email']", "admin")
    page.fill("input[placeholder='Password']", "admin123456")
    page.click("button:has-text('Sign In')")
    page.wait_for_selector("input.otp-input", timeout=10000)
    page.fill("input.otp-input", "000000")
    page.click("button:has-text('Verify Code & Sign In')")
    time.sleep(3)

    page.goto(f"{BASE_URL}/admin", wait_until="networkidle")
    time.sleep(2)
    buttons = [b.strip() for b in page.locator("button").all_text_contents()]
    print("Buttons found on admin page:", buttons)

    # Click each tab by index or matching text:
    # Button 0 is usually Logout or first tab
    for idx, b_text in enumerate(buttons):
        if "User" in b_text:
            page.locator("button").nth(idx).click()
            time.sleep(1.5)
            page.screenshot(path=os.path.join(OUT_DIR, "11_admin_users.png"))
            print("Captured 11_admin_users.png")
        elif "Activity" in b_text:
            page.locator("button").nth(idx).click()
            time.sleep(1.5)
            page.screenshot(path=os.path.join(OUT_DIR, "12_admin_activities.png"))
            print("Captured 12_admin_activities.png")
        elif "File" in b_text or "Transfer" in b_text or "Audit" in b_text:
            page.locator("button").nth(idx).click()
            time.sleep(1.5)
            page.screenshot(path=os.path.join(OUT_DIR, "13_admin_transfers.png"))
            print("Captured 13_admin_transfers.png")

    browser.close()
    print("Done!")
