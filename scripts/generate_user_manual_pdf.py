import os
import sys
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    Image,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.pdfgen import canvas

PDF_OUTPUT_PATH = os.path.abspath(r"user_manual\Secure_File_Sharing_User_Manual.pdf")
ANNOTATED_DIR = os.path.abspath(r"user_manual\annotated")

# Color Palette inspired by the IRIS manual
PRIMARY_TEAL = colors.HexColor("#0284c7")       # Cyan/Blue banner & headings
PRIMARY_DARK = colors.HexColor("#0f172a")       # Deep slate for main title
SECONDARY_SLATE = colors.HexColor("#334155")    # Charcoal body text
MUTED_SLATE = colors.HexColor("#64748b")        # Muted text
BORDER_COLOR = colors.HexColor("#cbd5e1")       # Subtle frame border
BG_LIGHT = colors.HexColor("#f8fafc")           # Pastel background
HIGHLIGHT_RED = colors.HexColor("#dc2626")      # Callout red matching annotations

TOTAL_PAGES = 13

class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute and stamp exact total page count and header/footer."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_decorations(self, total_pages):
        self.saveState()
        # 1. Top Ribbon Banner
        self.setFillColor(PRIMARY_TEAL)
        self.rect(0, 11 * 72 - 16, 8.5 * 72, 16, stroke=0, fill=1)

        # 2. Top Header Text
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(PRIMARY_TEAL)
        self.drawString(36, 11 * 72 - 28, "NITK SURATHKAL  •  DEPARTMENT OF INFORMATION TECHNOLOGY")
        self.setFont("Helvetica", 8)
        self.setFillColor(MUTED_SLATE)
        self.drawRightString(8.5 * 72 - 36, 11 * 72 - 28, "IT303 SOFTWARE ENGINEERING PROJECT")

        self.setStrokeColor(BORDER_COLOR)
        self.setLineWidth(0.5)
        self.line(36, 11 * 72 - 32, 8.5 * 72 - 36, 11 * 72 - 32)

        # 3. Bottom Footer
        self.line(36, 34, 8.5 * 72 - 36, 34)
        self.setFont("Helvetica", 8)
        self.setFillColor(MUTED_SLATE)
        self.drawString(36, 22, "Secure File Sharing with Encryption — User Manual")
        self.drawRightString(8.5 * 72 - 36, 22, f"Page {self._pageNumber} of {total_pages}")
        self.restoreState()

