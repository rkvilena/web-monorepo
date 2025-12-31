"""User repository for database operations."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import get_password_hash, verify_password
from models.user import User
from repositories.base import BaseRepository
from schemas.user import UserCreate, UserUpdate


class UserRepository(BaseRepository[User]):
    """Repository for User model operations."""

    def __init__(self, db: AsyncSession) -> None:
        """Initialize user repository."""
        super().__init__(db, User)

    async def get_by_email(self, email: str) -> User | None:
        """Get user by email address."""
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def create_user(self, data: UserCreate) -> User:
        """Create a new user with hashed password."""
        user_data = {
            "email": data.email,
            "name": data.name,
            "hashed_password": get_password_hash(data.password),
        }
        return await self.create(user_data)

    async def update_user(self, user: User, data: UserUpdate) -> User:
        """Update user with optional password hashing."""
        update_data = data.model_dump(exclude_unset=True)

        if "password" in update_data:
            update_data["hashed_password"] = get_password_hash(
                update_data.pop("password")
            )

        return await self.update(user, update_data)

    async def authenticate(self, email: str, password: str) -> User | None:
        """Authenticate user by email and password."""
        user = await self.get_by_email(email)
        if user is None:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    async def get_active_users(
        self,
        skip: int = 0,
        limit: int = 100,
    ) -> list[User]:
        """Get all active users with pagination."""
        result = await self.db.execute(
            select(User)
            .where(User.is_active == True)  # noqa: E712
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())
