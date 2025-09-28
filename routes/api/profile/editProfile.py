from flask import Blueprint, session, request, jsonify
from db import updateUserProfile

edit_profile_bp = Blueprint("edit_profile", __name__)


@edit_profile_bp.route("/edit_profile", methods=["POST"])
def edit_profile():
    if "userid" in session:
        data = request.get_json()
        username = data.get("username")
        avatar = data.get("avatar")
        avatar_background = data.get("avatar_background")
        result, status = updateUserProfile(
            session["userid"],
            username=username,
            avatar=avatar,
            avatar_background=avatar_background,
        )
        return jsonify(result), status

    return jsonify({"error": "Not logged in"}), 401
