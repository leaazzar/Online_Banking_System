from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from common.database import SessionLocal
from common.models import Account, Transaction, RoleEnum

from staff_api.utils.permissions import require_roles


admin_bp = Blueprint("admin_bp", __name__)


@admin_bp.get("/admin/accounts")
@jwt_required()
@require_roles(RoleEnum.ADMIN.value)
def admin_accounts():
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


@admin_bp.get("/admin/transactions")
@jwt_required()
@require_roles(RoleEnum.ADMIN.value)
def admin_transactions():
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
