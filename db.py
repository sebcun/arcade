import sqlite3
import json
import os
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from utils import cleanEmail, cleanUsername, cleanPassword


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
