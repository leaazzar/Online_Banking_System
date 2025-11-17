from datetime import datetime
import enum

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
    DateTime,
)
from sqlalchemy.orm import relationship

from .database import Base


class RoleEnum(str, enum.Enum):
    CUSTOMER = "customer"
    SUPPORT = "support"
    AUDITOR = "auditor"
    ADMIN = "admin"


class AccountStatusEnum(str, enum.Enum):
    ACTIVE = "active"
    FROZEN = "frozen"
    CLOSED = "closed"


class TicketStatusEnum(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    phone = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default=RoleEnum.CUSTOMER.value)

    # Relationships
    accounts = relationship("Account", back_populates="owner")
    tickets = relationship("Ticket", back_populates="customer")


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    account_number = Column(String, unique=True, nullable=False, index=True)
    type = Column(String, nullable=False)  # "checking" or "savings"
    balance = Column(Float, default=0.0)
    status = Column(String, default=AccountStatusEnum.ACTIVE.value)

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="accounts")

    # Relationships to transactions
    outgoing_transactions = relationship(
        "Transaction",
        foreign_keys="Transaction.sender_account_id",
        back_populates="sender_account",
    )
    incoming_transactions = relationship(
        "Transaction",
        foreign_keys="Transaction.receiver_account_id",
        back_populates="receiver_account",
    )


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    sender_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    receiver_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)

    amount = Column(Float, nullable=False)
    type = Column(String, nullable=False)  # "credit" or "debit"
    timestamp = Column(DateTime, default=datetime.utcnow)
    description = Column(String, nullable=True)

    sender_account = relationship(
        "Account",
        foreign_keys=[sender_account_id],
        back_populates="outgoing_transactions",
    )
    receiver_account = relationship(
        "Account",
        foreign_keys=[receiver_account_id],
        back_populates="incoming_transactions",
    )


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    subject = Column(String, nullable=False)
    description = Column(String, nullable=False)
    status = Column(String, default=TicketStatusEnum.OPEN.value)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    customer = relationship("User", back_populates="tickets")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)   # e.g. "login_failed", "freeze_account"
    details = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
