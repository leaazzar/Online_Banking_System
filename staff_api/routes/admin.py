from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from common.database import SessionLocal
from common.models import User, Account, Transaction, AuditLog, RoleEnum
from common.security import hash_password
from staff_api.utils.permissions import require_roles


# ---------------------------------------
# MAIN ADMIN BLUEPRINT
# ---------------------------------------
admin_bp = Blueprint("admin_bp", __name__)


# =====================================================
# ADMIN → ACCOUNTS + TRANSACTIONS
# =====================================================

@admin_bp.get("/admin/accounts")
@jwt_required()
@require_roles(RoleEnum.ADMIN.value, RoleEnum.SUPPORT.value)
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
@require_roles(RoleEnum.ADMIN.value,RoleEnum.SUPPORT.value )
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


# =====================================================
# ADMIN → USER MANAGEMENT (STAFF ONLY)
# =====================================================

# LIST ALL USERS
# ------------------------------
@admin_bp.get("/admin/users")
@jwt_required()
@require_roles(RoleEnum.ADMIN.value, RoleEnum.SUPPORT.value)
def list_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        return jsonify([
            {
                "id": u.id,
                "full_name": u.full_name,
                "email": u.email,
                "phone": u.phone,
                "role": u.role,
                "is_locked": u.is_locked,
                "failed_login_attempts": u.failed_login_attempts
            }
            for u in users
        ]), 200
    finally:
        db.close()


# ------------------------------
# CREATE STAFF USER
# ------------------------------
@admin_bp.post("/admin/users/create-staff")
@jwt_required()
@require_roles(RoleEnum.ADMIN.value)
def create_staff():
    db = SessionLocal()
    try:
        data = request.get_json() or {}

        required = ["full_name", "email", "phone", "password", "role"]
        if not all(k in data for k in required):
            return jsonify({"msg": "Missing required fields"}), 400

        # Only staff roles allowed
        if data["role"] not in ["support", "auditor"]:
            return jsonify({"msg": "Role must be support, auditor, or admin"}), 400

        # Email must be unique
        if db.query(User).filter_by(email=data["email"]).first():
            return jsonify({"msg": "Email already used"}), 400

        # Create staff
        user = User(
            full_name=data["full_name"].strip(),
            email=data["email"].strip().lower(),
            phone=data["phone"].strip(),
            password_hash=hash_password(data["password"]),
            role=data["role"]
        )

        db.add(user)

        # Audit log
        admin_id = get_jwt_identity()
        log = AuditLog(
            user_id=admin_id,
            action="create_staff",
            details=f"Created staff user {user.email} ({user.role})"
        )
        db.add(log)

        db.commit()
        db.refresh(user)

        return jsonify({"msg": "Staff user created", "id": user.id}), 201

    finally:
        db.close()


# ------------------------------
# UPDATE USER (NAME / PHONE / EMAIL)
# ------------------------------
@admin_bp.patch("/admin/users/<int:user_id>")
@jwt_required()
@require_roles(RoleEnum.ADMIN.value)
def update_user(user_id):
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(id=user_id).first()
        if not user:
            return jsonify({"msg": "User not found"}), 404

        data = request.get_json() or {}

        user.full_name = data.get("full_name", user.full_name)
        user.email = data.get("email", user.email)
        user.phone = data.get("phone", user.phone)

        db.commit()

        return jsonify({"msg": "User updated"}), 200

    finally:
        db.close()


# ------------------------------
# CHANGE STAFF ROLE
# ------------------------------
@admin_bp.patch("/admin/users/<int:user_id>/role")
@jwt_required()
@require_roles(RoleEnum.ADMIN.value)
def change_role(user_id):
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(id=user_id).first()
        if not user:
            return jsonify({"msg": "User not found"}), 404

        role = request.get_json().get("role")

        if role not in ["support", "auditor", "admin"]:
            return jsonify({"msg": "Invalid role"}), 400

        user.role = role
        db.commit()

        return jsonify({"msg": "Role updated"}), 200
    finally:
        db.close()


# ------------------------------
# DELETE STAFF USER
# ------------------------------
@admin_bp.delete("/admin/users/<int:user_id>")
@jwt_required()
@require_roles(RoleEnum.ADMIN.value)
def delete_user(user_id):
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(id=user_id).first()

        if not user:
            return jsonify({"msg": "User not found"}), 404

        # Customers cannot be deleted
        if user.role == "customer":
            return jsonify({"msg": "Cannot delete customers"}), 403

        db.delete(user)
        db.commit()

        return jsonify({"msg": "User deleted"}), 200

    finally:
        db.close()

