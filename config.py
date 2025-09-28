from dotenv import dotenv_values
import os

_env = dotenv_values(".env") or {}

for key in (
    "SECRET_KEY",
    "WEBSITE",
    "SLACK_CLIENT_ID",
    "SLACK_CLIENT_SECRET",
    "SLACK_REDIRECT_URI",
):
    if key in _env and os.getenv(key) is None:
        os.environ[key] = _env[key]
