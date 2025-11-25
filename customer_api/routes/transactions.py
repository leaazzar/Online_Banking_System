# customer_api/routes/transactions.py
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

import os, sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

from auth_service.rbac import require_roles
from customer_api.services.transaction_service import get_user_transactions

bp = Blueprint("transactions", __name__)


@bp.route("/", methods=["GET"])
@jwt_required()
@require_roles("customer")
def list_transactions():
    owner_id = get_jwt_identity()

    start_date = request.args.get("start_date")  # ISO 8601 e.g. 2025-11-17T00:00:00
    end_date = request.args.get("end_date")
    tx_type = request.args.get("type")  # "debit" or "credit"
    min_amount = request.args.get("min_amount")
    max_amount = request.args.get("max_amount")

    def to_float(val):
        if val is None:
            return None
        try:
            return float(val)
        except ValueError:
            return None

    min_amount_f = to_float(min_amount)
    max_amount_f = to_float(max_amount)

    txs = get_user_transactions(
        owner_id=owner_id,
        start_date=start_date,
        end_date=end_date,
        tx_type=tx_type,
        min_amount=min_amount_f,
        max_amount=max_amount_f,
    )

    return {
        "transactions": [
            {
                "id": t.id,
                "sender_account_id": t.sender_account_id,
                "receiver_account_id": t.receiver_account_id,
                "amount": t.amount,
                "type": t.type,
                "timestamp": t.timestamp.isoformat() if t.timestamp else None,
                "description": t.description,
            }
            for t in txs
        ]
    }, 200
