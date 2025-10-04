from flask import Blueprint, session, jsonify, request, redirect, url_for
from db import createGame, getUserProfile

create_game_bp = Blueprint("api_games_create", __name__)


@create_game_bp.route("/games/create", methods=["POST"])
def create_game():
    if "userid" not in session:
        return jsonify({"error": "Not logged in"}), 401

    # Checks if the user profile still exists, if not log out
    profile = getUserProfile(session["userid"])
    if not profile:
        return redirect(url_for("logout.logout"))

    data = request.get_json()
    title = data.get("title")

    result, status = createGame(session["userid"], title, "")
    return jsonify(result), status
