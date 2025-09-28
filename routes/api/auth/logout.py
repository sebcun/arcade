from flask import Blueprint, session, jsonify

logout_bp = Blueprint("logout", __name__)


@logout_bp.route("/logout", methods=["POST"])
def logout():
    session.pop("email", None)
    session.pop("userid", None)
    return jsonify({"message": "Logged out successfully"}), 200
