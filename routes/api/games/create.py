from flask import Blueprint, session, jsonify, request
from db import createGame

create_game_bp = Blueprint("api_games_create", __name__)


@create_game_bp.route("/games/create", methods=["POST"])
def create_game():
    if "userid" not in session:
        return jsonify({"error": "Not logged in"}), 401

    data = request.get_json()
    title = data.get("title")

    result, status = createGame(session["userid"], title, "")
    return jsonify(result), status
