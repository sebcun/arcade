from flask import Blueprint, request, session, jsonify
from db import getPurchases

purchases_bp = Blueprint("api_purchases", __name__)


@purchases_bp.route("/purchases", methods=["GET"])
def get_purchases():
    id = request.args.get("id")

    if id:
        purchases, status = getPurchases(id)
        return jsonify(purchases), status

    if "userid" in session:
        purchases, status = getPurchases(session["userid"])
        return jsonify(purchases), status

    return jsonify({"error": "Not logged in"}), 401
