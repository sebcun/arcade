from flask import Blueprint, request, session, jsonify
from db import getAllGames, createGame, getGamesSorted

games_bp = Blueprint("games", __name__)


@games_bp.route("/games", methods=["GET"])
def get_games():
    author = request.args.get("author")
    sort = request.args.get("sort")
    limit_str = request.args.get("limit")
    limit = int(limit_str) if limit_str and limit_str.isdigit() else None
    
    if sort in ['liked', 'played', 'recent']:
        games, status = getGamesSorted(sort, limit or 30)
    else:
        games, status = getAllGames()
        if limit:
            games = games[:limit]

    games, status = getAllGames()

    if not isinstance(games, list):
        return jsonify({"error": "Failed to fetch games"}), (
            status if isinstance(status, int) else 500
        )

    if author:
        try:
            author_id = int(author)
        except (TypeError, ValueError):
            if author == "me":
                if "userid" in session:
                    author_id = session["userid"]
                else:
                    return jsonify({"error": "Not logged in"}), 401
            else:
                return jsonify({"error": "Invalid author id"}), 400

        games = [g for g in games if str(g.get("author")) == str(author_id)]

    normalized = [
        {
            "id": g.get("id"),
            "title": g.get("title"),
            "author": g.get("author"),
            "description": g.get("description"),
            "created_at": g.get("created_at"),
            "updated_at": g.get("updated_at"),
        }
        for g in games
    ]

    return jsonify(normalized), status


@games_bp.route("/games", methods=["POST"])
def create_new_game():
    if "userid" not in session:
        return jsonify({"error": "Not logged in"}), 401

    data = request.get_json()
    title = data.get("title")
    description = data.get("description", "")

    result, status = createGame(session["userid"], title, description)
    return jsonify(result), status
