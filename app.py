from dotenv import dotenv_values
from flask import (
    Flask,
    render_template,
    request,
    jsonify,
    session,
    redirect,
    url_for,
    abort,
    send_from_directory,
)

from db import (
    initDb,
    sendVerificationCode,
    verifyCode,
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


_env = dotenv_values(".env") or {}

for key in ("SECRET_KEY", "WEBSITE"):
    if key in _env and os.getenv(key) is None:
        os.environ[key] = _env[key]

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
@app.route("/api/send_code", methods=["POST"])
def api_send_code():
    data = request.get_json() or {}
    email = data.get("email")
    mode = data.get("mode", "register")
    username = data.get("username")

    result, status = sendVerificationCode(email, username=username, mode=mode)
    return jsonify(result), status


@app.route("/api/verify_code", methods=["POST"])
def api_verify_code():
    data = request.get_json() or {}
    email = data.get("email")
    code = data.get("code")
    mode = data.get("mode", "register")

    result, status = verifyCode(email, code, mode=mode)

    if (
        status == 201
        and mode == "register"
        and isinstance(result, dict)
        and result.get("userid")
    ):
        session["email"] = email
        session["userid"] = result["userid"]
        try:
            giveBadge(
                session["userid"], "siege", "Siege", "Signed up during the Siege weeks!"
            )
        except Exception:
            pass

    if (
        status == 200
        and mode == "login"
        and isinstance(result, dict)
        and result.get("userid")
    ):
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


@app.route("/static/<path:filename>")
def static_files(filename):
    static_dir = os.path.join(app.root_path, "static")
    full_path = os.path.normpath(os.path.join(static_dir, filename))
    if not full_path.startswith(os.path.abspath(static_dir)):
        return abort(404)
    if not os.path.exists(full_path):
        return abort(404)
    return send_from_directory(static_dir, filename)


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
