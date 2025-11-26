from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from common.database import SessionLocal
from common.models import Account, AccountStatusEnum, AuditLog, RoleEnum
from staff_api.utils.permissions import require_roles


accounts_bp = Blueprint("accounts_bp", __name__)


def get_account_or_404(db, account_id):
    acc = db.query(Account).filter_by(id=account_id).first()
    return acc


@accounts_bp.patch("/accounts/<int:account_id>/freeze")
@jwt_required()
@require_roles(RoleEnum.ADMIN.value)
def freeze_account(account_id):
    db = SessionLocal()
    try:
        acc = get_account_or_404(db, account_id)
        if not acc:
            return jsonify({"error": "Account not found"}), 404

        if acc.status == AccountStatusEnum.CLOSED.value:
            return jsonify({"error": "Account is closed"}), 400

        acc.status = AccountStatusEnum.FROZEN.value
        db.add(acc)

        admin_id = int(get_jwt_identity())
        log = AuditLog(
            action="freeze_account",
            user_id=admin_id,
            details=f"Account {acc.id} frozen"
        )
        db.add(log)

        db.commit()
        return jsonify({"message": "Account frozen"}), 200
    finally:
        db.close()


@accounts_bp.patch("/accounts/<int:account_id>/unfreeze")
@jwt_required()
@require_roles(RoleEnum.ADMIN.value)
def unfreeze_account(account_id):
    db = SessionLocal()
    try:
        acc = get_account_or_404(db, account_id)
        if not acc:
            return jsonify({"error": "Account not found"}), 404

        if acc.status == AccountStatusEnum.CLOSED.value:
            return jsonify({"error": "Account is closed"}), 400

        acc.status = AccountStatusEnum.ACTIVE.value
        db.add(acc)

        admin_id = int(get_jwt_identity())
        log = AuditLog(
            action="unfreeze_account",
            user_id=admin_id,
            details=f"Account {acc.id} unfrozen"
        )
        db.add(log)

        db.commit()
        return jsonify({"message": "Account unfrozen"}), 200
    finally:
        db.close()


@accounts_bp.patch("/accounts/<int:account_id>/close")
@jwt_required()
@require_roles(RoleEnum.ADMIN.value)
def close_account(account_id):
    db = SessionLocal()
    try:
        acc = get_account_or_404(db, account_id)
        if not acc:
            return jsonify({"error": "Account not found"}), 404

        if acc.status == AccountStatusEnum.CLOSED.value:
            return jsonify({"error": "Account already closed"}), 400

        acc.status = AccountStatusEnum.CLOSED.value
        db.add(acc)

        admin_id = int(get_jwt_identity())
        log = AuditLog(
            action="close_account",
            user_id=admin_id,
            details=f"Account {acc.id} closed"
        )
        db.add(log)

        db.commit()
        return jsonify({"message": "Account closed"}), 200
    finally:
        db.close()
