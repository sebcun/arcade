from flask import Blueprint, jsonify
from db import getUserProfile

profile_bp = Blueprint("profile", __name__)


@profile_bp.route("/profile/<userid>", methods=["GET"])
def profile(userid):
    profile = getUserProfile(userid)
    if profile:
        profile = {k: v for k, v in profile.items() if k != "email"}
        return jsonify(profile), 200
    return jsonify({"error": "Profile not found"}), 404