def create_user_manual():
    # Printable area: 8.5in x 11in = 612 x 792 pt. Margins 36 pt left/right, 40 pt top/bottom.
    # Printable width: 540 pt, Printable height: 712 pt.
    doc = SimpleDocTemplate(
        PDF_OUTPUT_PATH,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()

    # Custom typography styles
    style_cover_pre = ParagraphStyle(
        "CoverPre",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=PRIMARY_TEAL,
        spaceAfter=2,
    )
    style_cover_title = ParagraphStyle(
        "CoverTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=PRIMARY_DARK,
        spaceAfter=2,
    )
    style_cover_meta = ParagraphStyle(
        "CoverMeta",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11.5,
        textColor=MUTED_SLATE,
        spaceAfter=6,
    )
    style_h1 = ParagraphStyle(
        "SectionH1",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=PRIMARY_TEAL,
        spaceBefore=0,
        spaceAfter=5,
    )
    style_body = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=SECONDARY_SLATE,
        spaceAfter=3,
    )
    style_bullet = ParagraphStyle(
        "BulletItem",
        parent=style_body,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=2.5,
    )
    style_caption = ParagraphStyle(
        "FigureCaption",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=10.5,
        textColor=MUTED_SLATE,
        alignment=1, # Center
        spaceBefore=3,
        spaceAfter=4,
    )
    style_note = ParagraphStyle(
        "NoteText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=PRIMARY_DARK,
    )

    def note_box(prefix, text, bg="#eff6ff", border="#bfdbfe", text_color="#1e3a8a"):
        content = [Paragraph(f"<b><font color='{text_color}'>{prefix}:</font></b> {text}", style_note)]
        t = Table([[content]], colWidths=[540])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(bg)),
            ("BORDER", (0, 0), (-1, -1), 0.5, colors.HexColor(border)),
            ("ROUNDEDCORNERS", [3, 3, 3, 3]),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ]))
        return t

    def add_image(filename, width=440, height=288):
        path = os.path.join(ANNOTATED_DIR, filename)
        if os.path.exists(path):
            img = Image(path, width=width, height=height)
            t = Table([[img]], colWidths=[width])
            t.setStyle(TableStyle([
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 1),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                ("BOX", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
            ]))
            # Wrap in an outer table to center on page
            wrapper = Table([[t]], colWidths=[540])
            wrapper.setStyle(TableStyle([
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]))
            return wrapper
        return Paragraph(f"<i>[Screenshot: {filename}]</i>", style_caption)

    story = []

    # =========================================================================
    # PAGE 1: TITLE, DOCUMENT DETAILS, INTRO, ACCESS & FIGURE 1 (LANDING PAGE)
    # =========================================================================
    story.append(Paragraph("IT303 Course Project — Software Engineering Laboratory", style_cover_pre))
    story.append(Paragraph("Secure File Sharing with Encryption — User Manual", style_cover_title))
    story.append(Paragraph("Document Version: 1.0  •  Date: October 2026", style_cover_meta))

    meta_table_content = [
        [
            Paragraph("<b>Document Prepared By:</b><br/>Chandan Gowda C (241IT016)<br/>Prabhav P (241IT053)<br/>Sucheth K Katte (241IT078)", style_body),
            Paragraph("<b>Project Guidance:</b><br/>Dr. Jaidhar C D<br/>Dept. of Information Technology<br/>NITK Surathkal", style_body),
            Paragraph("<b>Live Web Application:</b><br/><font color='#0284c7'><u>https://secure-file-sharing-with-encryption-tau.vercel.app/</u></font>", style_body),
        ]
    ]
    t_meta = Table(meta_table_content, colWidths=[185, 175, 180])
    t_meta.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BORDER", (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 4))

    story.append(Paragraph("Introduction & Zero-Knowledge Architecture", style_h1))
    story.append(Paragraph(
        "This user manual provides step-by-step guidance for operating the <b>Secure File Sharing with Encryption</b> platform. "
        "The system guarantees true <b>Zero-Knowledge End-to-End Cryptography</b>: user files are encrypted locally inside "
        "the client browser using <b>AES-256-GCM</b> and <b>Elliptic Curve Diffie-Hellman (P-256)</b> before network transmission. "
        "Neither plaintext files nor private encryption keys are ever exposed to the server or cloud storage.",
        style_body
    ))
    story.append(Paragraph("Accessing the Module", style_h1))
    story.append(Paragraph("1. Launch Google Chrome (or any Chromium browser supporting the WebCrypto API).", style_bullet))
    story.append(Paragraph("2. Navigate to: <b>https://secure-file-sharing-with-encryption-tau.vercel.app/</b>", style_bullet))
    story.append(Paragraph("3. Verify the <b>Backend: Online</b> status pill displayed in the bottom-right corner.", style_bullet))
    story.append(Spacer(1, 3))

    story.append(add_image("01_landing_page.png", width=440, height=288))
    story.append(Paragraph("<i>Figure 1: Application Landing Page with top navigation bar and Call-to-Action buttons highlighted.</i>", style_caption))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: ACTIONS AVAILABLE TO THE USER & IDENTITY INITIALIZATION
    # =========================================================================
    story.append(Paragraph("Actions Available to the User", style_h1))
    story.append(Paragraph(
        "Users and administrators have access to a distinct set of cryptographic, file transfer, and auditing operations:",
        style_body
    ))

    actions = [
        "<b>Register a New Account:</b> Generates zero-knowledge ECDH P-256 cryptographic identity keys stored locally in IndexedDB.",
        "<b>Password Strength Validation:</b> Real-time entropy evaluation requiring length, uppercase, lowercase, numbers, and special characters.",
        "<b>Two-Factor Authentication (2FA) Sign In:</b> Mandatory 6-digit OTP verification dispatched via Brevo transactional email.",
        "<b>2FA OTP Resend with Cooldown:</b> Instant resend option enabled after a 30-second cooldown timer.",
        "<b>Forgot & Reset Password Workflow:</b> Secure time-limited password reset tokens delivered directly to registered email addresses.",
        "<b>In-App Password Modification:</b> Authenticated users can update their security credentials from the user navigation menu.",
        "<b>End-to-End Encrypted File Upload:</b> Select recipient, perform live public-key directory lookup, and encrypt files using AES-256-GCM client-side.",
        "<b>Secure File Decryption from Inbox:</b> Inspect pending transfers with human-readable file sizes (KB, MB, GB), decrypt locally, and acknowledge delivery.",
        "<b>Permanent Account Deletion:</b> Securely purges user cryptographic identity and associated pending transfers while preserving audit compliance records.",
        "<b>System Administrator Control Panel:</b> Inspect registered users, last login timestamps, file transfer audit records, and export signed forensic PDF reports.",
    ]
    for act in actions:
        story.append(Paragraph(f"• {act}", style_bullet))

    story.append(Spacer(1, 3))
    story.append(Paragraph("Platform Module Overview", style_h1))
    story.append(add_image("02_register_empty.png", width=440, height=288))
    story.append(Paragraph("<i>Figure 2: New Account Creation view demonstrating the zero-knowledge identity generation notice.</i>", style_caption))
    story.append(note_box(
        "SECURITY NOTICE",
        "Private keys are generated using window.crypto.subtle and never leave the user's browser memory or local IndexedDB."
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 3: 1. ACCOUNT REGISTRATION & PASSWORD ENTROPY METER
    # =========================================================================
    story.append(Paragraph("1. Account Registration & Password Entropy Meter", style_h1))
    story.append(Paragraph("● Click the <b>Register</b> button located in the top navigation bar or the hero section.", style_bullet))
    story.append(Paragraph("● Enter the required registration details:", style_bullet))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;○ <b>Username:</b> Unique handle (e.g., <code>withprabhav</code> or <code>prabhavp</code>).", style_bullet))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;○ <b>Email Address:</b> Registered email address (e.g., <code>withprabhav@gmail.com</code>) used for 2FA OTP codes.", style_bullet))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;○ <b>Password & Confirm Password:</b> Minimum 8 characters with high entropy.", style_bullet))
    story.append(Paragraph("● The <b>Password Strength Meter</b> actively evaluates your password and displays <b>Weak</b>, <b>Medium</b>, or <b>Strong</b>.", style_bullet))
    story.append(Paragraph("● Submitting the form automatically triggers the browser's <b>SubtleCrypto</b> engine to generate an ECDH P-256 key pair.", style_bullet))
    story.append(Spacer(1, 3))

    story.append(add_image("03_register_filled.png", width=440, height=288))
    story.append(Paragraph("<i>Figure 3: Registration form with username 'withprabhav', Strong password entropy meter, and action button highlighted.</i>", style_caption))
    story.append(note_box(
        "CRYPTOGRAPHIC KEY STORAGE",
        "The private key is stored exclusively in your browser's local IndexedDB. It is never transmitted across the network. Only the public key is sent to the backend directory for recipient encryption."
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 4: 2. USER SIGN IN & CREDENTIAL VERIFICATION
    # =========================================================================
    story.append(Paragraph("2. User Sign In & Credential Verification", style_h1))
    story.append(Paragraph("● Navigate to the <b>Login</b> page by clicking the Login button in the top navigation bar.", style_bullet))
    story.append(Paragraph("● In the <b>Username or Email</b> field, enter your registered account identifier (e.g., <code>withprabhav@gmail.com</code>).", style_bullet))
    story.append(Paragraph("● In the <b>Password</b> field, input your account password.", style_bullet))
    story.append(Paragraph("● If you have forgotten your password, click the <b>Forgot Password?</b> link located below the input.", style_bullet))
    story.append(Paragraph("● Click the <b>Sign In</b> button to verify your credentials.", style_bullet))
    story.append(Paragraph("● The server validates the bcrypt hash and automatically dispatches a 6-digit OTP code to your email via Brevo.", style_bullet))
    story.append(Spacer(1, 3))

    story.append(add_image("04_login_filled.png", width=440, height=288))
    story.append(Paragraph("<i>Figure 4: Primary authentication screen with credential inputs and 'Sign In' action button highlighted.</i>", style_caption))
    story.append(note_box(
        "BRUTE-FORCE DEFENSE",
        "Authentication attempts are monitored and logged with timestamp and account details to defend against credential-stuffing attacks."
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 5: 3. TWO-FACTOR AUTHENTICATION (2FA) & RESEND PROTOCOL
    # =========================================================================
    story.append(Paragraph("3. Two-Factor Authentication (2FA) & OTP Resend Protocol", style_h1))
    story.append(Paragraph("● Following primary credential verification, the <b>Two-Factor Authentication</b> modal is presented.", style_bullet))
    story.append(Paragraph("● Check your registered email inbox (<code>withprabhav@gmail.com</code>) for the OTP email from <code>securefilesharing303.project@gmail.com</code>.", style_bullet))
    story.append(Paragraph("● <b>Resend Code (30s Cooldown):</b> If email delivery is delayed, the Resend button activates after 30 seconds to prevent spamming.", style_bullet))
    story.append(Paragraph("● <b>Clipboard Quick-Paste:</b> Click the <b>Paste</b> button to instantly populate the 6 digits copied from your email.", style_bullet))
    story.append(Paragraph("● Verification codes expire automatically after 5 minutes and are single-use.", style_bullet))
    story.append(Spacer(1, 3))

    story.append(add_image("05_mfa_screen.png", width=440, height=288))
    story.append(Paragraph("<i>Figure 5: 2FA dialog showing 6-digit OTP entry, 30-second Resend Code cooldown timer, and paste clipboard helper.</i>", style_caption))
    story.append(note_box(
        "SESSION SECURITY",
        "Each 2FA challenge is cryptographically bound to your specific pending session. Unused challenge tokens are automatically invalidated upon timeout."
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 6: 4. COMPLETING 2FA & ESTABLISHING ENCRYPTED SESSION
    # =========================================================================
    story.append(Paragraph("4. Completing 2FA Verification & Establishing Session", style_h1))
    story.append(Paragraph("● Enter the 6-digit numeric verification code into the OTP input field (e.g., <code>123456</code>).", style_bullet))
    story.append(Paragraph("● Click the <b>Verify Code & Sign In</b> button to finalize authentication.", style_bullet))
    story.append(Paragraph("● The server validates the code against the session state and issues a cryptographically signed JWT token.", style_bullet))
    story.append(Paragraph("● The client establishes the session and automatically redirects you to the <b>Upload</b> dashboard.", style_bullet))
    story.append(Paragraph("● The top navigation bar updates to display: <b>Upload</b>, <b>Inbox</b>, <b>Change Password</b>, <b>Delete Account</b>, and <b>Logout</b>.", style_bullet))
    story.append(Spacer(1, 3))

    story.append(add_image("06_mfa_filled.png", width=440, height=288))
    story.append(Paragraph("<i>Figure 6: 2FA verification dialog with 6-digit OTP code entered and verification button highlighted.</i>", style_caption))
    story.append(note_box(
        "SESSION TOKEN MANAGEMENT",
        "JWT tokens are stored in secure browser storage and automatically included in Authorization headers for subsequent encrypted operations."
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 7: 5. END-TO-END ENCRYPTED FILE UPLOAD WORKFLOW
    # =========================================================================
    story.append(Paragraph("5. End-to-End Encrypted File Upload Workflow", style_h1))
    story.append(Paragraph("● In the <b>Recipient Username</b> field, type the intended recipient's username (e.g., <code>chandangowda</code>).", style_bullet))
    story.append(Paragraph("● The client queries <code>GET /auth/users/public-key</code> to retrieve the recipient's ECDH P-256 public key.", style_bullet))
    story.append(Paragraph("● Drag and drop your confidential file into the upload dropzone or click to browse (supports files up to 100 MB).", style_bullet))
    story.append(Paragraph("● The browser generates a random 256-bit AES-GCM key, encrypts the file locally, and derives an encrypted envelope key.", style_bullet))
    story.append(Paragraph("● Click <b>Encrypt & Upload</b> to transmit the ciphertext blob and encrypted key envelope to cloud storage.", style_bullet))
    story.append(Spacer(1, 3))

    story.append(add_image("07_upload_page.png", width=440, height=288))
    story.append(Paragraph("<i>Figure 7: Encrypted Upload interface featuring recipient validation, dropzone, and encryption action button.</i>", style_caption))
    story.append(note_box(
        "ZERO-KNOWLEDGE GUARANTEE",
        "The server only ever stores and forwards ciphertext. Neither administrators nor database operators can inspect the contents of uploaded files."
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 8: 6. RECEIVER INBOX & CLIENT-SIDE DECRYPTION
    # =========================================================================
    story.append(Paragraph("6. Receiver Inbox & Client-Side File Decryption", style_h1))
    story.append(Paragraph("● Click the <b>Inbox</b> tab in the navigation bar to inspect incoming encrypted file deliveries.", style_bullet))
    story.append(Paragraph("● Each transfer card displays: sender username, upload timestamp, and <b>human-readable file size</b> (e.g., <code>250.0 KB</code>, <code>1.50 MB</code>).", style_bullet))
    story.append(Paragraph("● Click <b>Decrypt & Download</b> to retrieve the encrypted ciphertext into local browser memory.", style_bullet))
    story.append(Paragraph("● The browser retrieves your private key from IndexedDB, performs ECDH key agreement to derive the AES key, and decrypts the file payload.", style_bullet))
    story.append(Paragraph("● The decrypted file is immediately saved to your computer, and a delivery acknowledgment is registered with the backend.", style_bullet))
    story.append(Spacer(1, 3))

    story.append(add_image("08_inbox_page.png", width=440, height=288))
    story.append(Paragraph("<i>Figure 8: Receiver Inbox displaying pending encrypted transfers with formatted file size units and Decrypt button.</i>", style_caption))
    story.append(note_box(
        "LOCAL DECRYPTION",
        "Decryption is 100% zero-knowledge. Without the recipient's private key stored on their personal device, the ciphertext is computationally unbreakable."
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 9: 7. PASSWORD RECOVERY WORKFLOW (FORGOT PASSWORD)
    # =========================================================================
    story.append(Paragraph("7. Password Recovery Workflow (Forgot Password)", style_h1))
    story.append(Paragraph("● If you forget your password, click the <b>Forgot Password?</b> link located on the login screen.", style_bullet))
    story.append(Paragraph("● Enter your registered email address (e.g., <code>withprabhav@gmail.com</code>) into the email field.", style_bullet))
    story.append(Paragraph("● Click <b>Send Password Reset Link</b>. The backend generates a signed JWT reset token with a 30-minute validity window.", style_bullet))
    story.append(Paragraph("● Check your email for the recovery link dispatched by Brevo transactional mailer.", style_bullet))
    story.append(Paragraph("● Open the link in your browser to access the Reset Password page, enter your new password, and verify strength.", style_bullet))
    story.append(Spacer(1, 3))

    story.append(add_image("09_forgot_password.png", width=440, height=288))
    story.append(Paragraph("<i>Figure 9: Password Recovery interface showing email entry and reset link dispatch trigger.</i>", style_caption))
    story.append(note_box(
        "ANTI-ENUMERATION SECURITY",
        "The system responds with a generic confirmation message regardless of whether an account exists, preventing malicious email enumeration."
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 10: 8. IN-APP PASSWORD MODIFICATION (USER PROFILE)
    # =========================================================================
    story.append(Paragraph("8. In-App Password Modification (User Profile)", style_h1))
    story.append(Paragraph("● Authenticated users can update their account password at any time by clicking <b>Change Password</b> in navigation.", style_bullet))
    story.append(Paragraph("● Enter your current password followed by your new password and confirmation.", style_bullet))
    story.append(Paragraph("● The real-time <b>Password Strength Meter</b> actively evaluates password complexity (Weak, Medium, Strong).", style_bullet))
    story.append(Paragraph("● Passwords must meet at least 3 security criteria to be accepted.", style_bullet))
    story.append(Paragraph("● Click <b>Update Password</b>. The backend rehashes your password with bcrypt and records an audit event.", style_bullet))
    story.append(Spacer(1, 3))

    story.append(add_image("10_change_password.png", width=440, height=288))
    story.append(Paragraph("<i>Figure 10: Change Password form with current password verification, strength meter, and update action highlighted.</i>", style_caption))
    story.append(note_box(
        "KEY PAIR CONTINUITY",
        "Changing your password updates your authentication hash while safely preserving your local cryptographic ECDH key pairs in IndexedDB."
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 11: 9. ADMIN DASHBOARD — USER DIRECTORY & LAST LOGIN
    # =========================================================================
    story.append(Paragraph("9. Administrator Dashboard — User Directory & Last Login", style_h1))
    story.append(Paragraph("● System administrators log in with administrative credentials (<code>admin</code>) to access the <b>Admin Dashboard</b>.", style_bullet))
    story.append(Paragraph("● Under the <b>Registered Users</b> tab, view the complete platform user directory.", style_bullet))
    story.append(Paragraph("● <b>Directory Columns:</b> Username, Email, Admin status, Registration date, and <b>Last Login timestamp</b>.", style_bullet))
    story.append(Paragraph("● <b>Live User Filter:</b> Search users in real time by username or email address.", style_bullet))
    story.append(Paragraph("● Click the <b>PDF</b> report button beside any user to instantly export an official forensic audit log report.", style_bullet))
    story.append(Spacer(1, 3))

    story.append(add_image("11_admin_users.png", width=440, height=288))
    story.append(Paragraph("<i>Figure 11: Admin Registered Users tab displaying user directory, last login timestamps, and report export buttons.</i>", style_caption))
    story.append(note_box(
        "LAST LOGIN TRACKING",
        "User last login timestamps are recorded automatically upon 2FA completion, providing administrators with continuous operational oversight."
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 12: 10. ADMIN FORENSIC ACTIVITY LOGS & PDF EXPORT
    # =========================================================================
    story.append(Paragraph("10. Administrator Dashboard — Forensic Activity Logs & PDF Export", style_h1))
    story.append(Paragraph("● Switch to the <b>System Activity Logs</b> tab to inspect tamper-evident forensic event records.", style_bullet))
    story.append(Paragraph("● Event types include: <code>register</code>, <code>login</code>, <code>upload_file</code>, <code>download_file</code>, <code>change_password</code>, and <code>delete_account</code>.", style_bullet))
    story.append(Paragraph("● All file transfer events explicitly display <b>formatted size units</b> (e.g., <code>Size: 250.0 KB</code>, <code>Size: 1.50 MB</code>).", style_bullet))
    story.append(Paragraph("● Click <b>Generate PDF Report</b> to export a tamper-evident audit report with IP addresses cleanly removed for privacy.", style_bullet))
    story.append(Spacer(1, 3))

    story.append(add_image("12_admin_activities.png", width=440, height=288))
    story.append(Paragraph("<i>Figure 12: Forensic System Activity Logs tab showing formatted file size units and one-click PDF export button.</i>", style_caption))
    story.append(note_box(
        "AUDIT LOG IMMUTABILITY",
        "System activity logs are strictly append-only. Historical audit trails are preserved across user sessions for forensic compliance."
    ))
    story.append(PageBreak())

    # =========================================================================
    # PAGE 13: 11. FILE AUDIT LOGS, ACCOUNT DELETION & SUPPORT
    # =========================================================================
    story.append(Paragraph("11. File Audit Logs, Account Deletion & Project Contacts", style_h1))
    story.append(Paragraph("● Click the <b>File Audit Logs</b> tab to review end-to-end file transfer delivery telemetry.", style_bullet))
    story.append(Paragraph("● Tracks Transfer UUID, Sender username, Receiver username, and delivery status (<code>queued</code>, <code>downloaded</code>).", style_bullet))
    story.append(Paragraph("● <b>Account Deletion Protocol:</b> Users can permanently delete their account by clicking <b>Delete Account</b> in navigation.", style_bullet))
    story.append(Paragraph("● Deletion securely purges private keys from browser IndexedDB and deletes associated file blobs from server storage.", style_bullet))
    story.append(Paragraph("● To prevent fraudulent repudiation, historical activity records are retained in compliance with audit standards.", style_bullet))
    story.append(Spacer(1, 3))

    story.append(add_image("13_admin_transfers.png", width=440, height=288))
    story.append(Paragraph("<i>Figure 13: File Transfer Audit Logs tab tracking delivery timestamps and lifecycle states.</i>", style_caption))
    story.append(note_box(
        "DEVELOPER CONTACT & SUPPORT",
        "For technical questions, security reports, or academic evaluations, contact the project team at: securefilesharing303.project@gmail.com",
        bg="#fef2f2",
        border="#fecaca",
        text_color="#991b1b"
    ))

    # Build the document with two-pass NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"User manual generated successfully at: {PDF_OUTPUT_PATH}")

if __name__ == "__main__":
    create_user_manual()
