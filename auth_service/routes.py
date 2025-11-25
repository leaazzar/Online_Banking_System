from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)

from common.database import SessionLocal
from common.models import PasswordResetToken, User
from common.security import hash_password, verify_password, is_password_strong
from auth_service.rbac import require_roles

import re
import secrets
from datetime import datetime, timedelta

auth_bp = Blueprint("auth", __name__)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def normalize_email(email: str | None) -> str | None:
    if not isinstance(email, str):
        return None
    email = email.strip().lower()
    return email or None


def is_valid_email(email: str) -> bool:
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email))


def is_valid_phone(phone: str) -> bool:
    if not isinstance(phone, str):
        return False
    phone = phone.strip()
    if not (5 <= len(phone) <= 20):
        return False
    return bool(re.match(r"^[0-9+\-\s()]+$", phone))


def is_valid_full_name(full_name: str) -> bool:
    if not isinstance(full_name, str):
        return False
    full_name = full_name.strip()
    if not (1 <= len(full_name) <= 100):
        return False
    return True


@auth_bp.route("/register", methods=["POST"])
def register():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json() or {}
    full_name = data.get("full_name")
    email = normalize_email(data.get("email"))
    phone = data.get("phone")
    password = data.get("password")

    if not all([full_name, email, phone, password]):
        return jsonify({"error": "Missing required fields"}), 400

    if not is_valid_full_name(full_name):
        return jsonify({"error": "Invalid full_name"}), 400

    if not is_valid_email(email):
        return jsonify({"error": "Invalid email format"}), 400

    if not is_valid_phone(phone):
        return jsonify({"error": "Invalid phone format"}), 400

    is_strong, msg = is_password_strong(password)
    if not is_strong:
        return jsonify({"error": msg}), 400

    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == email).first():
            return jsonify({"error": "Email already registered"}), 400

        user = User(
            full_name=full_name.strip(),
            email=email,
            phone=phone.strip(),
            password_hash=hash_password(password),
            role="customer",
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        return (
            jsonify(
                {
                    "id": user.id,
                    "full_name": user.full_name,
                    "email": user.email,
                    "phone": user.phone,
                    "role": user.role,
                }
            ),
            201,
        )
    finally:
        db.close()

@auth_bp.route("/login", methods=["POST"])
def login():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json() or {}
    email = normalize_email(data.get("email"))
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    if not is_valid_email(email):
        return jsonify({"error": "Invalid credentials"}), 401

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user or not verify_password(password, user.password_hash):
            return jsonify({"error": "Invalid credentials"}), 401

        if user.must_change_password:
            first_login_token = create_access_token(
                identity=str(user.id),
                additional_claims={
                    "role": user.role,
                    "type": "first_login",
                },
            )
            return (
                jsonify(
                    {
                        "requires_password_change": True,
                        "first_login_token": first_login_token,
                        "user": {
                            "id": user.id,
                            "full_name": user.full_name,
                            "email": user.email,
                            "role": user.role,
                        },
                    }
                ),
                403,
            )

        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={"role": user.role, "type": "access"},
        )
        refresh_token = create_refresh_token(
            identity=str(user.id),
            additional_claims={"role": user.role, "type": "refresh"},
        )

        return (
            jsonify(
                {
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "token_type": "Bearer",
                    "user": {
                        "id": user.id,
                        "full_name": user.full_name,
                        "email": user.email,
                        "role": user.role,
                    },
                }
            ),
            200,
        )
    finally:
        db.close()


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    claims = get_jwt()
    token_type = claims.get("type")
    if token_type != "refresh":
        return jsonify({"error": "Invalid token type"}), 401

    user_id = get_jwt_identity()
    role = claims.get("role")

    new_access = create_access_token(
        identity=user_id,
        additional_claims={"role": role, "type": "access"},
    )
    return jsonify({"access_token": new_access, "token_type": "Bearer"}), 200

