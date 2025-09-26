from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from db import (
    initDb,
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    giveBadge,
    createGame,
    getAllGames,
    getGame,
    saveGame,
)
from utils import *
import os

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "YourSecretKey")

initDb()


@app.route("/")
def index():
    websiteURL = os.getenv("WEBSITE", "https://arcade.sebcun.com")

    if "userid" in session:
        return render_template("index.html", LOGGEDIN=True, WEBSITE=websiteURL)
    return render_template("index.html", LOGGEDIN=False, WEBSITE=websiteURL)


@app.route("/docs")
def docs():
    websiteURL = os.getenv("WEBSITE", "https://arcade.sebcun.com")

    if "userid" in session:
        return render_template("docs.html", LOGGEDIN=True, WEBSITE=websiteURL)
    return render_template("docs.html", LOGGEDIN=False, WEBSITE=websiteURL)


@app.route("/create")
def create():
    websiteURL = os.getenv("WEBSITE", "https://arcade.sebcun.com")

    if "userid" in session:
        return render_template("create.html", LOGGEDIN=True, WEBSITE=websiteURL)
    return redirect(url_for("index") + "?login")


# Api Routes
@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email")
    username = data.get("username")
    password = data.get("password")
    result, status = registerUser(email, username, password)
    if status == 201:
        session["email"] = email
        session["userid"] = result["userid"]
        giveBadge(
            session["userid"], "siege", "Siege", "Signed up during the Siege weeks!"
        )
    return jsonify(result), status


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    result, status = loginUser(email, password)
    if status == 200:
        session["email"] = email
        session["userid"] = result["userid"]
    return jsonify(result), status


@app.route("/api/logout", methods=["POST"])
def logout():
    session.pop("email", None)
    session.pop("userid", None)
    return jsonify({"message": "Logged out successfully"}), 200


@app.route("/api/me", methods=["GET"])
def me():
    if "userid" in session:
        profile = getUserProfile(session["userid"])
        if profile:
            return jsonify(profile), 200
        return jsonify({"error": "Profile not found"}), 404
    return jsonify({"error": "Not logged in"}), 401


@app.route("/api/profile/<userid>", methods=["GET"])
def profile(userid):
    profile = getUserProfile(userid)
    if profile:
        profile = {k: v for k, v in profile.items() if k != "email"}
        return jsonify(profile), 200
    return jsonify({"error": "Profile not found"}), 404


@app.route("/api/editprofile", methods=["POST"])
def editprofile():
    if "userid" in session:
        data = request.get_json()
        username = data.get("username")
        avatar = data.get("avatar")
        result, status = updateUserProfile(
            session["userid"], username=username, avatar=avatar
        )
        return jsonify(result), status

    return jsonify({"error": "Not logged in"}), 401


@app.route("/api/images")
def get_images():
    images = []
    for root, dirs, files in os.walk("static/images"):
        for file in files:
            if file.endswith(".png"):
                rel_path = os.path.relpath(os.path.join(root, file), "static")
                images.append(rel_path.replace("\\", "/"))
    return images


@app.route("/api/games", methods=["GET"])
def get_games():

    author = request.args.get("author")

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


@app.route("/api/games", methods=["POST"])
def create_new_game():
    if "userid" not in session:
        return jsonify({"error": "Not logged in"}), 401

    data = request.get_json()
    title = data.get("title")
    description = data.get("description", "")

    result, status = createGame(session["userid"], title, description)
    return jsonify(result), status


@app.route("/api/games/<int:game_id>", methods=["GET"])
def get_game_data(game_id):
    if "userid" not in session:
        return jsonify({"error": "Not logged in"}), 401

    result, status = getGame(game_id, session["userid"])
    return jsonify(result), status


@app.route("/api/games/<int:game_id>/save", methods=["POST"])
def save_game_data(game_id):
    if "userid" not in session:
        return jsonify({"error": "Not logged in"}), 401

    data = request.get_json()
    code = data.get("code", "")
    sprites_data = data.get("sprites", [])

    result, status = saveGame(game_id, session["userid"], code, sprites_data)
    return jsonify(result), status


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
