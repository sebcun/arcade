from flask import Blueprint, render_template, session
import os

docs_bp = Blueprint("docs", __name__)


@docs_bp.route("/docs")
def docs():
    website_url = os.getenv("WEBSITE", "https://arcade.sebcun.com")

    if "userid" in session:
        return render_template("docs.html", LOGGEDIN=True, WEBSITE=website_url)
    return render_template("docs.html", LOGGEDIN=False, WEBSITE=website_url)
