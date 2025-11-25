# customer_api/routes/accounts.py
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

import os, sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

from auth_service.rbac import require_roles
from common.models import Account
from customer_api.services.account_service import (
    create_account_for_user,
    get_user_accounts,
)

bp = Blueprint("accounts", __name__)


@bp.route("/", methods=["POST"])
@jwt_required()
@require_roles("customer")
def create_account():
    owner_id = get_jwt_identity()

    data = request.get_json() or {}
    account_type = data.get("type")
    opening_balance = data.get("opening_balance", 0)

    if account_type not in ("checking", "savings"):
        return {"error": "type must be 'checking' or 'savings'"}, 400

    try:
        opening_balance = float(opening_balance)
    except ValueError:
        return {"error": "opening_balance must be a number"}, 400

    if opening_balance < 0:
        return {"error": "opening_balance cannot be negative"}, 400

    account = create_account_for_user(owner_id, account_type, opening_balance)

    return {
        "id": account.id,
        "account_number": account.account_number,
        "type": account.type,
        "balance": account.balance,
        "status": account.status,
    }, 201


@bp.route("/", methods=["GET"])
@jwt_required()
@require_roles("customer")
def list_accounts():
    owner_id = get_jwt_identity()
    accounts = get_user_accounts(owner_id)

    return {
        "accounts": [
            {
                "id": acc.id,
                "account_number": acc.account_number,
                "type": acc.type,
                "balance": acc.balance,
                "status": acc.status,
            }
            for acc in accounts
        ]
    }, 200
