from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity

from common.database import SessionLocal
from common.models import Ticket, TicketStatusEnum
from customer_api.utils import require_roles

tickets_bp = Blueprint("tickets", __name__, url_prefix="/tickets")


@tickets_bp.route("", methods=["POST"])
@require_roles("customer")
def create_ticket():
    """
    POST /tickets
    Body: { "subject": "string", "description": "string" }
    Status automatically set to "open".
    """
    session = SessionLocal()
    try:
        data = request.get_json() or {}
        subject = (data.get("subject") or "").strip()
        description = (data.get("description") or "").strip()

        if not subject or not description:
            return jsonify({"msg": "subject and description are required"}), 400

        user_id = get_jwt_identity()

        ticket = Ticket(
            customer_id=user_id,
            subject=subject,
            description=description,
            status=TicketStatusEnum.OPEN.value,
        )

        session.add(ticket)
        session.commit()
        session.refresh(ticket)

        return jsonify({
            "id": ticket.id,
            "subject": ticket.subject,
            "description": ticket.description,
            "status": ticket.status,
            "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
        }), 201

    finally:
        session.close()


@tickets_bp.route("", methods=["GET"])
@require_roles("customer")
def list_tickets():
    """
    GET /tickets
    Returns tickets created by the logged-in customer.
    """
    session = SessionLocal()
    try:
        user_id = get_jwt_identity()
        tickets = session.query(Ticket).filter_by(customer_id=user_id).all()

        result = []
        for t in tickets:
            result.append({
                "id": t.id,
                "subject": t.subject,
                "description": t.description,
                "status": t.status,
                "created_at": t.created_at.isoformat() if t.created_at else None,
                "updated_at": t.updated_at.isoformat() if t.updated_at else None,
            })

        return jsonify(result), 200

    finally:
        session.close()
