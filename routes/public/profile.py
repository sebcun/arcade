from flask import Blueprint, render_template, redirect, url_for, session
import os

profile_bp = Blueprint("profile", __name__)


@profile_bp.route("/profile")
def profile():
    website_url = os.getenv("WEBSITE", "https://arcade.sebcun.com")

    if "userid" in session:
        return render_template("profile.html", WEBSITE=website_url)
    return redirect(url_for("index.index") + "?login")


@profile_bp.route("/profile/<userid>")
def otherProfile(userid):
    website_url = os.getenv("WEBSITE", "https://arcade.sebcun.com")
    return render_template("otherProfile.html", WEBSITE=website_url, USERID=userid)
