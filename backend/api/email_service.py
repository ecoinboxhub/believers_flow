import os
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger("beliversflow.email")

SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_FROM = os.environ.get("SMTP_FROM", "noreply@believersflow.app")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://christian-task-manager.vercel.app")


def is_configured() -> bool:
    host = os.environ.get("SMTP_HOST", SMTP_HOST)
    user = os.environ.get("SMTP_USER", SMTP_USER)
    password = os.environ.get("SMTP_PASSWORD", SMTP_PASSWORD)
    return bool(host and user and password)


def _send_email(to_email: str, subject: str, html_body: str) -> bool:
    if not is_configured():
        logger.warning("SMTP not configured — email not sent")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = SMTP_FROM
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, to_email, msg.as_string())

        logger.info(f"Email sent to {to_email}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


def send_password_reset_email(to_email: str, reset_token: str) -> bool:
    reset_url = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    subject = "BelieversFlow — Reset Your Password"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c5f2d;">Password Reset Request</h2>
        <p>You requested a password reset for your BelieversFlow account.</p>
        <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_url}"
               style="background-color: #2c5f2d; color: white; padding: 12px 30px;
                      text-decoration: none; border-radius: 5px; font-weight: bold;">
                Reset Password
            </a>
        </div>
        <p style="color: #666; font-size: 13px;">
            If you didn't request this, you can safely ignore this email.
            Your password will remain unchanged.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">BelieversFlow — Your Faith Journey</p>
    </div>
    """
    return _send_email(to_email, subject, html)


def send_verification_email(to_email: str, verification_token: str) -> bool:
    verify_url = f"{FRONTEND_URL}/verify-email?token={verification_token}"
    subject = "BelieversFlow — Verify Your Email"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c5f2d;">Verify Your Email Address</h2>
        <p>Thanks for signing up for BelieversFlow! Please verify your email address.</p>
        <p>Click the button below to verify. This link expires in <strong>24 hours</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{verify_url}"
               style="background-color: #2c5f2d; color: white; padding: 12px 30px;
                      text-decoration: none; border-radius: 5px; font-weight: bold;">
                Verify Email
            </a>
        </div>
        <p style="color: #666; font-size: 13px;">
            If you didn't create an account, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">BelieversFlow — Your Faith Journey</p>
    </div>
    """
    return _send_email(to_email, subject, html)
