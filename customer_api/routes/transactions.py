from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from sqlalchemy import or_

from common.database import SessionLocal
from common.models import Account, Transaction
from customer_api.utils import require_roles

transactions_bp = Blueprint("transactions", __name__, url_prefix="/transactions")


@transactions_bp.route("", methods=["GET"])
@require_roles("customer", "admin")
def list_transactions():
    """
    GET /transactions?date_from=&date_to=&type=&amount_min=&amount_max=
    Filters are optional.
    Only returns transactions where at least one side (sender or receiver)
    is an account owned by the logged-in user.
    """
    session = SessionLocal()
    try:
        user_id = get_jwt_identity()

        # Accounts belonging to this user
        accounts = session.query(Account.id).filter_by(owner_id=user_id).all()
        account_ids = [a.id for a in accounts]

        if not account_ids:
            return jsonify([]), 200

        query = session.query(Transaction).filter(
            or_(
                Transaction.sender_account_id.in_(account_ids),
                Transaction.receiver_account_id.in_(account_ids),
            )
        )

        date_from = request.args.get("date_from")
        date_to = request.args.get("date_to")
        txn_type = request.args.get("type")   # "credit" or "debit"
        amount_min = request.args.get("amount_min")
        amount_max = request.args.get("amount_max")

        if date_from:
            try:
                dt_from = datetime.fromisoformat(date_from)
                query = query.filter(Transaction.timestamp >= dt_from)
            except ValueError:
                return jsonify({"msg": "date_from must be ISO 8601 (e.g. 2025-11-22T10:00:00)"}), 400

        if date_to:
            try:
                dt_to = datetime.fromisoformat(date_to)
                query = query.filter(Transaction.timestamp <= dt_to)
            except ValueError:
                return jsonify({"msg": "date_to must be ISO 8601"}), 400

        if txn_type:
            query = query.filter(Transaction.type == txn_type)

        if amount_min:
            try:
                amin = float(amount_min)
                query = query.filter(Transaction.amount >= amin)
            except ValueError:
                return jsonify({"msg": "amount_min must be numeric"}), 400

        if amount_max:
            try:
                amax = float(amount_max)
                query = query.filter(Transaction.amount <= amax)
            except ValueError:
                return jsonify({"msg": "amount_max must be numeric"}), 400

        txns = query.order_by(Transaction.timestamp.desc()).all()

        result = []
        for t in txns:
            result.append({
                "id": t.id,
                "sender_account_id": t.sender_account_id,
                "receiver_account_id": t.receiver_account_id,
                "amount": float(t.amount),
                "type": t.type,
                "description": t.description,
                "timestamp": t.timestamp.isoformat() if t.timestamp else None,
            })

        return jsonify(result), 200

    finally:
        session.close()
