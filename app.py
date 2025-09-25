from flask import Flask, render_template, request, jsonify, session, redirect
from db import (
    initDb,
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    giveBadge,
)
from utils import *
import os

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "YourSecretKey")

initDb()


@app.route("/")
def index():
    websiteURL = os.getenv("WEBSITE", "https://arcade.sebcun.com")

    if "email" in session:
        return render_template("index.html", LOGGEDIN=True, WEBSITE=websiteURL)
    return render_template("index.html", LOGGEDIN=False, WEBSITE=websiteURL)

@app.route("/docs")
def docs():
    websiteURL = os.getenv("WEBSITE", "https://arcade.sebcun.com")

    if "email" in session:
        return render_template("docs.html", LOGGEDIN=True, WEBSITE=websiteURL)
    return render_template("docs.html", LOGGEDIN=False, WEBSITE=websiteURL)


@app.route("/create")
def create():
    websiteURL = os.getenv("WEBSITE", "https://arcade.sebcun.com")

    if "email" in session:
        return render_template("create.html", LOGGEDIN=True, WEBSITE=websiteURL)
    return render_template("create.html", LOGGEDIN=False, WEBSITE=websiteURL)


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


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
