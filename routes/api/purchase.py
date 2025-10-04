from flask import Blueprint, request, session, jsonify, redirect, url_for
from db import (
    getPurchases,
    getUserProfile,
    createPurchase,
    getPurchasable,
    updateUserProfile,
)

purchase_bp = Blueprint("api_purchase", __name__)


@purchase_bp.route("/purchase", methods=["POST"])
def purchase():
    if "userid" not in session:
        return jsonify({"error": "Not logged in"}), 401

    # Checks if the user profile still exists, if not log out
    profile = getUserProfile(session["userid"])
    if not profile:
        return redirect(url_for("logout.logout"))

    data = request.get_json()
    item_id = data.get("item_id")

    purchasable, status = getPurchasable(item_id)
    if status == 200:
        price = purchasable["price"]
        if profile["coins"] >= price:
            new_coins = profile["coins"] - price
            result3, status3 = updateUserProfile(session["userid"], coins=new_coins)
            result, status = createPurchase(session["userid"], item_id)
            return jsonify(result), status
        else:
            return jsonify({"error": "You cannot afford this."}), 400
    else:
        return jsonify({purchasable}), status
