# customer_api/routes/transfers.py
from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity

import os, sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

from auth_service.rbac import require_roles
from customer_api.services.transfer_service import (
    perform_internal_transfer,
    perform_external_transfer,
    TransferError,
)

bp = Blueprint("transfers", __name__)


@bp.route("/internal", methods=["POST"])
@jwt_required()
@require_roles("customer")
def internal_transfer():
    owner_id = get_jwt_identity()
    data = request.get_json() or {}

    from_id = data.get("from_account_id")
    to_id = data.get("to_account_id")
    amount = data.get("amount")
    description = data.get("description")

    if not all([from_id, to_id, amount]):
        return {
            "error": "from_account_id, to_account_id, amount are required"
        }, 400

    try:
        amount = float(amount)
    except ValueError:
        return {"error": "amount must be a number"}, 400

    try:
        perform_internal_transfer(
            owner_id=owner_id,
            from_id=int(from_id),
            to_id=int(to_id),
            amount=amount,
            description=description,
        )
    except TransferError as e:
        return {"error": str(e)}, 400

    return {"message": "Internal transfer successful"}, 200


@bp.route("/external", methods=["POST"])
@jwt_required()
@require_roles("customer")
def external_transfer():
    owner_id = get_jwt_identity()
    data = request.get_json() or {}

    from_id = data.get("from_account_id")
    to_id = data.get("to_account_id")
    amount = data.get("amount")
    description = data.get("description")

    if not all([from_id, to_id, amount]):
        return {
            "error": "from_account_id, to_account_id, amount are required"
        }, 400

    try:
        amount = float(amount)
    except ValueError:
        return {"error": "amount must be a number"}, 400

    try:
        perform_external_transfer(
            owner_id=owner_id,
            from_id=int(from_id),
            to_id=int(to_id),
            amount=amount,
            description=description,
        )
    except TransferError as e:
        return {"error": str(e)}, 400

    return {"message": "External transfer successful"}, 200
