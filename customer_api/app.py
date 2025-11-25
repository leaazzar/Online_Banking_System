# customer_api/app.py
import os
import datetime as dt
import sys

from flask import Flask
from flask_jwt_extended import JWTManager

try:
    from dotenv import load_dotenv
    # load .env from this folder (customer_api/.env)
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
except ImportError:
    pass

# allow imports from project root (so we can import common, auth_service)
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

from .routes import accounts_bp, transfers_bp, transactions_bp  # relative imports


def create_app():
    app = Flask(__name__)

    jwt_secret = os.getenv("JWT_SECRET_KEY")
    if not jwt_secret:
        raise RuntimeError("JWT_SECRET_KEY is not set")

    app.config["JWT_SECRET_KEY"] = jwt_secret
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = dt.timedelta(minutes=15)

    JWTManager(app)

    app.register_blueprint(accounts_bp, url_prefix="/accounts")
    app.register_blueprint(transfers_bp, url_prefix="/transfers")
    app.register_blueprint(transactions_bp, url_prefix="/transactions")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(port=5001, debug=True)
