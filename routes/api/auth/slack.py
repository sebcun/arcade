from flask import Blueprint, redirect
import os

slack_bp = Blueprint("slack", __name__)

SLACK_CLIENT_ID = os.getenv("SLACK_CLIENT_ID")
SLACK_REDIRECT_URI = os.getenv("SLACK_REDIRECT_URI")


@slack_bp.route("/slack")
def slack_create_url():
    slack_auth_url = (
        "https://slack.com/openid/connect/authorize"
        f"?response_type=code&client_id={SLACK_CLIENT_ID}"
        f"&scope=openid%20profile%20email"
        f"&redirect_uri={SLACK_REDIRECT_URI}"
    )
    return redirect(slack_auth_url)
