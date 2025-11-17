import os
import sys
import datetime as dt

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(PROJECT_ROOT)

from flask import Flask
from flask_jwt_extended import JWTManager
from auth_service.routes import auth_bp

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


def create_app():
    app = Flask(__name__)

    jwt_secret = os.getenv("JWT_SECRET_KEY")
    if not jwt_secret:
        raise RuntimeError(
            "JWT_SECRET_KEY is not set. Put it in a .env file or environment variables."
        )

    app.config["JWT_SECRET_KEY"] = jwt_secret

    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = dt.timedelta(minutes=15)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = dt.timedelta(days=7)

    app.config["JWT_TOKEN_LOCATION"] = ["headers"]
    app.config["JWT_HEADER_NAME"] = "Authorization"
    app.config["JWT_HEADER_TYPE"] = "Bearer"

    JWTManager(app)

    app.register_blueprint(auth_bp, url_prefix="/auth")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(port=5000, debug=True)
