from flask import Blueprint, session, request, jsonify, redirect, url_for
from db import getGame, getAllGlobalVariables, setGlobalVariable

variables_bp = Blueprint("api_games_variables", __name__)


@variables_bp.route("/games/<int:game_id>/variables/global", methods=["GET"])
def get_global_variables(game_id):

    result, status = getGame(game_id)
    if status != 200:
        return jsonify({"error": "Game not found"}), 404

    variables, status = getAllGlobalVariables(game_id)
    return jsonify({"variables": variables}), status


@variables_bp.route("/games/<int:game_id>/variables/global", methods=["POST"])
def set_global_variable(game_id):

    result, status = getGame(game_id)
    if status != 200:
        return jsonify({"error": "Game not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    var_name = data.get("var_name")
    var_value = data.get("var_value")

    if not var_name:
        return jsonify({"error": "Variable name is required"}), 400

    result, status = setGlobalVariable(game_id, var_name, var_value)
    return jsonify(result), status
