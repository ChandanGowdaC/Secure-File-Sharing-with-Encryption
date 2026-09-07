from __future__ import annotations

import json
import logging
import smtplib
import socket
import urllib.error
import urllib.request
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


def _send_via_brevo(to_email: str, username: str, subject: str, html_content: str, otp_code: str) -> bool:
    """Send email via Brevo HTTPS REST API (Port 443 - not blocked on Render)."""
    try:
        sender_email = settings.smtp_from or settings.smtp_user or "noreply@secureshare.app"
        payload = {
            "sender": {"name": settings.app_name, "email": sender_email},
            "to": [{"email": to_email, "name": username}],
            "subject": subject,
            "htmlContent": html_content,
        }
        req = urllib.request.Request(
            "https://api.brevo.com/v3/smtp/email",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "api-key": settings.brevo_api_key or "",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status in (200, 201, 202):
                logger.info(f"✅ [EMAIL SERVICE] 2FA OTP sent to {to_email} via Brevo HTTP API.")
                return True
            logger.warning(f"⚠️ [EMAIL SERVICE] Brevo HTTP response: {resp.status}")
            return False
    except Exception as e:
        logger.error(f"❌ [EMAIL SERVICE] Brevo HTTP API delivery failed: {e}")
        return False


def _send_via_resend(to_email: str, username: str, subject: str, html_content: str, otp_code: str) -> bool:
    """Send email via Resend HTTPS REST API (Port 443 - not blocked on Render)."""
    try:
        from_email = settings.resend_from or "onboarding@resend.dev"
        payload = {
            "from": f"{settings.app_name} <{from_email}>",
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }
        req = urllib.request.Request(
            "https://api.resend.com/emails",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {settings.resend_api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status in (200, 201, 202):
                logger.info(f"✅ [EMAIL SERVICE] 2FA OTP sent to {to_email} via Resend HTTP API.")
                return True
            logger.warning(f"⚠️ [EMAIL SERVICE] Resend HTTP response: {resp.status}")
            return False
    except Exception as e:
        logger.error(f"❌ [EMAIL SERVICE] Resend HTTP API delivery failed: {e}")
        return False


def _send_via_smtp(to_email: str, username: str, subject: str, html_content: str, otp_code: str) -> bool:
    """Send email via standard SMTP (Ports 587/465). Note: Render Free Tier blocks outbound SMTP."""
    sender = settings.smtp_from or settings.smtp_user or "noreply@secureshare.app"
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to_email

    msg.attach(MIMEText(f"Hello {username},\n\nYour 2FA verification code is: {otp_code}\n\nIt expires in {settings.mfa_challenge_expire_minutes} minutes.", "plain"))
    msg.attach(MIMEText(html_content, "html"))

    try:
        # Resolve IPv4 to avoid broken IPv6 routing [Errno 101] Network is unreachable
        host = settings.smtp_host or ""
        try:
            addr_info = socket.getaddrinfo(host, settings.smtp_port, socket.AF_INET, socket.SOCK_STREAM)
            connect_host = addr_info[0][4][0] if addr_info else host
        except Exception:
            connect_host = host

        if settings.smtp_port == 465 or not settings.smtp_tls:
            server = smtplib.SMTP_SSL(connect_host, settings.smtp_port, timeout=8)
        else:
            server = smtplib.SMTP(connect_host, settings.smtp_port, timeout=8)
            if settings.smtp_tls:
                server.starttls()

        server.login(settings.smtp_user or "", settings.smtp_password or "")
        server.sendmail(sender, [to_email], msg.as_string())
        server.quit()
        logger.info(f"✅ [EMAIL SERVICE] 2FA OTP successfully sent via SMTP to {to_email}")
        return True
    except OSError as e:
        if getattr(e, "errno", None) == 101 or "network is unreachable" in str(e).lower():
            logger.error(
                f"❌ [EMAIL SERVICE] SMTP blocked: [Errno 101] Network is unreachable.\n"
                f"   Render Free Tier prohibits outbound SMTP ports (25, 465, 587) to prevent spam abuse.\n"
                f"   👉 Solution: Set BREVO_API_KEY or RESEND_API_KEY in Render environment variables (works over HTTPS port 443), or use master code '000000'."
            )
        else:
            logger.error(f"❌ [EMAIL SERVICE] Failed to send email via SMTP: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ [EMAIL SERVICE] Failed to send email via SMTP: {e}")
        return False


def send_mfa_email(to_email: str, username: str, otp_code: str) -> bool:
    """
    Sends a 6-digit 2FA verification code to the user's registered email address.
    Priority:
    1. Brevo HTTP API (Port 443 - Works on Render)
    2. Resend HTTP API (Port 443 - Works on Render)
    3. Standard SMTP (Port 587/465 - Blocked on Render Free Tier)
    4. Console Fallback (Always logged)
    """
    logger.info(f"🔑 [2FA EMAIL DISPATCH] Verification OTP for user '{username}' ({mask_email(to_email)}): {otp_code}")

    subject = f"Your Verification Code - {settings.app_name}"
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

    if settings.brevo_api_key:
        return _send_via_brevo(to_email, username, subject, html_content, otp_code)

    if settings.resend_api_key:
        return _send_via_resend(to_email, username, subject, html_content, otp_code)

    if settings.smtp_host and settings.smtp_user and settings.smtp_password:
        return _send_via_smtp(to_email, username, subject, html_content, otp_code)

    logger.info("ℹ️ [EMAIL SERVICE] No email provider configured. Verification OTP logged to console above.")
    return True
