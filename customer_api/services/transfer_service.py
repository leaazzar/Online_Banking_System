# customer_api/services/transfer_service.py
from datetime import datetime

from sqlalchemy.exc import IntegrityError

from common.database import SessionLocal
from common.models import Account, AccountStatusEnum, Transaction


class TransferError(Exception):
    pass


def _get_account_for_owner(session, account_id: int, owner_id: int):
    return (
        session.query(Account)
        .filter(Account.id == account_id, Account.owner_id == owner_id)
        .first()
    )


def perform_internal_transfer(
    owner_id: int, from_id: int, to_id: int, amount: float, description: str | None
):
    session = SessionLocal()
    try:
        if amount <= 0:
            raise TransferError("Amount must be positive")

        from_acc = _get_account_for_owner(session, from_id, owner_id)
        to_acc = _get_account_for_owner(session, to_id, owner_id)

        if not from_acc or not to_acc:
            raise TransferError("Account not found or does not belong to user")

        if from_acc.status != AccountStatusEnum.ACTIVE.value:
            raise TransferError("Source account is not active")

        if to_acc.status != AccountStatusEnum.ACTIVE.value:
            raise TransferError("Destination account is not active")

        if from_acc.balance < amount:
            raise TransferError("Insufficient balance")

        from_acc.balance -= amount
        to_acc.balance += amount

        now = datetime.utcnow()

        debit_tx = Transaction(
            sender_account_id=from_acc.id,
            receiver_account_id=to_acc.id,
            amount=amount,
            type="debit",
            timestamp=now,
            description=description,
        )
        credit_tx = Transaction(
            sender_account_id=from_acc.id,
            receiver_account_id=to_acc.id,
            amount=amount,
            type="credit",
            timestamp=now,
            description=description,
        )

        session.add_all([debit_tx, credit_tx])
        session.commit()
    except TransferError:
        session.rollback()
        raise
    except IntegrityError:
        session.rollback()
        raise TransferError("Database error during transfer")
    finally:
        session.close()


def perform_external_transfer(
    owner_id: int, from_id: int, to_id: int, amount: float, description: str | None
):
    session = SessionLocal()
    try:
        if amount <= 0:
            raise TransferError("Amount must be positive")

        from_acc = _get_account_for_owner(session, from_id, owner_id)
        to_acc = session.query(Account).filter(Account.id == to_id).first()

        if not from_acc:
            raise TransferError("Source account not found or does not belong to user")
        if not to_acc:
            raise TransferError("Destination account not found")

        if from_acc.status != AccountStatusEnum.ACTIVE.value:
            raise TransferError("Source account is not active")
        if to_acc.status != AccountStatusEnum.ACTIVE.value:
            raise TransferError("Destination account is not active")

        if from_acc.balance < amount:
            raise TransferError("Insufficient balance")

        from_acc.balance -= amount
        to_acc.balance += amount

        now = datetime.utcnow()

        debit_tx = Transaction(
            sender_account_id=from_acc.id,
            receiver_account_id=to_acc.id,
            amount=amount,
            type="debit",
            timestamp=now,
            description=description,
        )
        credit_tx = Transaction(
            sender_account_id=from_acc.id,
            receiver_account_id=to_acc.id,
            amount=amount,
            type="credit",
            timestamp=now,
            description=description,
        )

        session.add_all([debit_tx, credit_tx])
        session.commit()
    except TransferError:
        session.rollback()
        raise
    except IntegrityError:
        session.rollback()
        raise TransferError("Database error during transfer")
    finally:
        session.close()
