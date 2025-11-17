from passlib.hash import bcrypt
from flask_jwt_extended import create_access_token, create_refresh_token

def hash_password(password: str) -> str:
    return bcrypt.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.verify(password, hashed)

def make_tokens(user_id, role):
    return {
        "access_token": create_access_token(identity={"id": user_id, "role": role}),
        "refresh_token": create_refresh_token(identity={"id": user_id, "role": role})
    }
