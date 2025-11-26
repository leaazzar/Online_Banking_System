from flask import Blueprint
from .routes.tickets import tickets_bp
from .routes.admin import admin_bp
from .routes.auditor import auditor_bp
from .routes.accounts import accounts_bp
from .routes.logs import logs_bp

def init_staff_api(app):
    app.register_blueprint(tickets_bp, url_prefix="/staff")
    app.register_blueprint(admin_bp, url_prefix="/staff")
    app.register_blueprint(auditor_bp, url_prefix="/staff")
    app.register_blueprint(accounts_bp, url_prefix="/staff")
    app.register_blueprint(logs_bp, url_prefix="/staff")
