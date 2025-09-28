from flask import Blueprint, session, jsonify
from db import getGame, getLikesForGame, userLikedGame

game_bp = Blueprint("game", __name__)


@game_bp.route("/games/<int:game_id>", methods=["GET"])
def get_game(game_id):
    result, status = getGame(game_id)

    if isinstance(result, dict) and status == 200:
        try:
            likes = getLikesForGame(game_id)
            user_liked = False
            if "userid" in session:
                user_liked = userLikedGame(game_id, session["userid"])
            result["likes"] = likes
            result["liked"] = bool(user_liked)
        except Exception:
            result["likes"] = 0
            result["liked"] = False
    return jsonify(result), status
