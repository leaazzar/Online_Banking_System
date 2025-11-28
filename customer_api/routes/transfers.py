from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from common.database import SessionLocal
from common.models import Account, Transaction, AccountStatusEnum, RoleEnum
from customer_api.utils import require_roles

transfers_bp = Blueprint("transfers", __name__, url_prefix="/transfers")


def _is_active(account: Account) -> bool:
    return account.status == AccountStatusEnum.ACTIVE.value


@transfers_bp.route("/internal", methods=["POST"])
@jwt_required()
@require_roles(RoleEnum.CUSTOMER.value, RoleEnum.ADMIN.value)
def internal_transfer():
    """
    POST /transfers/internal
    Body: {
      "from_account_id": int,
      "to_account_id": int,
      "amount": float,
      "description": "optional"
    }
    """
    session = SessionLocal()
    try:
        data = request.get_json() or {}
        from_id = data.get("from_account_id")
        to_id = data.get("to_account_id")
        amount = data.get("amount")
        description = (data.get("description") or "Internal transfer").strip()

        if not all([from_id, to_id, amount]):
            return jsonify({"msg": "from_account_id, to_account_id and amount are required"}), 400

        if from_id == to_id:
            return jsonify({"msg": "Cannot transfer to the same account"}), 400

        try:
            amount = float(amount)
        except (TypeError, ValueError):
            return jsonify({"msg": "amount must be numeric"}), 400

        if amount <= 0:
            return jsonify({"msg": "amount must be positive"}), 400

        user_id = get_jwt_identity()

        from_acc = session.query(Account).filter_by(id=from_id, owner_id=user_id).first()
        to_acc = session.query(Account).filter_by(id=to_id, owner_id=user_id).first()

        if not from_acc or not to_acc:
            return jsonify({"msg": "One or both accounts not found or not owned by user"}), 404

        if not _is_active(from_acc) or not _is_active(to_acc):
            return jsonify({"msg": "Both accounts must be ACTIVE"}), 400

        if from_acc.balance < amount:
            return jsonify({"msg": "Insufficient balance"}), 400

        from_acc.balance -= amount
        to_acc.balance += amount

        debit_txn = Transaction(
            sender_account_id=from_acc.id,
            receiver_account_id=to_acc.id,
            amount=amount,
            type="debit",
            description=f"{description} (to {to_acc.account_number})",
        )
        credit_txn = Transaction(
            sender_account_id=from_acc.id,
            receiver_account_id=to_acc.id,
            amount=amount,
            type="credit",
            description=f"{description} (from {from_acc.account_number})",
        )

        session.add(debit_txn)
        session.add(credit_txn)
        session.commit()

        return jsonify({
            "msg": "Internal transfer successful",
            "from_account_balance": float(from_acc.balance),
            "to_account_balance": float(to_acc.balance),
        }), 200

    finally:
        session.close()


@transfers_bp.route("/external", methods=["POST"])
@jwt_required()
@require_roles(RoleEnum.CUSTOMER.value, RoleEnum.ADMIN.value)
def external_transfer():
    """
    POST /transfers/external
    Body: {
      "from_account_id": int,
      "to_account_number": "string",
      "amount": float,
      "description": "optional"
    }
    """
    session = SessionLocal()
    try:
        data = request.get_json() or {}
        from_id = data.get("from_account_id")
        to_account_number = data.get("to_account_number")
        amount = data.get("amount")
        description = (data.get("description") or "External transfer").strip()

        if not all([from_id, to_account_number, amount]):
            return jsonify({"msg": "from_account_id, to_account_number and amount are required"}), 400

        try:
            amount = float(amount)
        except (TypeError, ValueError):
            return jsonify({"msg": "amount must be numeric"}), 400

        if amount <= 0:
            return jsonify({"msg": "amount must be positive"}), 400

        user_id = get_jwt_identity()

        from_acc = session.query(Account).filter_by(id=from_id, owner_id=user_id).first()
        if not from_acc:
            return jsonify({"msg": "Source account not found or not owned by user"}), 404

        to_acc = session.query(Account).filter_by(account_number=to_account_number).first()
        if not to_acc:
            return jsonify({"msg": "Destination account not found"}), 404

        # External -> must be another user's account
        if from_acc.owner_id == to_acc.owner_id:
            return jsonify({"msg": "Use internal transfer for your own accounts"}), 400

        if not _is_active(from_acc) or not _is_active(to_acc):
            return jsonify({"msg": "Both accounts must be ACTIVE"}), 400

        if from_acc.balance < amount:
            return jsonify({"msg": "Insufficient balance"}), 400

        from_acc.balance -= amount
        to_acc.balance += amount

        debit_txn = Transaction(
            sender_account_id=from_acc.id,
            receiver_account_id=to_acc.id,
            amount=amount,
            type="debit",
            description=f"{description} (to {to_acc.account_number})",
        )
        credit_txn = Transaction(
            sender_account_id=from_acc.id,
            receiver_account_id=to_acc.id,
            amount=amount,
            type="credit",
            description=f"{description} (from {from_acc.account_number})",
        )

        session.add(debit_txn)
        session.add(credit_txn)
        session.commit()

        return jsonify({
            "msg": "External transfer successful",
            "from_account_balance": float(from_acc.balance),
        }), 200

    finally:
        session.close()
