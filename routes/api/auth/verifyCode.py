from flask import Blueprint, request, jsonify, session, redirect, url_for
from db import verifyCode, giveBadge

verify_code_bp = Blueprint("verify_code", __name__)


@verify_code_bp.route("/verify_code", methods=["POST"])
def verify_code():
    data = request.get_json() or {}
    email = data.get("email")
    code = data.get("code")
    mode = data.get("mode", "register")

    result, status = verifyCode(email, code, mode=mode)

    if (
        status == 201
        and mode == "register"
        and isinstance(result, dict)
        and result.get("userid")
    ):
        session["email"] = email
        session["userid"] = result["userid"]
        try:
            giveBadge(
                session["userid"], "siege", "Siege", "Signed up during the Siege weeks!"
            )
        except Exception:
            pass

    if (
        status == 200
        and mode == "login"
        and isinstance(result, dict)
        and result.get("userid")
    ):
        session["email"] = email
        session["userid"] = result["userid"]

    return jsonify(result), status
