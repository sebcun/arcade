import sqlite3
import json
import os
import base64
import random
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from utils import cleanEmail, cleanUsername
from PIL import Image
from io import BytesIO
import emailUtils
import time

AZURE_DATA_PATH = "/home/data"
IS_AZURE = os.path.exists(AZURE_DATA_PATH)

DATA_ROOT = os.environ.get("DATA_ROOT") or (
    AZURE_DATA_PATH if IS_AZURE else os.getcwd()
)
DB_PATH = os.environ.get("DB_PATH") or (
    os.path.join(DATA_ROOT, "database.db") if IS_AZURE else "database.db"
)
GAMES_DIR = os.environ.get("GAMES_DIR") or (
    os.path.join(DATA_ROOT, "games") if IS_AZURE else os.path.join("static", "games")
)

try:
    db_parent = os.path.dirname(DB_PATH)
    if db_parent:
        os.makedirs(db_parent, exist_ok=True)
    os.makedirs(GAMES_DIR, exist_ok=True)
except Exception as e:
    print()


def getDbConnection():
    dbPath = os.environ.get("DB_PATH") or DB_PATH

    # Ensure parent folder exists
    parent = os.path.dirname(dbPath)
    if parent:
        try:
            os.makedirs(parent, exist_ok=True)
        except Exception as e:
            print()

    conn = sqlite3.connect(dbPath)
    conn.row_factory = sqlite3.Row
    return conn


def initDb():
    conn = getDbConnection()

    # Users table
    conn.execute(
        """CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        email TEXT UNIQUE NOT NULL,
                        username TEXT UNIQUE NOT NULL
                    )"""
    )

    # Profiles table
    conn.execute(
        """CREATE TABLE IF NOT EXISTS profiles (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        avatar TEXT,
                        avatar_background TEXT DEFAULT "GREY",
                        avatar_border TEXT DEFAULT "NONE",
                        level INTEGER DEFAULT 1,
                        bio TEXT,
                        badges TEXT DEFAULT "[]",
                        created_at INTEGER DEFAULT (CAST(strftime('%s', 'now') AS INTEGER)),
                        FOREIGN KEY (user_id) REFERENCES users(id)
                    )"""
    )

    # Games table
    conn.execute(
        """CREATE TABLE IF NOT EXISTS games (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        title TEXT NOT NULL,
                        description TEXT,
                        created_at INTEGER DEFAULT (CAST(strftime('%s', 'now') AS INTEGER)),
                        updated_at INTEGER DEFAULT (CAST(strftime('%s', 'now') AS INTEGER)),
                        FOREIGN KEY (user_id) REFERENCES users(id)
                 )"""
    )

    # Verifications table
    conn.execute(
        """CREATE TABLE IF NOT EXISTS verifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                username TEXT,
                code TEXT NOT NULL,
                mode TEXT NOT NULL, -- 'register' or 'login'
                created_at INTEGER DEFAULT (CAST(strftime('%s', 'now') AS INTEGER)),
                expires_at TIMESTAMP NOT NULL
            )"""
    )

    # Likes table
    conn.execute(
        """CREATE TABLE IF NOT EXISTS likes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                created_at INTEGER DEFAULT (CAST(strftime('%s', 'now') AS INTEGER)),
                UNIQUE(game_id, user_id),
                FOREIGN KEY (game_id) REFERENCES games(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )"""
    )

    conn.commit()
    conn.close()


# Helper Functions
def _generate_code():
    return f"{random.randint(100000, 999999):06d}"


def _generate_fallback_username(conn):
    for _ in range(10):
        candidate = f"user{random.randint(100000000, 999999999)}"
        if not conn.execute(
            "SELECT id FROM users WHERE username = ?", (candidate,)
        ).fetchone():
            return candidate
    return f"user{random.getrandbits(64)}"


def _now_unix():
    return int(datetime.utcnow().timestamp())


def _parse_timestamp(value):
    if value is None:
        return None
    try:
        return int(value)
    except Exception:
        pass
    try:
        dt = datetime.fromisoformat(value)
        return int(dt.timestamp())
    except Exception:
        pass
    return None


