from flask import Blueprint, send_from_directory, abort
import os

static_bp = Blueprint("static", __name__)


@static_bp.route("/static/<path:filename>")
def static_files(filename):
    static_dir = os.path.join(os.getcwd(), "static")
    full_path = os.path.normpath(os.path.join(static_dir, filename))
    if not full_path.startswith(os.path.abspath(static_dir)):
        return abort(404)
    if not os.path.exists(full_path):
        return abort(404)
    return send_from_directory(static_dir, filename)
