
import os
import datetime as dt
import sys

from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
except ImportError:
    pass

from customer_api.routes.accounts import bp as accounts_bp
from customer_api.routes.transfers import bp as transfers_bp
from customer_api.routes.transactions import bp as transactions_bp


def create_app():
    app = Flask(__name__)

    CORS(
        app,
        resources={r"/*": {"origins": ["http://localhost:8080", "http://127.0.0.1:8080"]}},
        supports_credentials=True,
    )

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
