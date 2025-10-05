from flask import Blueprint, request, session, jsonify, redirect, url_for
from db import (
    getPurchases,
    getUserProfile,
    createPurchase,
    getPurchasable,
    updateUserProfile,
    getGame,
    saveGame,
    addGamePurchase,
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
    game_id = data.get("game_id")
    if item_id == 9 and not game_id:
        return jsonify({"error": "No game ID provided"}), 400

    purchasable, status = getPurchasable(item_id)
    if status == 200:
        price = purchasable["price"]
        if profile["coins"] >= price:
            new_coins = profile["coins"] - price

            if item_id == 9:
                result4, status4 = getGame(game_id)
                if isinstance(result4, dict) and status4 == 200:
                    max_sprites = result4["max_sprites"] + 2
                    result5, status5 = saveGame(
                        game_id, session["userid"], max_sprites=max_sprites
                    )
                else:
                    return jsonify({"error": "Game not found."}), 404

            if item_id == 10:
                print(item_id)
                result4, status4 = getGame(game_id)
                if isinstance(result4, dict) and status4 == 200:
                    result5, status5 = addGamePurchase(game_id, 10)
                    print(result5, status5)
                else:
                    return jsonify({"error": "Game not found."}), 404

            result3, status3 = updateUserProfile(session["userid"], coins=new_coins)
            result, status = createPurchase(session["userid"], item_id)
            return jsonify(result), status
        else:
            return jsonify({"error": "You cannot afford this."}), 400
    else:
        return jsonify({purchasable}), status
