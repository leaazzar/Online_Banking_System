import re
from passlib.hash import bcrypt

def is_password_strong(password: str) -> tuple[bool, str]:
    """
    Validates password strength.
    Returns (bool, message)
    """
    if len(password) < 10:
        return False, "Password must be at least 10 characters long."

    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter."

    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter."

    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit."

    if not re.search(r"[^A-Za-z0-9]", password):
        return False, "Password must contain at least one special character."

    return True, ""

def hash_password(plain_password: str) -> str:
    """
    Automatically salts the password.
    bcrypt stores: algorithm + cost + salt + hash
    """
    return bcrypt.using(rounds=12).hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.verify(plain_password, hashed_password)
