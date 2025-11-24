from functools import wraps
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt


def require_roles(*roles):
    """
    Enforce role-based access control using a 'role' claim in the JWT.
    Example:
        @require_roles("customer")
        @require_roles("admin", "support")
    """
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            claims = get_jwt() or {}

            role = claims.get("role")

            if role not in roles:
                return jsonify({"msg": "Forbidden: insufficient role"}), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator
