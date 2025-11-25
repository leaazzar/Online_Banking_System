# customer_api/services/account_service.py
import uuid

from common.database import SessionLocal
from common.models import Account, AccountStatusEnum


def _generate_account_number() -> str:
    """
    Simple unique-ish account number.
    You can later replace this with something fancier if you want.
    """
    return uuid.uuid4().hex[:16].upper()


def create_account_for_user(owner_id: int, account_type: str, opening_balance: float):
    session = SessionLocal()
    try:
        account = Account(
            owner_id=owner_id,
            account_number=_generate_account_number(),
            type=account_type,
            balance=opening_balance,
            status=AccountStatusEnum.ACTIVE.value,
        )
        session.add(account)
        session.commit()
        session.refresh(account)
        return account
    finally:
        session.close()


def get_user_accounts(owner_id: int):
    session = SessionLocal()
    try:
        return session.query(Account).filter(Account.owner_id == owner_id).all()
    finally:
        session.close()
