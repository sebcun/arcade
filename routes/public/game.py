from flask import Blueprint, render_template, redirect, url_for, session
import os

play_game_bp = Blueprint("playgame", __name__)


@play_game_bp.route("/game/<gameid>")
def play_game(gameid):
    website_url = os.getenv("WEBSITE", "https://arcade.sebcun.com")

    return render_template("game.html", WEBSITE=website_url, GAMEID=gameid)
