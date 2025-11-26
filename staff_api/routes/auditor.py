from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from common.database import SessionLocal
from common.models import Account, Transaction, RoleEnum
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
