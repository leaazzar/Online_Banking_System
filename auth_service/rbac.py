from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt


def require_roles(*roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request(optional=False)
            claims = get_jwt()

            user_role = claims.get("role")
            if roles and user_role not in roles:
                return jsonify({"error": "Forbidden: insufficient role"}), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator
