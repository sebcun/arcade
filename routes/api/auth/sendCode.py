from flask import Blueprint, request, jsonify
from db import sendVerificationCode

send_code_bp = Blueprint("send_code", __name__)


@send_code_bp.route("/send_code", methods=["POST"])
def send_code():
    data = request.get_json() or {}
    email = data.get("email")
    mode = data.get("mode", "register")
    username = data.get("username")

    result, status = sendVerificationCode(email, username=username, mode=mode)
    return jsonify(result), status
