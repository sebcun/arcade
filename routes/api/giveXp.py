from flask import Blueprint, session, request, jsonify
from db import updateUserProfile, getUserProfile

give_xp_bp = Blueprint("xp", __name__)


@give_xp_bp.route("/give_xp", methods=["POST"])
def give_xp():
    if "userid" not in session:
        return jsonify({"error": "Not logged in"}), 401

    data = request.get_json()
    xp_size = data.get("size")

    if xp_size not in ["SMALL", "MEDIUM", "LARGE"]:
        return jsonify({"error": "Invalid XP size."}), 400

    xp_add = {"SMALL": 5, "MEDIUM": 25, "LARGE": 50}[xp_size]

    profile = getUserProfile(session["userid"])
    if not profile:
        return jsonify({"error": "Profile not found"}), 404

    current_level = profile["level"]
    current_xp = profile["xp"]

    new_xp = current_xp + xp_add
    level_up = False
    while new_xp >= 100:
        new_xp -= 100
        current_level += 1
        level_up = True

    result, status = updateUserProfile(
        session["userid"], level=current_level, xp=new_xp
    )
    if status != 200:
        return jsonify(result), status

    return jsonify({"level_up": level_up}), 200
