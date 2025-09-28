from flask import Blueprint
import os

images_bp = Blueprint("images", __name__)


@images_bp.route("/images")
def get_images():
    images = []
    for root, dirs, files in os.walk("static/images"):
        for file in files:
            if file.endswith(".png"):
                rel_path = os.path.relpath(os.path.join(root, file), "static")
                images.append(rel_path.replace("\\", "/"))
    return images
