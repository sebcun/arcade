from flask import Blueprint, render_template, redirect, url_for, session, abort
import os
from db import (
    getGame,
)

develop_game_bp = Blueprint("develop_game", __name__)


@develop_game_bp.route("/develop/<game_id>")
def developGame(game_id):
    website_url = os.getenv("WEBSITE", "https://pixelcade.sebcun.com")

    if "userid" not in session:
        return redirect(url_for("index.index") + f"?login&target=develop/{game_id}")

    game_data, status = getGame(game_id)

    if status != 200:
        return redirect(url_for("index.index") + "?404")

    if game_data["author"] != session["userid"]:
        return redirect(url_for("index.index") + "?401")

    return render_template(
        "developGame.html", LOGGEDIN=True, WEBSITE=website_url, GAMEID=game_id
    )
