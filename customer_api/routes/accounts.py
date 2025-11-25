import random
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity

from common.database import SessionLocal
from common.models import Account, Transaction, AccountStatusEnum
from customer_api.utils import require_roles

accounts_bp = Blueprint("accounts", __name__, url_prefix="/accounts")


def _generate_account_number(session):
    """Generate a unique 10-digit account number."""
    while True:
        candidate = f"{random.randint(10**9, 10**10 - 1)}"  # 10 digits
        exists = session.query(Account).filter_by(account_number=candidate).first()
        if not exists:
            return candidate


@accounts_bp.route("/create", methods=["POST"])
@require_roles("customer")
def create_account():
    """
    POST /accounts/create
    Body: { "account_type": "checking" | "savings", "initial_deposit": 0.0 }
    """
    session = SessionLocal()
    try:
        data = request.get_json() or {}
        account_type = data.get("account_type")
        initial_deposit = data.get("initial_deposit", 0.0)

        if account_type not in ("checking", "savings"):
            return jsonify({"msg": "account_type must be 'checking' or 'savings'"}), 400

        try:
            amount = float(initial_deposit)
        except (TypeError, ValueError):
            return jsonify({"msg": "initial_deposit must be numeric"}), 400

        if amount < 0:
            return jsonify({"msg": "initial_deposit cannot be negative"}), 400

        user_id = get_jwt_identity()

        account_number = _generate_account_number(session)

        account = Account(
            account_number=account_number,
            owner_id=user_id,
            balance=amount,
            type=account_type,
            status=AccountStatusEnum.ACTIVE.value,
        )

        session.add(account)
        session.commit()
        session.refresh(account)

        return jsonify({
            "id": account.id,
            "account_number": account.account_number,
            "type": account.type,
            "balance": float(account.balance),
            "status": account.status,
        }), 201

    finally:
        session.close()


@accounts_bp.route("", methods=["GET"])
@require_roles("customer")
def list_accounts():
    """
    GET /accounts
    Returns all accounts for logged-in customer + last 5 transactions each.
    """
    session = SessionLocal()
    try:
        user_id = get_jwt_identity()

        accounts = session.query(Account).filter_by(owner_id=user_id).all()
        result = []

        for acc in accounts:
            # Combine outgoing + incoming, sort by timestamp desc, limit 5
            all_txns = acc.outgoing_transactions + acc.incoming_transactions
            all_txns_sorted = sorted(
                all_txns,
                key=lambda t: t.timestamp,
                reverse=True,
            )[:5]

            txns_data = []
            for t in all_txns_sorted:
                txns_data.append({
                    "id": t.id,
                    "sender_account_id": t.sender_account_id,
                    "receiver_account_id": t.receiver_account_id,
                    "amount": float(t.amount),
                    "type": t.type,  # "credit" or "debit"
                    "description": t.description,
                    "timestamp": t.timestamp.isoformat() if t.timestamp else None,
                })

            result.append({
                "id": acc.id,
                "account_number": acc.account_number,
                "type": acc.type,
                "balance": float(acc.balance),
                "status": acc.status,
                "last_transactions": txns_data,
            })

        return jsonify(result), 200

    finally:
        session.close()


@accounts_bp.route("/<int:account_id>", methods=["GET"])
@require_roles("customer")
def get_account(account_id):
    """
    GET /accounts/<id>
    Only if the account belongs to the logged-in customer.
    """
    session = SessionLocal()
    try:
        user_id = get_jwt_identity()

        account = (
            session.query(Account)
            .filter_by(id=account_id, owner_id=user_id)
            .first()
        )

        if not account:
            return jsonify({"msg": "Account not found"}), 404

        return jsonify({
            "id": account.id,
            "account_number": account.account_number,
            "type": account.type,
            "balance": float(account.balance),
            "status": account.status,
        }), 200

    finally:
        session.close()
