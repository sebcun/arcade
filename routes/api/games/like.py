from flask import Blueprint, session, jsonify, redirect, url_for
from db import toggleLike, getUserProfile, getGame, updateUserProfile

like_bp = Blueprint("api_games_like", __name__)


@like_bp.route("/games/<int:game_id>/like", methods=["POST"])
def toggle_like(game_id):
    if "userid" not in session:
        return jsonify({"error": "Not logged in"}), 401

    profile = getUserProfile(session["userid"])
    if not profile:
        return redirect(url_for("logout.logout"))

    result4, status4 = toggleLike(game_id, session["userid"])

    if result4["liked"]:
        result, status = getGame(game_id)
        if isinstance(result, dict) and status == 200:
            if session["userid"] == result["author"]:
                return jsonify(result4), status4
        else:
            return jsonify({"error": "Game not found"}), 401

        result2 = getUserProfile(result["author"])
        new_coins = result2["coins"] + 5
        result3, status3 = updateUserProfile(result["author"], coins=new_coins)

    return jsonify(result4), status4
