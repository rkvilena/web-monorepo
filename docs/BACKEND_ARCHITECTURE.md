# Backend Architecture

This document explains the clean architecture implemented in the **FastAPI backend** application.

## Overview

The backend follows a **layered architecture** pattern with clear separation of concerns. Each layer has a specific responsibility and depends only on the layers below it.

```
┌─────────────────────────────────────────────────────────┐
│                    Routes (API Layer)                   │
│         Handles HTTP requests and responses             │
├─────────────────────────────────────────────────────────┤
│                   Schemas (DTOs)                        │
│         Data validation and serialization               │
├─────────────────────────────────────────────────────────┤
│                 Repositories (Data Access)              │
│         Database operations and queries                 │
├─────────────────────────────────────────────────────────┤
│                   Models (Entities)                     │
│         SQLAlchemy ORM definitions                      │
├─────────────────────────────────────────────────────────┤
│                 Core (Infrastructure)                   │
│         Configuration, database, security               │
└─────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
backend/
├── main.py                 # Application entry point
├── core/                   # Infrastructure layer
│   ├── config.py           # Application settings
│   ├── database.py         # Database connection
│   └── security.py         # Authentication utilities
├── dependencies/           # FastAPI dependency injection
│   ├── auth.py             # Authentication dependencies
│   └── database.py         # Database session dependency
├── models/                 # Domain entities (SQLAlchemy)
│   ├── base.py             # Base model and mixins
│   └── user.py             # User model
├── repositories/           # Data access layer
│   ├── base.py             # Generic repository pattern
│   └── user.py             # User-specific operations
├── routes/                 # API endpoints
│   ├── __init__.py         # Route aggregation
│   ├── auth.py             # Authentication routes
│   └── users.py            # User management routes
├── schemas/                # Pydantic schemas (DTOs)
│   ├── base.py             # Base schemas
│   └── user.py             # User schemas
├── services/               # Business logic (optional)
└── tests/                  # Test suite
```

---

## Layer Details

### 1. Core Layer (`/core`)

The foundation layer containing application infrastructure.

#### Configuration (`config.py`)

Centralized settings management using **Pydantic Settings**.

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")
    
    DATABASE_URL: str = "sqlite+aiosqlite:///./app.db"
    SECRET_KEY: str = "your-secret-key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
```

**Key Features:**
- Environment variable loading from `.env`
- Type validation and defaults
- Cached settings via `@lru_cache`

#### Database (`database.py`)

Async SQLAlchemy setup with session factory.

```python
engine = create_async_engine(settings.DATABASE_URL)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession)
```

**Key Features:**
- Async database connections
- Automatic table creation on startup
- Clean shutdown handling

---

### 2. Models Layer (`/models`)

SQLAlchemy 2.0 declarative models representing database entities.

#### Base Model (`base.py`)

```python
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, onupdate=func.now())
```

#### Entity Model (`user.py`)

```python
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
```

**Key Features:**
- SQLAlchemy 2.0 `Mapped` type hints
- Automatic timestamps via mixins
- Database-agnostic column types

---

### 3. Repositories Layer (`/repositories`)

Data access abstraction implementing the **Repository Pattern**.

#### Base Repository (`base.py`)

Generic CRUD operations for any model:

```python
class BaseRepository(Generic[ModelType]):
    def __init__(self, db: AsyncSession, model: type[ModelType]):
        self.db = db
        self.model = model

    async def get_by_id(self, id: int) -> ModelType | None:
        result = await self.db.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()

    async def create(self, data: dict) -> ModelType:
        instance = self.model(**data)
        self.db.add(instance)
        await self.db.flush()
        return instance
```

#### Specialized Repository (`user.py`)

```python
class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, User)

    async def get_by_email(self, email: str) -> User | None:
        # Custom query for user lookup
        ...

    async def authenticate(self, email: str, password: str) -> User | None:
        # Domain-specific authentication logic
        ...
