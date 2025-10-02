from flask import Blueprint, session, request, jsonify
from db import saveGame

save_game_bp = Blueprint("api_games_save", __name__)


@save_game_bp.route("/games/<int:game_id>/save", methods=["POST"])
def save_game(game_id):
    if "userid" not in session:
        return jsonify({"error": "Not logged in"}), 401

    data = request.get_json()

    title = data.get("gameName") if "gameName" in data else None
    description = data.get("gameDescription") if "gameDescription" in data else None

    if "gameVisibility" in data:
        raw_vis = data.get("gameVisibility")
        if raw_vis is None or raw_vis == "":
            visibility = None
        else:
            try:
                v = int(raw_vis)
            except Exception:
                return jsonify({"error": "Invalid visibility value"}), 400
            if v not in (-1, 0, 1):
                return jsonify({"error": "Invalid visibility value"}), 400
            visibility = v
    else:
        visibility = None

    code = data["code"] if "code" in data else None
    sprites_data = data["sprites"] if "sprites" in data else None

    result, status = saveGame(
        game_id,
        session["userid"],
        code=code,
        sprites_data=sprites_data,
        title=title,
        description=description,
        visibility=visibility,
    )
    return jsonify(result), status
