import sqlite3
import json
import os
import base64
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from utils import cleanEmail, cleanUsername, cleanPassword
from PIL import Image
from io import BytesIO


def getDbConnection():
    dbPath = os.environ.get('DB_PATH')
    
    # Fallback to local database for testing
    if not dbPath:
        dbPath = 'database.db'
    
    # Ensure folder exists
    if os.path.dirname(dbPath):
        os.makedirs(os.path.dirname(dbPath), exist_ok=True)
    
    conn = sqlite3.connect(dbPath)
    conn.row_factory = sqlite3.Row
    return conn

def initDb():
    conn = getDbConnection()

    # Users table
    conn.execute('''CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        email TEXT UNIQUE NOT NULL,
                        username TEXT UNIQUE NOT NULL,
                        password TEXT NOT NULL
                    )''')

    # Profiles table
    conn.execute('''CREATE TABLE IF NOT EXISTS profiles (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        avatar TEXT,
                        level INTEGER DEFAULT 1,
                        bio TEXT,
                        badges TEXT DEFAULT "[]",
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id)
                    )''')
    
    # Games table
    conn.execute('''CREATE TABLE IF NOT EXISTS games (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        title TEXT NOT NULL,
                        description TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id)
                 )''')


    conn.commit()
    conn.close()

def registerUser(email, username, password):
    if not email or not username or not password:
        return {"error": "Email, username, and password required."}, 400
    
    cleanedEmail = cleanEmail(email)
    cleanedUsername = cleanUsername(username)
    cleanedPassword = cleanPassword(password)
    
    if any(x is False for x in [cleanedEmail, cleanedUsername, cleanedPassword]):
        return {"error": "Invalid email, username, or password."}, 400
    
    hashedPassword = generate_password_hash(cleanedPassword)
    conn = getDbConnection()

    try:
        if conn.execute('SELECT id FROM users WHERE email = ?', (cleanedEmail,)).fetchone():
            return {"error": "An account with this email already exists. Try logging in."}, 409
        if conn.execute('SELECT id FROM users WHERE username = ?', (cleanedUsername,)).fetchone():
            return {"error": "An account with this username already exists."}, 409
        
        cursor = conn.execute('INSERT INTO users (email, username, password) VALUES (?, ?, ?)',
                              (cleanedEmail, cleanedUsername, hashedPassword))
        userid = cursor.lastrowid
        conn.execute('INSERT INTO profiles (user_id) VALUES (?)', (userid,))
        conn.commit()
        return {"message": "User registered successfully.", "userid": userid}, 201
    except sqlite3.IntegrityError:
        return {"error": "Username or email already exists"}, 409
    finally:
        conn.close()

def loginUser(email, password):
    if not email or not password:
        return {"error": "Email and password required"}, 400
    
    cleanedEmail = cleanEmail(email)
    cleanedPassword = cleanPassword(password)
    
    if any(x is False for x in [cleanedEmail, cleanedPassword]):
        return {"error": "Invalid email or password."}, 400
    
    conn = getDbConnection()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (cleanedEmail,)).fetchone()
    conn.close()
    
    if user and check_password_hash(user['password'], cleanedPassword):
        return {"message": "Login successful", "userid": user['id']}, 200
    else:
        return {"error": "Invalid credentials"}, 401

def getUserProfile(userid):
    conn = getDbConnection()
    user = conn.execute('SELECT id, email, username FROM users WHERE id = ?', (userid,)).fetchone()
    profile = conn.execute('SELECT avatar, level, bio, created_at, badges FROM profiles WHERE user_id = ?', (userid,)).fetchone()
    conn.close()
    
    if user and profile:
        return {
            "id": user['id'],
            "email": user['email'],
            "username": user['username'],
            "avatar": profile['avatar'],
            "level": profile['level'],
            "bio": profile['bio'],
            "created_at": profile['created_at'],
            "badges": profile['badges']
        }
    return None

def updateUserProfile(userid, avatar=None, level=None, bio=None, badges=None, username=None):
    if not userid:
        return {"error": "User ID required."}, 400
    
    conn = getDbConnection()
    profile = conn.execute('SELECT id FROM profiles WHERE user_id = ?', (userid,)).fetchone()
    if not profile:
        conn.close()
        return {"error": "Profile not found."}, 404
    
    if username is not None:
        cleanedUsername = cleanUsername(username)
        if not cleanedUsername:
            conn.close()
            return {"error": "Invalid username."}, 400
        
        existing = conn.execute('SELECT id FROM users WHERE username = ? AND id != ?', (cleanedUsername, userid)).fetchone()
        if existing:
            conn.close()
            return {"error": "Username already exists."}, 409
        
        conn.execute('UPDATE users SET username = ? WHERE id = ?', (cleanedUsername, userid))
    
    updates = []
    params = []
    if avatar is not None:
        updates.append('avatar = ?')
        params.append(avatar)
    if level is not None:
        updates.append('level = ?')
        params.append(level)
    if bio is not None:
        updates.append('bio = ?')
        params.append(bio)
    if badges is not None:
        updates.append('badges = ?')
        params.append(badges)

    if not updates:
        if username:
            conn.commit()
            return {"message": "Profile updated."}, 200
        conn.close()
        return {"error": "No fields to update."}, 400
    
    query = f'UPDATE profiles SET {",".join(updates)} WHERE user_id = ?'
    params.append(userid)

    try:
        conn.execute(query, params)
        conn.commit()
        return {"message": "Profile updated."}, 200
    except Exception as e:
        return {"error": f"Profile update failed: {str(e)}"}, 500
    finally:
        conn.close() 

