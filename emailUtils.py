import os
import smtplib
import ssl
import logging
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter("%(asctime)s %(levelname)s %(name)s - %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))


def send(recipientEmail, otp, expiry_minutes=5):
    """
    Send one-time code email.
    Returns True on success, False otherwise. Logs details for troubleshooting.
    """
    host = os.environ.get("EMAIL_HOST")
    port_raw = os.environ.get("EMAIL_PORT", "587")
    try:
        port = int(port_raw)
    except (TypeError, ValueError):
        logger.error("Invalid EMAIL_PORT: %r", port_raw)
        return False

    user = os.environ.get("EMAIL_HOST_USER")
    password = os.environ.get("EMAIL_HOST_PASSWORD")
    useTLS = os.environ.get("EMAIL_USE_TLS", "True").lower() == "true"
    domain = os.environ.get("WEBSITE", "https://arcade.sebcun.com")

    if not all([host, port, user, password]):
        logger.error(
            "Missing email configuration: host=%s port=%s user=%s password_set=%s",
            host,
            port,
            user,
            bool(password),
        )
        return False

    otp_str = str(otp)
    preheader = f"Your Arcade one-time code — valid for {expiry_minutes} minutes."

    plain_content = (
        f"{preheader}\n\n"
        f"Your one-time code is: {otp_str}\n\n"
        f"This code expires in {expiry_minutes} minutes. Do not share this code with anyone."
    )

    msg = EmailMessage()
    msg["From"] = user
    msg["To"] = recipientEmail
    msg["Subject"] = "Arcade — Your One-Time Code"
    msg.set_content(plain_content)

    background_color = "#F3F4F6"
    card_bg = "#ffffff"
    code_bg = "#f8fafc"
    code_border = "#e6e9ef"
    text_color = "#0f172a"

    html_content = f"""\
<html>
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <style>
      @media only screen and (max-width: 600px) {{
        .container {{ padding: 16px !important; }}
        .otp {{ font-size: 1.8rem !important; letter-spacing: 3px !important; }}
      }}
    </style>
  </head>
  <body style="background: {background_color}; font-family: Arial, Helvetica, sans-serif; margin:0; padding:24px;">
    <div style="max-width: 580px; margin: 0 auto;">
      <div class="container" style="background: {card_bg}; border-radius:12px; padding:28px; box-shadow: 0 6px 18px rgba(2,6,23,0.06);">
        <div style="text-align:center;">
          <img src="https://i.imgur.com/zCeHsMz.png" alt="Arcade" width="72" style="display:block; margin:0 auto 14px auto;" onerror="this.style.display='none'"/>
          <h1 style="margin:0 0 10px 0; color:{text_color}; font-size:20px;">Here is your One-Time Code</h1>
          <p style="margin:0 0 18px 0; color:#334155;">Enter the code below on the Arcade site. It expires in {expiry_minutes} minutes.</p>
        </div>

        <div style="text-align:center; margin:18px 0;">
          <div style="display:inline-block; padding:14px 22px; background:{code_bg}; border-radius:10px; border:1px solid {code_border};">
            <p class="otp" style="font-family: 'Courier New', Courier, monospace; font-size:32px; margin:0; color:{text_color}; letter-spacing:6px;">{otp_str}</p>
          </div>
        </div>

        <p style="color:#64748b; font-size:13px; text-align:center; margin-top:8px;">
          This code will expire in {expiry_minutes} minutes. Do not share this code with anyone.
        </p>

        <hr style="border:none; height:1px; background:#eef2f7; margin:18px 0;" />

        <p style="color:#94a3b8; font-size:12px; text-align:center; margin:0;">
          Arcade • <a href="{domain}" style="color:#94a3b8; text-decoration:underline;">{domain}</a>
        </p>
      </div>
    </div>
  </body>
</html>
"""
    msg.add_alternative(html_content, subtype="html")

    try:
        if port == 465:
            logger.debug("Using SMTP_SSL on %s:%d", host, port)
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(host, port, context=context, timeout=30) as server:
                server.set_debuglevel(1)
                server.login(user, password)
                server.send_message(msg)
        else:
            logger.debug("Using SMTP (STARTTLS=%s) on %s:%d", useTLS, host, port)
            with smtplib.SMTP(host, port, timeout=30) as server:
                server.set_debuglevel(1)
                server.ehlo()
                if useTLS:
                    context = ssl.create_default_context()
                    server.starttls(context=context)
                    server.ehlo()
                server.login(user, password)
                server.send_message(msg)

        logger.info("Email sent to %s", recipientEmail)
        return True

    except Exception as ex:
        logger.exception("Failed to send email to %s: %s", recipientEmail, ex)
        return False
