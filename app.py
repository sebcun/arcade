from config import *
from flask import Flask
from db import initDb
import os

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "YourSecretKey")

initDb()

# Import blueprints
from routes.public.index import index_bp
from routes.public.docs import docs_bp
from routes.public.create import create_bp

# Auth
from routes.api.auth.slack import slack_bp
from routes.api.auth.slackCallback import slack_callback_bp
from routes.api.auth.sendCode import send_code_bp
from routes.api.auth.verifyCode import verify_code_bp
from routes.api.auth.logout import logout_bp

# Profiles
from routes.api.profile.me import me_bp
from routes.api.profile.profile import profile_bp
from routes.api.profile.editProfile import edit_profile_bp

# Games
from routes.api.games.games import games_bp
from routes.api.games.game import game_bp
from routes.api.games.saveGame import save_game_bp
from routes.api.games.like import like_bp
from routes.api.games.play import play_bp

# Others
from routes.api.images import images_bp
from routes.static import static_bp
from routes.api.giveXp import give_xp_bp


# Public blueprints
app.register_blueprint(index_bp)
app.register_blueprint(docs_bp)
app.register_blueprint(create_bp)

# Auth Blueprints
app.register_blueprint(slack_bp, url_prefix="/api/auth")
app.register_blueprint(slack_callback_bp, url_prefix="/api/auth")
app.register_blueprint(send_code_bp, url_prefix="/api/auth")
app.register_blueprint(verify_code_bp, url_prefix="/api/auth")
app.register_blueprint(logout_bp, url_prefix="/api/auth")

# Profile Blueprints
app.register_blueprint(me_bp, url_prefix="/api")
app.register_blueprint(profile_bp, url_prefix="/api")
app.register_blueprint(edit_profile_bp, url_prefix="/api")

# Games Blueprints
app.register_blueprint(games_bp, url_prefix="/api")
app.register_blueprint(game_bp, url_prefix="/api")
app.register_blueprint(save_game_bp, url_prefix="/api")
app.register_blueprint(like_bp, url_prefix="/api")
app.register_blueprint(play_bp, url_prefix="/api")

# Other Blueprints
app.register_blueprint(static_bp)
app.register_blueprint(images_bp, url_prefix="/api")
app.register_blueprint(give_xp_bp, url_prefix="/api")

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
