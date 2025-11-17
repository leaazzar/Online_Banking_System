from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)

from common.database import SessionLocal
from common.models import User
from common.security import hash_password, verify_password, is_password_strong
from auth_service.rbac import require_roles

auth_bp = Blueprint("auth", __name__)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()






@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    full_name = data.get("full_name")
    email = data.get("email")
    phone = data.get("phone")
    password = data.get("password")

    if not all([full_name, email, phone, password]):
        return jsonify({"error": "Missing required fields"}), 400

    if not is_password_strong(password):
        return jsonify({"error": "Password too weak (min 8 characters)."}), 400

    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == email).first():
            return jsonify({"error": "Email already registered"}), 400

        user = User(
            full_name=full_name,
            email=email,
            phone=phone,
            password_hash=hash_password(password),
            role="customer",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        return jsonify({
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
        }), 201
    finally:
        db.close()


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user or not verify_password(password, user.password_hash):
            return jsonify({"error": "Invalid credentials"}), 401

        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={"role": user.role, "type": "access"},
        )
        refresh_token = create_refresh_token(
            identity=str(user.id),
            additional_claims={"role": user.role, "type": "refresh"},
        )

        return jsonify({
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role,
            },
        }), 200
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
    return jsonify({
        "access_token": new_access,
        "token_type": "Bearer",
    }), 200


@auth_bp.route("/users/<int:user_id>/role", methods=["PATCH"])
@require_roles("admin")
def change_role(user_id: int):
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
        return jsonify({
            "message": "Role updated",
            "user_id": user.id,
            "role": user.role
        }), 200
    finally:
        db.close()
