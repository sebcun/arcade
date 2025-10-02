from flask import Blueprint, render_template, redirect, url_for, session
import os

develop_bp = Blueprint("develop", __name__)


@develop_bp.route("/develop")
def develop():
    website_url = os.getenv("WEBSITE", "https://arcade.sebcun.com")

    if "userid" in session:
        return render_template("develop.html", LOGGEDIN=True, WEBSITE=website_url)
    return redirect(url_for("index.index") + "?login")