def sendVerificationCode(email, username=None, mode="register"):
    if not email or not mode:
        return {"error": "Email and mode required."}, 400

    cleanedEmail = cleanEmail(email)
    if cleanedEmail is False:
        return {"error": "Invalid email."}, 400

    conn = getDbConnection()
    try:
        stored_username = None

        if mode == "register":

            if not username:
                conn.close()
                return {"error": "Username required."}, 400
            cleanedUsername = cleanUsername(username)
            if cleanedUsername is False:
                conn.close()
                return {"error": "Invalid username."}, 400

            stored_username = cleanedUsername

            if conn.execute(
                "SELECT id FROM users WHERE email = ?", (cleanedEmail,)
            ).fetchone():
                conn.close()
                return {
                    "error": "An account with this email already exists. Try logging in."
                }, 409

            if conn.execute(
                "SELECT id FROM users WHERE username = ?", (cleanedUsername,)
            ).fetchone():
                conn.close()
                return {"error": "An account with this username already exists."}, 409

        elif mode == "login":
            if not conn.execute(
                "SELECT id FROM users WHERE email = ?", (cleanedEmail,)
            ).fetchone():
                conn.close()
                return {"message": "Verification code sent."}, 200
        else:
            conn.close()
            return {"error": "Invalid mode."}, 400

        conn.execute(
            "DELETE FROM verifications WHERE email = ? AND mode = ?",
            (cleanedEmail, mode),
        )

        code = _generate_code()
        expires_at = int((datetime.utcnow() + timedelta(minutes=5)).timestamp())

        conn.execute(
            "INSERT INTO verifications (email, username, code, mode, expires_at) VALUES (?, ?, ?, ?, ?)",
            (cleanedEmail, stored_username, code, mode, expires_at),
        )
        conn.commit()
        conn.close()

        emailUtils.send(cleanedEmail, code)

        return {"message": "Verification code sent."}, 200

    except Exception as e:
        try:
            conn.close()
        except Exception:
            pass
        return {"error": "Failed to send verification code."}, 500


def verifyCode(email, code, mode="register"):
    if not email or not code or not mode:
        return {"error": "Email, code, and mode are required."}, 400

    cleanedEmail = cleanEmail(email)
    if cleanedEmail is False:
        return {"error": "Invalid email."}, 400

    conn = getDbConnection()
    try:
        row = conn.execute(
            "SELECT * FROM verifications WHERE email = ? AND code = ? AND mode = ?",
            (cleanedEmail, str(code), mode),
        ).fetchone()

        if not row:
            conn.close()
            return {"error": "Invalid verification code."}, 400

        expires_at = _parse_timestamp(row["expires_at"])
        if expires_at is None:
            conn.execute("DELETE FROM verifications WHERE id = ?", (row["id"],))
            conn.commit()
            conn.close()
            return {"error": "Verification code invalid or expired."}, 400

        if _now_unix() > expires_at:
            conn.execute("DELETE FROM verifications WHERE id = ?", (row["id"],))
            conn.commit()
            conn.close()
            return {"error": "Verification code expired."}, 400

        if mode == "register":
            if conn.execute(
                "SELECT id FROM users WHERE email = ?", (cleanedEmail,)
            ).fetchone():
                conn.execute("DELETE FROM verifications WHERE id = ?", (row["id"],))
                conn.commit()
                conn.close()
                return {"error": "Email already associated with an account."}, 409

            desired_username = row["username"]
            final_username = desired_username

            if conn.execute(
                "SELECT id FROM users WHERE username = ?", (desired_username,)
            ).fetchone():
                final_username = _generate_fallback_username(conn)

            try:
                cursor = conn.execute(
                    "INSERT INTO users (email, username) VALUES (?, ?)",
                    (cleanedEmail, final_username),
                )
                user_id = cursor.lastrowid
                conn.execute(
                    "INSERT INTO profiles (user_id, avatar, level, bio, badges) VALUES (?, ?, ?, ?, ?)",
                    (user_id, None, 1, None, json.dumps([])),
                )
                conn.execute(
                    "DELETE FROM verifications WHERE email = ? AND mode = ?",
                    (cleanedEmail, mode),
                )
                conn.commit()
                conn.close()
                return {
                    "message": "Account created and verified.",
                    "userid": user_id,
                    "username": final_username,
                }, 201
            except sqlite3.IntegrityError as e:
                conn.execute("DELETE FROM verifications WHERE id = ?", (row["id"],))
                conn.commit()
                conn.close()
                return {
                    "error": "Failed to create user; username or email may be taken."
                }, 500

        else:
            # login
            user = conn.execute(
                "SELECT id FROM users WHERE email = ?", (cleanedEmail,)
            ).fetchone()
            if not user:
                conn.execute("DELETE FROM verifications WHERE id = ?", (row["id"],))
                conn.commit()
                conn.close()
                return {"error": "No account found for that email."}, 404

            user_id = user["id"]
            conn.execute(
                "DELETE FROM verifications WHERE email = ? AND mode = ?",
                (cleanedEmail, mode),
            )
            conn.commit()
            conn.close()
            return {"message": "Logged in via code.", "userid": user_id}, 200

    except Exception as e:
        try:
            conn.close()
        except Exception:
            pass
        return {"error": "Failed to verify code."}, 500


