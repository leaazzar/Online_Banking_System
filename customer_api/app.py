import os
import sys
import datetime as dt

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(PROJECT_ROOT)

from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from flask_cors import CORS  # ✅ NEW

from customer_api.routes.accounts import accounts_bp
from customer_api.routes.transfers import transfers_bp
from customer_api.routes.transactions import transactions_bp
from customer_api.routes.tickets import tickets_bp

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

    jwt = JWTManager(app)

    # ✅ CORS so frontend (localhost:8080) can call this service with Authorization header
    CORS(
        app,
        resources={r"/*": {"origins": ["http://localhost:8080"]}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    )

    @jwt.unauthorized_loader
    def missing_token(reason):
        return jsonify({"msg": f"Missing or invalid token: {reason}"}), 401

    @jwt.invalid_token_loader
    def invalid_token(reason):
        return jsonify({"msg": f"Invalid token: {reason}"}), 401

    @jwt.revoked_token_loader
    def revoked_token(jwt_header, jwt_payload):
        return jsonify({"msg": "Token has been revoked"}), 401

    # Blueprints (note: each has its own url_prefix)
    app.register_blueprint(accounts_bp)
    app.register_blueprint(transfers_bp)
    app.register_blueprint(transactions_bp)
    app.register_blueprint(tickets_bp)

    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok", "service": "customer_api"}), 200

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(port=5001, debug=True)
