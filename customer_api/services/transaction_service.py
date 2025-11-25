# customer_api/services/transaction_service.py
from datetime import datetime

from common.database import SessionLocal
from common.models import Transaction, Account


def get_user_transactions(
    owner_id: int,
    start_date: str | None = None,
    end_date: str | None = None,
    tx_type: str | None = None,
    min_amount: float | None = None,
    max_amount: float | None = None,
):
    session = SessionLocal()
    try:
        # all accounts belonging to this user
        account_ids = [
            acc.id
            for acc in session.query(Account.id).filter(Account.owner_id == owner_id)
        ]

        if not account_ids:
            return []

        q = session.query(Transaction).filter(
            (Transaction.sender_account_id.in_(account_ids))
            | (Transaction.receiver_account_id.in_(account_ids))
        )

        if start_date:
            start = datetime.fromisoformat(start_date)
            q = q.filter(Transaction.timestamp >= start)
        if end_date:
            end = datetime.fromisoformat(end_date)
            q = q.filter(Transaction.timestamp <= end)
        if tx_type:
            q = q.filter(Transaction.type == tx_type)
        if min_amount is not None:
            q = q.filter(Transaction.amount >= min_amount)
        if max_amount is not None:
            q = q.filter(Transaction.amount <= max_amount)

        return q.order_by(Transaction.timestamp.desc()).all()
    finally:
        session.close()
