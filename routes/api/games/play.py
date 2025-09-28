from flask import Blueprint, jsonify
from db import incrementPlay

play_bp = Blueprint("play", __name__)


@play_bp.route("/games/<int:game_id>/play", methods=["POST"])
def increment_play(game_id):
    result, status = incrementPlay(game_id)
    return jsonify(result), status
