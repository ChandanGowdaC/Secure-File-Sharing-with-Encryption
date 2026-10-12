import os
from PIL import Image, ImageDraw

SCREENSHOT_DIR = os.path.abspath(r"user_manual\screenshots")
ANNOTATED_DIR = os.path.abspath(r"user_manual\annotated")
os.makedirs(ANNOTATED_DIR, exist_ok=True)

RED = (220, 38, 38, 255) # #dc2626
RED_FILL = (220, 38, 38, 25) # Subtle transparent highlight

def draw_boxes(image_name, boxes, out_name=None):
    """
    boxes is a list of tuples: (x1, y1, x2, y2)
    or dict: {'box': (x1, y1, x2, y2), 'label': str}
    """
    src_path = os.path.join(SCREENSHOT_DIR, image_name)
    if not os.path.exists(src_path):
        print(f"File not found: {src_path}")
        return
    
    img = Image.open(src_path).convert("RGBA")
    draw = ImageDraw.Draw(img)
    
    for b in boxes:
        coords = b["box"] if isinstance(b, dict) else b
        x1, y1, x2, y2 = coords
        # Draw rounded rectangle with stroke width 4
        draw.rounded_rectangle([x1, y1, x2, y2], radius=8, outline=RED, width=5)
    
    out_file = out_name or image_name
    out_path = os.path.join(ANNOTATED_DIR, out_file)
    img.convert("RGB").save(out_path, "PNG", quality=95)
    print(f"Annotated and saved: {out_path}")

def annotate_all():
    # 01 Landing page: Hero CTA buttons (Login & Register) + Top Nav
    draw_boxes("01_landing_page.png", [
        (760, 520, 1160, 580), # Hero CTA buttons (Login / Register)
        (1600, 30, 1860, 85),  # Top navigation buttons
    ])

    # 02 Register empty: The whole create account form & zero-knowledge subtitle
    draw_boxes("02_register_empty.png", [
        (560, 200, 1360, 320), # Header and zero-knowledge identity description
        (580, 770, 1340, 845), # Create Account & Keys submit button
    ])

    # 03 Register filled: Password strength meter & credentials
    draw_boxes("03_register_filled.png", [
        (580, 340, 1340, 510), # Username & Email fields
        (580, 680, 1340, 755), # Password Strength Meter bar (Strong indicator)
        (580, 890, 1340, 965), # Create Account button
    ])

    # 04 Login filled: Username/email + Password + Forgot Password link
    draw_boxes("04_login_filled.png", [
        (580, 340, 1340, 570), # Username and Password fields
        (1160, 580, 1340, 620), # "Forgot Password?" link
        (580, 640, 1340, 715), # "Sign In" button
    ])

    # 05 MFA screen: 6-digit OTP box + Resend Code countdown + Paste button
    draw_boxes("05_mfa_screen.png", [
        (680, 360, 1240, 460), # 6-Digit Verification Code box
        (680, 480, 990, 545),  # "Resend Code (30s)" button with cooldown
        (1005, 480, 1240, 545), # "Paste from Clipboard" button
    ])

    # 06 MFA filled: OTP filled + Verify Code & Sign In button
    draw_boxes("06_mfa_filled.png", [
        (680, 360, 1240, 460), # Filled code box
        (580, 600, 1340, 675), # "Verify Code & Sign In" button
    ])

    # 07 Upload page: Recipient username field + File Dropzone + Encrypt button
    draw_boxes("07_upload_page.png", [
        (580, 340, 1340, 435), # Recipient Username input
        (580, 470, 1340, 700), # File Dropzone (select file to encrypt)
        (580, 730, 1340, 805), # "Encrypt & Send File" button
    ])

    # 08 Inbox page: Decrypt & Download action / table
    draw_boxes("08_inbox_page.png", [
        (220, 260, 1700, 750), # Incoming encrypted transfers table
    ])

    # 09 Forgot password: Email field + Send Reset Link button
    draw_boxes("09_forgot_password.png", [
        (580, 340, 1340, 435), # Email input
        (580, 460, 1340, 535), # "Send Password Reset Link" button
    ])

    # 10 Change password: Password inputs + Update Password button
    draw_boxes("10_change_password.png", [
        (580, 340, 1340, 730), # Current & New password fields + strength meter
        (580, 760, 1340, 835), # "Update Password" button
    ])

    # 11 Admin users: Registered Users tab + Table of Users + Export Report
    draw_boxes("11_admin_users.png", [
        (350, 240, 660, 305),  # "Registered Users" tab active
        (180, 330, 1740, 780),  # Registered users directory table (with last login)
    ])

    # 12 Admin activities: System Activity Logs tab + Forensic table + PDF button
    draw_boxes("12_admin_activities.png", [
        (675, 240, 970, 305),  # "System Activity Logs" tab active
        (180, 330, 1740, 780),  # Activity log table (Action, Details with proper units)
        (1580, 410, 1700, 465), # "PDF" Report export button
    ])

    # 13 Admin transfers: File Audit Logs tab + Table
    draw_boxes("13_admin_transfers.png", [
        (985, 240, 1260, 305), # "File Audit Logs" tab active
        (180, 330, 1740, 780),  # Transfers audit logs table
    ])

if __name__ == "__main__":
    annotate_all()
