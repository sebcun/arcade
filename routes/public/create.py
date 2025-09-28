from flask import Blueprint, render_template, redirect, url_for, session
import os

create_bp = Blueprint("create", __name__)


@create_bp.route("/create")
def create():
    website_url = os.getenv("WEBSITE", "https://arcade.sebcun.com")

    if "userid" in session:
        return render_template("create.html", LOGGEDIN=True, WEBSITE=website_url)
    return redirect(url_for("index.index") + "?login")