@auth_bp.route("/users/<int:user_id>/role", methods=["PATCH"])
@jwt_required()
@require_roles("admin")
def change_role(user_id: int):
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json() or {}
    new_role = data.get("role")
    if new_role not in ("customer", "support", "auditor", "admin"):
        return jsonify({"error": "Invalid role"}), 400

    db = SessionLocal()
    try:
        user = db.query(User).get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        user.role = new_role
        db.commit()
        return (
            jsonify({"message": "Role updated", "user_id": user.id, "role": user.role}),
            200,
        )
    finally:
        db.close()



@auth_bp.route("/first-login/setup", methods=["POST"])
@jwt_required()
def first_login_setup():
    claims = get_jwt()
    token_type = claims.get("type")
    if token_type != "first_login":
        return jsonify({"error": "Invalid token type for this endpoint"}), 403

    user_id = get_jwt_identity()

    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json() or {}
    new_email = normalize_email(data.get("email"))
    new_password = data.get("password")
    confirm_password = data.get("confirm_password")

    if not new_email or not new_password or not confirm_password:
        return jsonify({"error": "Missing required fields"}), 400

    if not is_valid_email(new_email):
        return jsonify({"error": "Invalid email format"}), 400

    if new_password != confirm_password:
        return jsonify({"error": "Passwords do not match"}), 400

    is_strong, msg = is_password_strong(new_password)
    if not is_strong:
        return jsonify({"error": msg}), 400

    db = SessionLocal()
    try:
        existing = (
            db.query(User)
            .filter(User.email == new_email, User.id != int(user_id))
            .first()
        )
        if existing:
            return jsonify({"error": "Email already in use"}), 400

        user = db.query(User).get(int(user_id))
        if not user:
            return jsonify({"error": "User not found"}), 404

        user.email = new_email
        user.password_hash = hash_password(new_password)
        user.must_change_password = False

        db.commit()

        return (
            jsonify(
                {
                    "message": "Credentials updated successfully. Please log in with your new email and password."
                }
            ),
            200,
        )
    finally:
        db.close()


@auth_bp.route("/password-reset/request", methods=["POST"])
def request_password_reset():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json() or {}
    email = normalize_email(data.get("email"))

    if not email:
        return jsonify({"error": "Email is required"}), 400

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()

        if not user:
            return jsonify(
                {
                    "message": "If that email exists, a reset link has been sent."
                }
            ), 200

        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=1)

        reset = PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=expires_at,
        )
        db.add(reset)
        db.commit()


        return (
            jsonify(
                {
                    "message": "If that email exists, a reset link has been sent.",
                    "debug_token": token,
                }
            ),
            200,
        )
    finally:
        db.close()


@auth_bp.route("/password-reset/confirm", methods=["POST"])
def confirm_password_reset():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json() or {}
    token = data.get("token")
    new_password = data.get("password")
    confirm_password = data.get("confirm_password")

    if not token or not new_password or not confirm_password:
        return jsonify({"error": "Missing required fields"}), 400

    if new_password != confirm_password:
        return jsonify({"error": "Passwords do not match"}), 400

    is_strong, msg = is_password_strong(new_password)
    if not is_strong:
        return jsonify({"error": msg}), 400

    db = SessionLocal()
    try:
        reset = (
            db.query(PasswordResetToken)
            .filter(
                PasswordResetToken.token == token,
                PasswordResetToken.used == False,
            )
            .first()
        )

        if not reset or reset.expires_at < datetime.utcnow():
            return jsonify({"error": "Invalid or expired token"}), 400

        user = reset.user
        if not user:
            return jsonify({"error": "User not found"}), 404

        user.password_hash = hash_password(new_password)
        reset.used = True
        db.commit()

        return (
            jsonify(
                {
                    "message": "Password reset successfully. Please log in with your new password."
                }
            ),
            200,
        )
    finally:
        db.close()
