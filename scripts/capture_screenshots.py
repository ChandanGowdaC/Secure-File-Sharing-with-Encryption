import os
import time
from playwright.sync_api import sync_playwright

BASE_URL = "https://secure-file-sharing-with-encryption-tau.vercel.app"
CHROME_PATH = os.path.expandvars(r"%LOCALAPPDATA%\ms-playwright\chromium-1243\chrome-win64\chrome.exe")
OUT_DIR = os.path.abspath(r"user_manual\screenshots")
os.makedirs(OUT_DIR, exist_ok=True)

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME_PATH, headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 840}, device_scale_factor=1.5)
        page = context.new_page()

        print("1. Capturing Landing Page...")
        page.goto(BASE_URL, wait_until="networkidle")
        time.sleep(1)
        page.screenshot(path=os.path.join(OUT_DIR, "01_landing_page.png"))

        print("2. Capturing Register Page...")
        page.goto(f"{BASE_URL}/register", wait_until="networkidle")
        time.sleep(1)
        page.screenshot(path=os.path.join(OUT_DIR, "02_register_empty.png"))

        # Fill registration with password strength meter
        print("Filling registration form...")
        page.fill("input[placeholder='e.g. alice']", "withprabhav")
        page.fill("input[placeholder='alice@example.com']", "withprabhav@gmail.com")
        page.fill("input[placeholder='At least 8 characters']", "SecurePass@2026")
        page.fill("input[placeholder='Re-enter your password']", "SecurePass@2026")
        time.sleep(1)
        page.screenshot(path=os.path.join(OUT_DIR, "03_register_filled.png"))

        print("3. Capturing Login Page...")
        page.goto(f"{BASE_URL}/login", wait_until="networkidle")
        time.sleep(1)
        page.fill("input[placeholder='Username or email']", "withprabhav@gmail.com")
        page.fill("input[placeholder='Password']", "SecurePass@2026")
        page.screenshot(path=os.path.join(OUT_DIR, "04_login_filled.png"))

        print("4. Capturing 2FA Screen...")
        # Login using admin to guarantee 2FA challenge trigger
        page.fill("input[placeholder='Username or email']", "admin")
        page.fill("input[placeholder='Password']", "admin123456")
        page.click("button:has-text('Sign In')")
        try:
            page.wait_for_selector("input.otp-input", timeout=15000)
            time.sleep(1)
            # Capture 2FA screen showing 6-digit input, Resend Code with countdown, Paste button
            page.screenshot(path=os.path.join(OUT_DIR, "05_mfa_screen.png"))

            # Fill OTP 000000
            page.fill("input.otp-input", "000000")
            time.sleep(0.5)
            page.screenshot(path=os.path.join(OUT_DIR, "06_mfa_filled.png"))

            # Verify and sign in
            page.click("button:has-text('Verify Code & Sign In')")
            time.sleep(2)
        except Exception as e:
            print("MFA wait exception:", e)

        print("5. Capturing Upload Page...")
        page.goto(f"{BASE_URL}/upload", wait_until="networkidle")
        time.sleep(1)
        try:
            page.fill("#receiverUsername", "chandangowda")
        except Exception:
            pass
        page.screenshot(path=os.path.join(OUT_DIR, "07_upload_page.png"))

        print("6. Capturing Inbox Page...")
        page.goto(f"{BASE_URL}/inbox", wait_until="networkidle")
        time.sleep(1)
        page.screenshot(path=os.path.join(OUT_DIR, "08_inbox_page.png"))

        print("7. Capturing Forgot Password & Change Password Pages...")
        page.goto(f"{BASE_URL}/forgot-password", wait_until="networkidle")
        time.sleep(0.5)
        page.fill("input[type='email']", "withprabhav@gmail.com")
        page.screenshot(path=os.path.join(OUT_DIR, "09_forgot_password.png"))

        page.goto(f"{BASE_URL}/change-password", wait_until="networkidle")
        time.sleep(0.5)
        try:
            page.fill("input[placeholder='Current password']", "SecurePass@2026")
            page.fill("input[placeholder='New password (min 8 chars)']", "NewSecretPass2026@")
            page.fill("input[placeholder='Confirm new password']", "NewSecretPass2026@")
        except Exception:
            pass
        page.screenshot(path=os.path.join(OUT_DIR, "10_change_password.png"))

        print("8. Capturing Admin Dashboard Pages...")
        page.goto(f"{BASE_URL}/admin", wait_until="networkidle")
        time.sleep(2)
        # Tab 1: Users
        page.screenshot(path=os.path.join(OUT_DIR, "11_admin_users.png"))

        # Tab 2: Activity logs
        act_btn = page.locator("button:has-text('System Activity Logs')")
        if act_btn.is_visible():
            act_btn.click()
            time.sleep(1)
        page.screenshot(path=os.path.join(OUT_DIR, "12_admin_activities.png"))

        # Tab 3: Transfers
        trans_btn = page.locator("button:has-text('File Audit Logs')")
        if trans_btn.is_visible():
            trans_btn.click()
            time.sleep(1)
        page.screenshot(path=os.path.join(OUT_DIR, "13_admin_transfers.png"))

        browser.close()
        print("All screenshots successfully captured!")

if __name__ == "__main__":
    run()
