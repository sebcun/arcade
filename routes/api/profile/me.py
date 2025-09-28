from flask import Blueprint, session, jsonify
from db import getUserProfile

me_bp = Blueprint("me", __name__)


@me_bp.route("/me", methods=["GET"])
def me():
    if "userid" in session:
        profile = getUserProfile(session["userid"])
        if profile:
            return jsonify(profile), 200
        return jsonify({"error": "Profile not found"}), 404
    return jsonify({"error": "Not logged in"}), 401
