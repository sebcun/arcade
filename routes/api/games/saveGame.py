from flask import Blueprint, session, request, jsonify
from db import saveGame

save_game_bp = Blueprint("save_game", __name__)


@save_game_bp.route("/games/<int:game_id>/save", methods=["POST"])
def save_game(game_id):
    if "userid" not in session:
        return jsonify({"error": "Not logged in"}), 401

    data = request.get_json()
    code = data.get("code", "")
    sprites_data = data.get("sprites", [])

    result, status = saveGame(game_id, session["userid"], code, sprites_data)
    return jsonify(result), status