def giveBadge(userid, badgeid, badgeName, badgeDescription, createdAt=None):
    if not userid or not badgeid or not badgeName or not badgeDescription:
        return {"error": "User ID, badge ID, name, and description are required."}, 400
    
    if createdAt is None:
        createdAt = datetime.now().isoformat()
    
    conn = getDbConnection()
    profile = conn.execute('SELECT badges FROM profiles WHERE user_id = ?', (userid,)).fetchone()
    if not profile:
        conn.close()
        return {"error": "Profile not found."}, 404
    
    try:
        badges = json.loads(profile['badges']) if profile['badges'] else []
    except json.JSONDecodeError:
        badges = [] 
    
    if any(badge[0] == badgeid for badge in badges):
        conn.close()
        return {"message": "Badge given."}, 200
    
    newBadge = [badgeid, badgeName, badgeDescription, createdAt]
    badges.append(newBadge)
    
    updatedBadges = json.dumps(badges)
    result, status = updateUserProfile(userid, badges=updatedBadges)
    if status == 200:
        return {"message": "Badge given."}, 200
    return result, status

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
            'INSERT INTO games (user_id, title, description) VALUES (?, ?, ?)',
            (user_id, title, description)
        )
        game_id = cursor.lastrowid
        conn.commit()
        
        game_dir = f"static/games/{game_id}"
        os.makedirs(game_dir, exist_ok=True)
        
        with open(f"{game_dir}/code.ar", 'w') as f:
            f.write("")
            
        
        with open(f"{game_dir}/sprites.json", 'w') as f:
            json.dump([], f)
            
        return {"message": "Game created successfully", "game_id": game_id}, 201
    except sqlite3.IntegrityError:
        return {"error": "Failed to create game"}, 400
    finally:
        conn.close()
        
def getUserGames(user_id):
    if not user_id:
        return {"error": "User ID is requred"}, 400
    
    conn = getDbConnection()
    games = conn.execute(
        'SELECT id, title, description, created_at, updated_at FROM games WHERE user_id = ? ORDER BY updated_at DESC',
        (user_id,)
    ).fetchall()
    conn.close()
    
    
    return [{
        "id": game['id'],
        "title": game['title'],
        "description": game['description'],
        "created_at": game['created_at'],
        "updated_at": game['updated_at']
    } for game in games], 200
    
def getGame(game_id, user_id):
    if not game_id or not user_id:
        return {"error": "Game ID and User ID are requred"}, 400
    
    conn = getDbConnection()
    game = conn.execute(
        'SELECT * FROM games WHERE id = ? AND user_id = ?',
        (game_id,user_id)
    ).fetchone()
    conn.close()
    
    if not game:
        return {"error": "Game not found"}, 404
    
    game_dir = f"static/games/{game_id}"
    code_content = ""
    sprites = []
    
    try:
        if os.path.exists(f"{game_dir}/code.ar"):
            with open(f"{game_dir}/code.ar", 'r') as f:
                code_content = f.read()
                
        if os.path.exists(f"{game_dir}/sprites.json"):
            with open(f"{game_dir}/sprites.json", 'r') as f:
                sprites = json.load(f)
            
    except Exception as e:
        print(f"Error loading game files: {e}")
        
    return {
        "id": game["id"],
        "title": game["title"],
        "description": game["description"], 
        "created_at": game["created_at"],
        "updated_at": game["updated_at"],
        "code": code_content,
        "sprites": sprites
    }, 200
    
def saveGame(game_id, user_id, code="", sprites_data=None):
    if not game_id or not user_id:
        return {"error": "Game ID and User ID are requred"}, 400
    
    conn = getDbConnection()
    game = conn.execute(
        'SELECT id FROM games WHERE id = ? AND user_id = ?',
        (game_id, user_id)
    ).fetchone()
    
    if not game:
        conn.close()
        return {"error": "Game not found"}, 404
    
    try:
        conn.execute(
            'UPDATE games SET updated_at = CURRENT_TIMESTAMP where id = ?',
            (game_id,)
        )
        conn.commit()
        
        game_dir = f"static/games/{game_id}"
        
        os.makedirs(game_dir, exist_ok=True)
        
        with open(f"{game_dir}/code.ar", 'w') as f:
            f.write(code)
            
        if sprites_data:
            with open(f"{game_dir}/sprites.json", 'w') as f:
                json.dump(sprites_data, f)
        else:
            with open(f"{game_dir}/sprites.json", 'w') as f:
                json.dump([], f)
                
        return {"message": "Game saved successfully"}, 200
        
    except Exception as e:
        return {"error": "failed to save game"}, 400
    finally:
        conn.close()