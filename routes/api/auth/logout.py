from flask import Blueprint, session, redirect, url_for

logout_bp = Blueprint("logout", __name__)


@logout_bp.route("/logout")
def logout():
    session.pop("email", None)
    session.pop("userid", None)
    return redirect(url_for("index.index"))
