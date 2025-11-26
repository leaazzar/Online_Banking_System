import os
import sys
import datetime as dt
from flask import Flask, jsonify
from flask_jwt_extended import JWTManager

# -------------------------------------------
# MAKE ROOT IMPORTABLE
# -------------------------------------------
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
sys.path.append(PROJECT_ROOT)
# Now "common" and "staff_api" are importable

# -------------------------------------------
# IMPORT ROUTES
# -------------------------------------------
from staff_api.routes.tickets import tickets_bp
from staff_api.routes.admin import admin_bp
from staff_api.routes.auditor import auditor_bp
from staff_api.routes.accounts import accounts_bp
from staff_api.routes.logs import logs_bp


def create_app():
    app = Flask(__name__)

    # JWT CONFIG
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-secret")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = dt.timedelta(minutes=30)

    JWTManager(app)

    # REGISTER BLUEPRINTS
    app.register_blueprint(tickets_bp, url_prefix="/staff")
    app.register_blueprint(admin_bp, url_prefix="/staff")
    app.register_blueprint(auditor_bp, url_prefix="/staff")
    app.register_blueprint(accounts_bp, url_prefix="/staff")
    app.register_blueprint(logs_bp, url_prefix="/staff")

    @app.route("/health")
    def health():
        return jsonify({"status": "ok", "service": "staff_api"}), 200

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(port=5003, debug=True)