def getUserProfile(userid_or_email):
    if not userid_or_email:
        return None

    conn = getDbConnection()

    if isinstance(userid_or_email, str) and "@" in userid_or_email:
        profile_row = conn.execute(
            "SELECT p.*, u.username, u.email FROM profiles p JOIN users u ON p.user_id = u.id WHERE u.email = ?",
            (userid_or_email,),
        ).fetchone()
    else:
        try:
            uid = int(userid_or_email)
        except Exception:
            conn.close()
            return None

        profile_row = conn.execute(
            "SELECT p.*, u.username, u.email FROM profiles p JOIN users u ON p.user_id = u.id WHERE p.user_id = ?",
            (uid,),
        ).fetchone()

    conn.close()

    if not profile_row:
        return None

    try:
        badges = json.loads(profile_row["badges"]) if profile_row["badges"] else []
    except Exception:
        badges = []

    return {
        "id": profile_row["user_id"],
        "user_id": profile_row["user_id"],
        "username": profile_row["username"],
        "email": profile_row["email"],
        "avatar": profile_row["avatar"],
        "avatar_background": profile_row["avatar_background"],
        "avatar_border": profile_row["avatar_border"],
        "level": profile_row["level"],
        "bio": profile_row["bio"],
        "badges": badges,
        "created_at": profile_row["created_at"],
    }


def updateUserProfile(
    userid,
    avatar=None,
    avatar_background=None,
    avatar_border=None,
    level=None,
    bio=None,
    badges=None,
    username=None,
):
    if not userid:
        return {"error": "User ID is required."}, 400

    conn = getDbConnection()
    try:
        if username:
            cleaned = cleanUsername(username)
            if cleaned is False:
                conn.close()
                return {"error": "Invalid username."}, 400
            existing = conn.execute(
                "SELECT id FROM users WHERE username = ? AND id != (SELECT id FROM users WHERE email = (SELECT email FROM users WHERE id = ?))",
                (cleaned, userid),
            ).fetchone()
            other = conn.execute(
                "SELECT id FROM users WHERE username = ? AND id != ?", (cleaned, userid)
            ).fetchone()
            if other:
                conn.close()
                return {"error": "Username already taken."}, 409
            conn.execute(
                "UPDATE users SET username = ? WHERE id = ?", (cleaned, userid)
            )

        profile = conn.execute(
            "SELECT * FROM profiles WHERE user_id = ?", (userid,)
        ).fetchone()
        if not profile:
            conn.execute(
                "INSERT INTO profiles (user_id, avatar, level, bio, badges) VALUES (?, ?, ?, ?, ?)",
                (userid, avatar, level or 1, bio or None, json.dumps(badges or [])),
            )
        else:
            if avatar is not None:
                conn.execute(
                    "UPDATE profiles SET avatar = ? WHERE user_id = ?", (avatar, userid)
                )
            if avatar_background is not None:
                conn.execute(
                    "UPDATE profiles SET avatar_background = ? WHERE user_id = ?",
                    (avatar_background, userid),
                )
            if avatar_border is not None:
                conn.execute(
                    "UPDATE profiles SET avatar_border = ? WHERE user_id = ?",
                    (avatar_border, userid),
                )
            if level is not None:
                conn.execute(
                    "UPDATE profiles SET level = ? WHERE user_id = ?", (level, userid)
                )
            if bio is not None:
                conn.execute(
                    "UPDATE profiles SET bio = ? WHERE user_id = ?", (bio, userid)
                )
            if badges is not None:
                try:
                    b = json.dumps(badges)
                except Exception:
                    b = json.dumps([])
                conn.execute(
                    "UPDATE profiles SET badges = ? WHERE user_id = ?", (b, userid)
                )

        conn.commit()
        conn.close()
        return {"message": "Profile updated"}, 200
    except Exception as e:
        conn.close()
        return {"error": "Failed to update profile"}, 500


