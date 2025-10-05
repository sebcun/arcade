from flask import Blueprint, session, request, jsonify, redirect, url_for
from db import updateUserProfile, getUserProfile, getPurchases

edit_profile_bp = Blueprint("edit_profile", __name__)

ITEM_ID_TO_BACKGROUND = {
    1: "RED",
    2: "ORANGE",
    3: "YELLOW",
    4: "GREEN",
    5: "BLUE",
    6: "PURPLE",
    7: "WHITE",
    8: "BLACK",
}


def check_user_purchased(user_id, avatar_background):
    if avatar_background == "GREY":
        return True

    purchases, status = getPurchases(user_id)
    if status != 200:
        return False

    purchased_items = set(purchase["item_id"] for purchase in purchases)

    for item_id, background in ITEM_ID_TO_BACKGROUND.items():
        if background == avatar_background and item_id in purchased_items:
            return True

    return False


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

        if avatar_background is not None:
            if not check_user_purchased(session["userid"], avatar_background):
                avatar_background = "GREY"

        result, status = updateUserProfile(
            session["userid"],
            username=username,
            avatar=avatar,
            avatar_background=avatar_background,
        )
        return jsonify(result), status

    return jsonify({"error": "Not logged in"}), 401