```

**Benefits:**
- Encapsulates database queries
- Easy to test with mocked sessions
- Reusable generic operations

---

### 4. Schemas Layer (`/schemas`)

Pydantic models for request/response validation and serialization.

```python
# Input schemas (Create/Update)
class UserCreate(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    email: EmailStr | None = None
    name: str | None = None
    password: str | None = None

# Output schema
class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    email: str
    name: str
    is_active: bool
    created_at: datetime
```

**Schema Hierarchy:**
```
UserBase          # Common fields
├── UserCreate    # Creation input (with password)
├── UserUpdate    # Partial update input
└── UserResponse  # API response (no password)
```

---

### 5. Dependencies Layer (`/dependencies`)

FastAPI dependency injection for reusable components.

#### Database Dependency

```python
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

#### Authentication Dependencies

```python
# Type aliases for cleaner route signatures
CurrentUser = Annotated[User, Depends(get_current_user)]
AdminUser = Annotated[User, Depends(get_admin_user)]
OptionalUser = Annotated[User | None, Depends(get_optional_user)]
```

**Usage in routes:**
```python
@router.get("/me")
async def get_profile(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserResponse:
    return UserResponse.model_validate(current_user)
```

---

### 6. Routes Layer (`/routes`)

HTTP endpoint definitions with minimal business logic.

```python
router = APIRouter(prefix="/users", tags=["users"])

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserResponse:
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    
    if user is None:
        raise HTTPException(status_code=404)
    
    return UserResponse.model_validate(user)
```

**Route Responsibilities:**
- Request parameter extraction
- Dependency injection
- Input validation (via schemas)
- Response formatting
- HTTP error handling

---

## Data Flow

```
HTTP Request
    │
    ▼
┌─────────────────┐
│     Route       │  ← Validates input via Pydantic schema
│                 │  ← Injects dependencies (db, auth)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Repository    │  ← Executes database queries
│                 │  ← Returns domain models
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Model       │  ← SQLAlchemy entity
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Schema      │  ← Converts to response DTO
│   (Response)    │
└────────┬────────┘
         │
         ▼
HTTP Response (JSON)
```

---

## Key Principles

### 1. Dependency Injection
All dependencies are injected via FastAPI's `Depends()`:
```python
db: Annotated[AsyncSession, Depends(get_db)]
```

### 2. Async/Await
All I/O operations use async:
```python
async def get_user(...):
    user = await repo.get_by_id(id)
```

### 3. Type Hints
Full type annotations for better IDE support and validation:
```python
async def create(self, data: dict[str, Any]) -> ModelType:
```

### 4. Separation of Concerns
- **Routes**: HTTP handling only
- **Schemas**: Validation and serialization
- **Repositories**: Data access
- **Models**: Database structure

### 5. Database Portability
Avoid database-specific features for easy migration:
```python
# ✅ Good - works everywhere
email: Mapped[str] = mapped_column(String(255))

# ❌ Avoid - PostgreSQL specific
data: Mapped[dict] = mapped_column(JSONB)
```

---

## Testing Strategy

```python
# tests/conftest.py
@pytest.fixture
async def db_session():
    async with async_session_maker() as session:
        yield session

@pytest.fixture
async def client(db_session):
    async with AsyncClient(app=app) as ac:
        yield ac
```

Tests are organized by layer:
- `test_routes.py` - API integration tests
- `test_repositories.py` - Data access unit tests
- `test_schemas.py` - Validation tests

---

## Adding New Features

### Checklist for New Endpoint

1. **Create Model** (`models/`)
   ```python
   class Product(Base):
       __tablename__ = "products"
       id: Mapped[int] = mapped_column(primary_key=True)
       name: Mapped[str] = mapped_column(String(100))
   ```

2. **Create Schemas** (`schemas/`)
   ```python
   class ProductCreate(BaseModel):
       name: str
   
   class ProductResponse(BaseModel):
       model_config = ConfigDict(from_attributes=True)
       id: int
       name: str
   ```

3. **Create Repository** (`repositories/`)
   ```python
   class ProductRepository(BaseRepository[Product]):
       def __init__(self, db: AsyncSession):
           super().__init__(db, Product)
   ```

4. **Create Route** (`routes/`)
   ```python
   @router.post("/", response_model=ProductResponse)
   async def create_product(
       data: ProductCreate,
       db: Annotated[AsyncSession, Depends(get_db)],
   ) -> ProductResponse:
       repo = ProductRepository(db)
       product = await repo.create(data.model_dump())
       return ProductResponse.model_validate(product)
   ```

5. **Register Route** (`routes/__init__.py`)
   ```python
   from routes.products import router as products_router
   api_router.include_router(products_router)
   ```
