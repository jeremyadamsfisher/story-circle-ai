import os

from fastapi_mail import ConnectionConfig, FastMail

conf = ConnectionConfig(
    MAIL_USERNAME=os.environ["MAIL_USERNAME"],
    MAIL_PASSWORD=os.environ["MAIL_PASSWORD"],
    MAIL_FROM=os.environ["MAIL_FROM"],
    MAIL_SERVER=os.environ["MAIL_SERVER"],
    MAIL_PORT=int(os.environ["MAIL_PORT"]),
    MAIL_TLS=True,
    MAIL_SSL=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)


email_client = FastMail(conf)

if os.environ.get("SUPPRESS_EMAIL", False):
    email_client.config.SUPPRESS_SEND = 1
