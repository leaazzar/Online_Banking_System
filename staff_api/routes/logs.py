from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from common.database import SessionLocal
from common.models import AuditLog, RoleEnum

from staff_api.utils.permissions import require_roles

logs_bp = Blueprint("logs_bp", __name__)


@logs_bp.get("/logs")
@jwt_required()
@require_roles(RoleEnum.ADMIN.value, RoleEnum.AUDITOR.value)
def get_logs():
    db = SessionLocal()
    try:
        logs = db.query(AuditLog).all()
        return jsonify([
            {
                "id": l.id,
                "action": l.action,
                "details": l.details,
                "user_id": l.user_id,
                "created_at": l.created_at.isoformat()
            }
            for l in logs
        ]), 200
    finally:
        db.close()
