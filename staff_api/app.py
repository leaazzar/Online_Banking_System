import os
import sys
import datetime as dt
from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from dotenv import load_dotenv

# ---------------------------------------------------
# PATH SETUP
# ---------------------------------------------------
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
sys.path.append(PROJECT_ROOT)

# Load .env from project root
load_dotenv(os.path.join(PROJECT_ROOT, ".env"))


# ---------------------------------------------------
# IMPORT BLUEPRINTS
# ---------------------------------------------------
from staff_api.routes.tickets import tickets_bp
from staff_api.routes.admin import admin_bp
from staff_api.routes.auditor import auditor_bp
from staff_api.routes.accounts import accounts_bp
from staff_api.routes.logs import logs_bp


# ---------------------------------------------------
# CREATE APP
# ---------------------------------------------------
def create_app():
    app = Flask(__name__)

    # -------------------------------
    # JWT CONFIG
    # -------------------------------
    jwt_secret = os.getenv("JWT_SECRET_KEY")
    print("Loaded JWT_SECRET_KEY:", jwt_secret)  # Debug

    if not jwt_secret:
        raise RuntimeError("JWT_SECRET_KEY is not set in .env")

    app.config["JWT_SECRET_KEY"] = jwt_secret
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = dt.timedelta(minutes=15)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = dt.timedelta(days=7)
    app.config["JWT_TOKEN_LOCATION"] = ["headers"]
    app.config["JWT_HEADER_NAME"] = "Authorization"
    app.config["JWT_HEADER_TYPE"] = "Bearer"

    # ---------------------------------------------------
    # CORS (Frontend → Staff API)
    # ---------------------------------------------------
    CORS(
        app,
        resources={
            r"/staff/*": {"origins": "http://localhost:8080"},
            r"/health": {"origins": "*"},
        },
        supports_credentials=True,
        allow_headers=[
            "Content-Type",
            "Authorization",
            "X-Requested-With"
        ],
        methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"]
    )

    # -------------------------------
    # JWT ERROR HANDLERS
    # -------------------------------
    jwt = JWTManager(app)

    @jwt.unauthorized_loader
    def missing_token(reason):
        return jsonify({"msg": f"Missing or invalid token: {reason}"}), 401

    @jwt.invalid_token_loader
    def invalid_token(reason):
        return jsonify({"msg": f"Invalid token: {reason}"}), 401

    @jwt.revoked_token_loader
    def revoked_token(jwt_header, jwt_payload):
        return jsonify({"msg": "Token has been revoked"}), 401

    # ---------------------------------------------------
    # REGISTER BLUEPRINTS (ALL UNDER /staff)
    # ---------------------------------------------------
    app.register_blueprint(tickets_bp, url_prefix="/staff")
    app.register_blueprint(admin_bp, url_prefix="/staff")
    app.register_blueprint(auditor_bp, url_prefix="/staff")
    app.register_blueprint(accounts_bp, url_prefix="/staff")
    app.register_blueprint(logs_bp, url_prefix="/staff")

    # ---------------------------------------------------
    # HEALTH CHECK
    # ---------------------------------------------------
    @app.route("/health")
    def health():
        return jsonify({"status": "ok", "service": "staff_api"}), 200

    return app


# ---------------------------------------------------
# RUN SERVER
# ---------------------------------------------------
if __name__ == "__main__":
    app = create_app()
    app.run(port=5003, debug=True)
