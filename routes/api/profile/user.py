from flask import Blueprint, jsonify, request, session
from db import getUserProfile

user_bp = Blueprint("user", __name__)


@user_bp.route("/user", methods=["GET"])
def user():

    id = request.args.get("id")

    if id:
        profile = getUserProfile(id)
        if profile:
            profile = {k: v for k, v in profile.items() if k != "email"}
            return jsonify(profile), 200

        return jsonify({"error": "Profile not found"}), 404

    if "userid" in session:
        profile = getUserProfile(session["userid"])
        if profile:
            return jsonify(profile), 200
        return jsonify({"error": "Profile not found"}), 404
    return jsonify({"error": "Not logged in"}), 401
