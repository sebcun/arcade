from config import *
from flask import Flask
from db import initDb
import os

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "YourSecretKey")

initDb()

# Import blueprints
from routes.public.index import index_bp
from routes.public.developGame import develop_game_bp
from routes.public.profile import profile_bp
from routes.public.game import play_game_bp
from routes.public.develop import develop_bp

# Auth
from routes.api.auth.slack import slack_bp
from routes.api.auth.slackCallback import slack_callback_bp
from routes.api.auth.sendCode import send_code_bp
from routes.api.auth.verifyCode import verify_code_bp
from routes.api.auth.logout import logout_bp

# Profiles
from routes.api.profile.user import user_bp
from routes.api.profile.editProfile import edit_profile_bp


# Purchases
from routes.api.purchases import purchases_bp
from routes.api.purchase import purchase_bp

# Games
from routes.api.games.games import games_bp
from routes.api.games.saveGame import save_game_bp
from routes.api.games.like import like_bp
from routes.api.games.play import play_bp
from routes.api.games.create import create_game_bp

# Others
from routes.api.images import images_bp
from routes.static import static_bp
from routes.api.giveXp import give_xp_bp


# Public blueprints
app.register_blueprint(index_bp)
app.register_blueprint(develop_game_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(play_game_bp)
app.register_blueprint(develop_bp)


# Auth Blueprints
app.register_blueprint(slack_bp, url_prefix="/api/auth")
app.register_blueprint(slack_callback_bp, url_prefix="/api/auth")
app.register_blueprint(send_code_bp, url_prefix="/api/auth")
app.register_blueprint(verify_code_bp, url_prefix="/api/auth")
app.register_blueprint(logout_bp, url_prefix="/api/auth")

# User Blueprints
app.register_blueprint(user_bp, url_prefix="/api")
app.register_blueprint(edit_profile_bp, url_prefix="/api")

# Purchases Blueprints
app.register_blueprint(purchases_bp, url_prefix="/api")
app.register_blueprint(purchase_bp, url_prefix="/api")

# Games Blueprints
app.register_blueprint(games_bp, url_prefix="/api")
app.register_blueprint(save_game_bp, url_prefix="/api")
app.register_blueprint(like_bp, url_prefix="/api")
app.register_blueprint(play_bp, url_prefix="/api")
app.register_blueprint(create_game_bp, url_prefix="/api")

# Other Blueprints
app.register_blueprint(static_bp)
app.register_blueprint(images_bp, url_prefix="/api")
app.register_blueprint(give_xp_bp, url_prefix="/api")

if __name__ == "__main__":

    app.run(host="0.0.0.0", debug=True)