@admin_bp.get("/admin/overview")
@jwt_required()
@require_roles(RoleEnum.ADMIN.value)
def admin_overview():
    db = SessionLocal()
    try:
        from common.models import User, Account, Ticket, AccountStatusEnum

        total_users = db.query(User).count()
        total_customers = db.query(User).filter_by(role="customer").count()
        total_staff = total_users - total_customers

        total_accounts = db.query(Account).count()
        active_accounts = db.query(Account).filter_by(status=AccountStatusEnum.ACTIVE.value).count()
        frozen_accounts = db.query(Account).filter_by(status=AccountStatusEnum.FROZEN.value).count()
        closed_accounts = db.query(Account).filter_by(status=AccountStatusEnum.CLOSED.value).count()

        open_tickets = db.query(Ticket).filter_by(status="open").count()

        return jsonify({
            "total_users": total_users,
            "total_customers": total_customers,
            "total_staff": total_staff,
            "total_accounts": total_accounts,
            "active_accounts": active_accounts,
            "frozen_accounts": frozen_accounts,
            "closed_accounts": closed_accounts,
            "open_tickets": open_tickets
        })
    finally:
        db.close()
@admin_bp.get("/admin/users/<int:user_id>/accounts")
@jwt_required()
@require_roles(RoleEnum.ADMIN.value)
def admin_get_user_accounts(user_id):
    """
    Return all accounts belonging to a specific user.
    Includes last 5 transactions.
    """
    db = SessionLocal()
    try:
        accounts = db.query(Account).filter_by(owner_id=user_id).all()

        result = []
        for acc in accounts:
            # Last 5 transactions
            txns = acc.outgoing_transactions + acc.incoming_transactions
            txns_sorted = sorted(txns, key=lambda t: t.timestamp, reverse=True)[:5]

            tx_list = [{
                "id": t.id,
                "amount": float(t.amount),
                "type": t.type,
                "description": t.description,
                "timestamp": t.timestamp.isoformat(),
                "sender": t.sender_account_id,
                "receiver": t.receiver_account_id
            } for t in txns_sorted]

            result.append({
                "id": acc.id,
                "number": acc.account_number,
                "type": acc.type,
                "balance": float(acc.balance),
                "status": acc.status,
                "transactions": tx_list
            })

        return jsonify(result), 200
    finally:
         db.close()


@admin_bp.post("/admin/accounts")
@jwt_required()
@require_roles(RoleEnum.ADMIN.value)
def admin_create_account():
    """
    Admin can create an account for ANY customer.
    Body:
    {
      "owner_id": int,
      "type": "checking" | "savings",
      "opening_balance": float (optional, default 0)
    }
    """
    db = SessionLocal()
    try:
        data = request.get_json() or {}
        owner_id = data.get("owner_id")
        acc_type = (data.get("type") or "").strip().lower()
        opening_balance = data.get("opening_balance", 0)

        if not owner_id or acc_type not in ("checking", "savings"):
            return jsonify({"msg": "owner_id and valid type are required"}), 400

        try:
            opening_balance = float(opening_balance)
        except (TypeError, ValueError):
            return jsonify({"msg": "opening_balance must be numeric"}), 400

        if opening_balance < 0:
            return jsonify({"msg": "opening_balance cannot be negative"}), 400

        # Ensure owner exists and is a customer
        owner = db.query(User).filter_by(id=owner_id, role="customer").first()
        if not owner:
            return jsonify({"msg": "Customer not found"}), 404

        # Create account – account_number likely auto-generated in model
        acc = Account(
            owner_id=owner_id,
            type=acc_type,
            balance=opening_balance,
            status=AccountStatusEnum.ACTIVE.value,
        )
        db.add(acc)

        admin_id = get_jwt_identity()
        log = AuditLog(
            user_id=admin_id,
            action="create_account",
            details=f"Admin created {acc_type} account for user {owner_id} with opening balance {opening_balance}",
        )
        db.add(log)

        db.commit()
        db.refresh(acc)

        return jsonify({
            "id": acc.id,
            "number": acc.account_number,
            "type": acc.type,
            "balance": float(acc.balance),
            "status": acc.status,
            "owner_id": acc.owner_id,
        }), 201

    finally:
        db.close()