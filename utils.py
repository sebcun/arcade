import re

def cleanEmail(email: str):
    if not isinstance(email, str):
        return False
    
    email = email.strip().lower().replace(" ", "")

    pattern = r"^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
    if re.match(pattern, email):
        return email
    else:
        return False
    
def cleanUsername(username: str):
    if not isinstance(username, str):
        return False
    
    username = username.strip().lower().replace(" ", "")
    
    if not re.match(r"^[a-z0-9]+$", username):
        return False
    
    if 3 < len(username) < 21:
        return username
    return False

def cleanPassword(password: str):
    if not isinstance(password, str):
        return False
    
    password = password.strip().replace(" ", "")
    
    if len(password) < 6 or len(password) > 255:
        return False
    
    if (re.search(r"[a-z]", password) and
        re.search(r"[A-Z]", password) and
        re.search(r"[0-9]", password) and
        re.search(r"[^a-zA-Z0-9]", password)):
        return password
    
    return False