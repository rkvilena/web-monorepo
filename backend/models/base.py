"""SQLAlchemy base model and model imports for Alembic."""

from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""

    pass


class TimestampMixin:
    """Mixin that adds created_at and updated_at timestamps."""

    from datetime import datetime

    from sqlalchemy import DateTime, func

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# IMPORTANT: Import all models here for Alembic to detect them
# This ensures all models are registered with the Base metadata
from models.user import User  # noqa: E402, F401

# Add new model imports below as they are created:
# from models.product import Product  # noqa: E402, F401
# from models.order import Order  # noqa: E402, F401