def giveBadge(userid, badgeid, badgeName, badgeDescription, createdAt=None):
    if not userid or not badgeid or not badgeName or not badgeDescription:
        return {"error": "User ID, badge ID, name, and description are required."}, 400

    if createdAt is None:
        createdAt = _now_unix()

    conn = getDbConnection()
    profile = conn.execute(
        "SELECT badges FROM profiles WHERE user_id = ?", (userid,)
    ).fetchone()
    if not profile:
        conn.close()
        return {"error": "Profile not found."}, 404

    try:
        badges = json.loads(profile["badges"]) if profile["badges"] else []
    except json.JSONDecodeError:
        badges = []

    if any(badge[0] == badgeid for badge in badges):
        conn.close()
        return {"message": "Badge given."}, 200

    newBadge = [badgeid, badgeName, badgeDescription, createdAt]
    badges.append(newBadge)

    updatedBadges = json.dumps(badges)
    conn.execute(
        "UPDATE profiles SET badges = ? WHERE user_id = ?", (updatedBadges, userid)
    )
    conn.commit()
    conn.close()
    return {"message": "Badge given."}, 200


def createGame(user_id, title, description=""):
    if not user_id or not title:
        return {"error": "User ID and title are required"}, 400

    if len(title) > 100:
        return {"error": "Title must be 100 characters or less"}, 400

    if len(description) > 500:
        return {"error": "Description must be 500 characters or less"}, 400

    conn = getDbConnection()
    try:
        cursor = conn.execute(
            "INSERT INTO games (user_id, title, description) VALUES (?, ?, ?)",
            (user_id, title, description),
        )
        game_id = cursor.lastrowid
        conn.commit()

        game_dir = os.path.join(GAMES_DIR, str(game_id))
        os.makedirs(game_dir, exist_ok=True)

        with open(os.path.join(game_dir, "code.ar"), "w", encoding="utf-8") as f:
            f.write("")

        with open(os.path.join(game_dir, "sprites.json"), "w", encoding="utf-8") as f:
            json.dump([], f)

        return {"message": "Game created successfully", "game_id": game_id}, 201
    except sqlite3.IntegrityError:
        conn.close()
        return {"error": "Failed to create game"}, 400
    except Exception as e:
        conn.close()
        return {"error": "Failed to create game"}, 500
    finally:
        try:
            conn.close()
        except Exception:
            pass


def getAllGames():
    conn = getDbConnection()
    games = conn.execute(
        "SELECT id, title, user_id, description, created_at, updated_at FROM games ORDER BY updated_at DESC"
    ).fetchall()
    conn.close()

    return [
        {
            "id": game["id"],
            "title": game["title"],
            "author": game["user_id"],
            "description": game["description"],
            "created_at": game["created_at"],
            "updated_at": game["updated_at"],
        }
        for game in games
    ], 200


def getGame(game_id):
    if not game_id:
        return {"error": "Game ID is requred"}, 400

    conn = getDbConnection()
    game = conn.execute("SELECT * FROM games WHERE id = ?", (game_id,)).fetchone()
    conn.close()

    if not game:
        return {"error": "Game not found"}, 404

    game_dir = os.path.join(GAMES_DIR, str(game_id))
    code_content = ""
    sprites = []

    try:
        code_path = os.path.join(game_dir, "code.ar")
        sprites_path = os.path.join(game_dir, "sprites.json")

        if os.path.exists(code_path):
            with open(code_path, "r", encoding="utf-8") as f:
                code_content = f.read()

        if os.path.exists(sprites_path):
            with open(sprites_path, "r", encoding="utf-8") as f:
                sprites = json.load(f)
    except:
        print()

    return {
        "id": game["id"],
        "title": game["title"],
        "description": game["description"],
        "created_at": game["created_at"],
        "updated_at": game["updated_at"],
        "code": code_content,
        "sprites": sprites,
    }, 200


