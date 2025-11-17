from passlib.hash import bcrypt


MIN_PASSWORD_LENGTH = 8


def hash_password(password: str) -> str:
    return bcrypt.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.verify(password, password_hash)


def is_password_strong(password: str) -> bool:
    if not password or len(password) < MIN_PASSWORD_LENGTH:
        return False
    return True
