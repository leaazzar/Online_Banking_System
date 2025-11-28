from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from common.database import SessionLocal
from common.models import Account, Transaction, RoleEnum, AuditLog
from staff_api.utils.permissions import require_roles


auditor_bp = Blueprint("auditor_bp", __name__)


@auditor_bp.get("/auditor/accounts")
@jwt_required()
@require_roles(RoleEnum.AUDITOR.value, RoleEnum.ADMIN.value)
def auditor_accounts():
    db = SessionLocal()
    try:
        accs = db.query(Account).all()
        return jsonify([
            {
                "id": a.id,
                "number": a.account_number,
                "balance": a.balance,
                "status": a.status
            }
            for a in accs
        ])
    finally:
        db.close()


@auditor_bp.get("/auditor/transactions")
@jwt_required()
@require_roles(RoleEnum.AUDITOR.value, RoleEnum.ADMIN.value)
def auditor_transactions():
    db = SessionLocal()
    try:
        txs = db.query(Transaction).all()
        return jsonify([
            {
                "id": t.id,
                "amount": t.amount,
                "type": t.type,
                "timestamp": t.timestamp.isoformat(),
                "sender": t.sender_account_id,
                "receiver": t.receiver_account_id,
            }
            for t in txs
        ])
    finally:
        db.close()
@auditor_bp.get("/auditor/audit-logs")
@jwt_required()
@require_roles(RoleEnum.ADMIN.value, RoleEnum.AUDITOR.value)
def get_audit_logs():
    db = SessionLocal()
    try:
        logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).all()

        return jsonify([
            {
                "id": log.id,
                "action": log.action,
                "details": log.details,
                "user_id": log.user_id,
                "user_name": log.user.full_name if log.user else None,
                "created_at": log.created_at.isoformat(),
            }
            for log in logs
        ]), 200
    finally:
        db.close()
