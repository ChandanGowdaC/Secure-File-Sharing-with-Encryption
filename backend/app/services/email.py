from __future__ import annotations

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings

logger = logging.getLogger("uvicorn.error")


def mask_email(email: str) -> str:
    """Mask email for privacy, e.g., 'alice@example.com' -> 'a***e@example.com'"""
    try:
        user_part, domain_part = email.split("@", 1)
        if len(user_part) <= 2:
            masked_user = user_part[0] + "***"
        else:
            masked_user = user_part[0] + "***" + user_part[-1]
        return f"{masked_user}@{domain_part}"
    except Exception:
        return email


def send_mfa_email(to_email: str, username: str, otp_code: str) -> bool:
    """
    Sends a 6-digit 2FA verification code to the user's registered email address.
    If SMTP is configured, sends via SMTP. Otherwise, logs code to server console.
    """
    logger.info(f"🔑 [2FA EMAIL DISPATCH] Verification OTP for user '{username}' ({mask_email(to_email)}): {otp_code}")

    if not settings.smtp_host or not settings.smtp_user or not settings.smtp_password:
        logger.info("ℹ️ [EMAIL SERVICE] SMTP not configured. OTP logged above for verification.")
        return True

    subject = f"Your Verification Code - {settings.app_name}"
    sender = settings.smtp_from or settings.smtp_user

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0d1322; color: #f8fafc; padding: 20px; }}
            .card {{ max-width: 480px; margin: 0 auto; background: #1a233a; border-radius: 12px; padding: 30px; border: 1px solid rgba(255,255,255,0.1); }}
            .header {{ font-size: 20px; font-weight: bold; color: #6366f1; margin-bottom: 15px; text-align: center; }}
            .otp-box {{ background: rgba(99, 102, 241, 0.15); border: 2px dashed #6366f1; border-radius: 8px; padding: 18px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #ffffff; margin: 24px 0; }}
            .footer {{ font-size: 12px; color: #94a3b8; text-align: center; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="header">🛡️ {settings.app_name}</div>
            <p>Hello <strong>{username}</strong>,</p>
            <p>You recently attempted to sign in. Please use the following 6-digit verification code to complete your two-factor authentication:</p>
            
            <div class="otp-box">{otp_code}</div>
            
            <p>This code will expire in <strong>{settings.mfa_challenge_expire_minutes} minutes</strong>. If you did not make this request, please change your password immediately.</p>
            <div class="footer">&copy; {settings.app_name} • End-to-End Encrypted File Sharing</div>
        </div>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to_email

    msg.attach(MIMEText(f"Hello {username},\n\nYour 2FA verification code is: {otp_code}\n\nIt expires in {settings.mfa_challenge_expire_minutes} minutes.", "plain"))
    msg.attach(MIMEText(html_content, "html"))

    try:
        if settings.smtp_port == 465 or not settings.smtp_tls:
            server = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=10)
        else:
            server = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10)
            if settings.smtp_tls:
                server.starttls()

        server.login(settings.smtp_user, settings.smtp_password)
        server.sendmail(sender, [to_email], msg.as_string())
        server.quit()
        logger.info(f"✅ [EMAIL SERVICE] 2FA OTP successfully sent via SMTP to {to_email}")
        return True
    except Exception as e:
        logger.error(f"❌ [EMAIL SERVICE] Failed to send email via SMTP: {e}")
        return False
