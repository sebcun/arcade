from flask import Blueprint, render_template, session
import os

index_bp = Blueprint("index", __name__)


@index_bp.route("/")
def index():
    website_url = os.getenv("WEBSITE", "https://pixelcade.sebcun.com")

    if "userid" in session:
        return render_template("index.html", LOGGEDIN=True, WEBSITE=website_url)
    return render_template("index.html", LOGGEDIN=False, WEBSITE=website_url)
