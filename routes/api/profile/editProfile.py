from flask import Blueprint, session, request, jsonify, redirect, url_for
from db import updateUserProfile, getUserProfile

edit_profile_bp = Blueprint("edit_profile", __name__)


@edit_profile_bp.route("/edit_profile", methods=["POST"])
def edit_profile():
    if "userid" in session:

        # Checks if the user profile still exists, if not log out
        profile = getUserProfile(session["userid"])
        if not profile:
            return redirect(url_for("logout.logout"))

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