def saveGame(game_id, user_id, code="", sprites_data=None):
    if not game_id or not user_id:
        return {"error": "Game ID and User ID are requred"}, 400

    conn = getDbConnection()
    game = conn.execute(
        "SELECT id FROM games WHERE id = ? AND user_id = ?", (game_id, user_id)
    ).fetchone()

    if not game:
        conn.close()
        return {"error": "Game not found"}, 404

    try:
        conn.execute(
            "UPDATE games SET updated_at = CAST(strftime('%s', 'now') AS INTEGER) where id = ?",
            (game_id,),
        )
        conn.commit()

        game_dir = os.path.join(GAMES_DIR, str(game_id))
        os.makedirs(game_dir, exist_ok=True)

        with open(os.path.join(game_dir, "code.ar"), "w", encoding="utf-8") as f:
            f.write(code)

        if sprites_data:
            with open(
                os.path.join(game_dir, "sprites.json"), "w", encoding="utf-8"
            ) as f:
                json.dump(sprites_data, f)
        else:
            if not os.path.exists(os.path.join(game_dir, "sprites.json")):
                with open(
                    os.path.join(game_dir, "sprites.json"), "w", encoding="utf-8"
                ) as f:
                    json.dump([], f)

        return {"message": "Game saved successfully"}, 200

    except Exception as e:
        return {"error": "failed to save game"}, 400
    finally:
        try:
            conn.close()
        except Exception:
            pass


def createUser(email):
    if not email:
        return {"error": "Email required."}, 400

    cleanedEmail = cleanEmail(email)
    if cleanedEmail is False:
        return {"error": "Invalid email."}, 400

    conn = getDbConnection()
    try:
        final_username = _generate_fallback_username(conn)
        cursor = conn.execute(
            "INSERT INTO users (email, username) VALUES (?, ?)",
            (cleanedEmail, final_username),
        )
        user_id = cursor.lastrowid

        conn.execute(
            "INSERT INTO profiles (user_id, avatar, level, bio, badges) VALUES (?, ?, ?, ?, ?)",
            (user_id, None, 1, None, json.dumps([])),
        )
        conn.commit()
        conn.close()

        return {
            "message": "Account created.",
            "userid": user_id,
            "username": final_username,
        }, 201

    except sqlite3.IntegrityError:
        try:
            conn.close()
        except Exception:
            pass
        return {"error": "Failed to create user; username or email may be taken."}, 500
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        return {"error": "Failed to create user."}, 500


def getLikesForGame(game_id):
    try:
        conn = getDbConnection()
        row = conn.execute(
            "SELECT COUNT(*) AS cnt FROM likes WHERE game_id = ?", (game_id,)
        ).fetchone()
        conn.close()
        return int(row["cnt"]) if row else 0
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        return 0


def userLikedGame(game_id, user_id):
    if not game_id or not user_id:
        return False
    try:
        conn = getDbConnection()
        row = conn.execute(
            "SELECT 1 FROM likes WHERE game_id = ? AND user_id = ?", (game_id, user_id)
        ).fetchone()
        conn.close()
        return bool(row)
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        return False


def toggleLike(game_id, user_id):
    if not game_id or not user_id:
        return {"error": "Game ID and User ID are required."}, 400

    conn = getDbConnection()

    try:
        game = conn.execute("SELECT id FROM games WHERE id = ?", (game_id,)).fetchone()
        if not game:
            conn.close()
            return {"error": "Game not found."}, 404

        existing = conn.execute(
            "SELECT id FROM likes WHERE game_id = ? AND user_id = ?", (game_id, user_id)
        ).fetchone()

        if existing:
            conn.execute("DELETE FROM likes WHERE id = ?", (existing["id"],))
            conn.commit()
            liked = False

        else:
            conn.execute(
                "INSERT INTO likes (game_id, user_id) VALUES (?, ?)", (game_id, user_id)
            )
            conn.commit()
            liked = True

        row = conn.execute(
            "SELECT COUNT(*) AS cnt FROM likes WHERE game_id = ?", (game_id,)
        ).fetchone()
        count = int(row["cnt"]) if row else 0
        conn.close()
        return {"likes": count, "liked": liked}, 200

    except Exception as e:
        print(e)

        try:
            conn.close()
        except Exception:
            pass
        return {"error": "Failed to toggle like."}, 500
