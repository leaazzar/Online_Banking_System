from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from staff_api.utils.permissions import require_roles


from common.database import SessionLocal
from common.models import (
    Ticket,
    TicketNote,
    TicketStatusEnum,
    AuditLog,
    RoleEnum,
)

from staff_api.utils.permissions import require_roles

tickets_bp = Blueprint("tickets_bp", __name__)


# GET /tickets
@tickets_bp.get("/tickets")
@jwt_required()
@require_roles(RoleEnum.SUPPORT.value, RoleEnum.ADMIN.value)
def get_tickets():
    db = SessionLocal()
    try:
        tickets = db.query(Ticket).all()

        return jsonify([
            {
                "id": t.id,
                "customer_id": t.customer_id,
                "subject": t.subject,
                "description": t.description,
                "status": t.status,
                "notes": [
                    {
                        "id": n.id,
                        "note": n.note,
                        "user_id": n.user_id,
                        "created_at": n.created_at.isoformat()
                    }
                    for n in t.notes
                ],
                "created_at": t.created_at.isoformat()
            }
            for t in tickets
        ]), 200
    finally:
        db.close()


# PATCH /tickets/<id>/status
@tickets_bp.patch("/tickets/<int:ticket_id>/status")
@jwt_required()
@require_roles(RoleEnum.SUPPORT.value, RoleEnum.ADMIN.value)
def update_ticket_status(ticket_id):
    db = SessionLocal()
    try:
        data = request.get_json()
        new_status = data.get("status")

        if new_status not in [
            TicketStatusEnum.OPEN.value,
            TicketStatusEnum.IN_PROGRESS.value,
            TicketStatusEnum.RESOLVED.value,
        ]:
            return jsonify({"error": "Invalid status"}), 400

        ticket = db.query(Ticket).filter_by(id=ticket_id).first()
        if not ticket:
            return jsonify({"error": "Ticket not found"}), 404

        # enforce valid transitions
        valid = {
            TicketStatusEnum.OPEN.value: TicketStatusEnum.IN_PROGRESS.value,
            TicketStatusEnum.IN_PROGRESS.value: TicketStatusEnum.RESOLVED.value,
            TicketStatusEnum.RESOLVED.value: None,
        }

        if valid[ticket.status] != new_status:
            return jsonify({
                "error":
                f"Invalid transition from {ticket.status} to {new_status}"
            }), 400

        ticket.status = new_status
        db.add(ticket)

        # log
        log = AuditLog(
            user_id=get_jwt_identity(),
            action="ticket_status_update",
            details=f"Changed ticket {ticket_id} to {new_status}",
        )
        db.add(log)

        db.commit()
        return jsonify({"message": "Status updated"}), 200
    finally:
        db.close()


# POST /tickets/<id>/note
@tickets_bp.post("/tickets/<int:ticket_id>/note")
@jwt_required()
@require_roles(RoleEnum.SUPPORT.value, RoleEnum.ADMIN.value)
def add_note(ticket_id):
    db = SessionLocal()
    try:
        data = request.get_json()
        note = data.get("note")

        if not note:
            return jsonify({"error": "Note text required"}), 400

        ticket = db.query(Ticket).filter_by(id=ticket_id).first()
        if not ticket:
            return jsonify({"error": "Ticket not found"}), 404

        new_note = TicketNote(
            ticket_id=ticket_id,
            user_id=get_jwt_identity(),
            note=note
        )
        db.add(new_note)

        # log
        log = AuditLog(
            user_id=get_jwt_identity(),
            action="ticket_note_added",
            details=f"Added note to ticket {ticket_id}"
        )
        db.add(log)

        db.commit()
        return jsonify({"message": "Note added"}), 201
    finally:
        db.close()
