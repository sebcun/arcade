from flask import Blueprint, request, jsonify, session, redirect, url_for
import requests
import os
from db import getUserProfile, createUser, giveBadge

slack_callback_bp = Blueprint("slack_callback", __name__)

SLACK_CLIENT_ID = os.getenv("SLACK_CLIENT_ID")
SLACK_CLIENT_SECRET = os.getenv("SLACK_CLIENT_SECRET")
SLACK_REDIRECT_URI = os.getenv("SLACK_REDIRECT_URI")


@slack_callback_bp.route("/slack/callback")
def slack_callback():
    code = request.args.get("code")
    if not code:
        return jsonify({"error": "No Slack code provided."}), 400

    token_response = requests.post(
        "https://slack.com/api/openid.connect.token",
        data={
            "client_id": SLACK_CLIENT_ID,
            "client_secret": SLACK_CLIENT_SECRET,
            "code": code,
            "redirect_uri": SLACK_REDIRECT_URI,
        },
    ).json()

    if not token_response.get("ok"):
        return jsonify({"error": "Invalid login code provided from Slack."}), 400

    user_info = requests.get(
        "https://slack.com/api/openid.connect.userInfo",
        headers={"Authorization": f"Bearer {token_response['access_token']}"},
    ).json()

    email = user_info.get("email")
    if not email:
        return jsonify({"error": "No email provided from Slack."}), 400

    profile = getUserProfile(email)
    if profile:
        session["email"] = email
        session["userid"] = profile["id"]
    else:
        result, status = createUser(email)
        if status in (200, 201) and isinstance(result, dict) and result.get("userid"):
            session["email"] = email
            session["userid"] = result["userid"]
            try:
                giveBadge(
                    session["userid"],
                    "siege",
                    "Siege",
                    "Signed up during the Siege weeks!",
                )
            except Exception:
                pass
        else:
            return jsonify({"error": "Failed to create account via Slack."}), 500

    return redirect(url_for("index.index"))
