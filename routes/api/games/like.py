from flask import Blueprint, session, jsonify
from db import toggleLike

like_bp = Blueprint("api_games_like", __name__)


@like_bp.route("/games/<int:game_id>/like", methods=["POST"])
def toggle_like(game_id):
    if "userid" not in session:
        return jsonify({"error": "Not logged in"}), 401

    result, status = toggleLike(game_id, session["userid"])
    return jsonify(result), status
