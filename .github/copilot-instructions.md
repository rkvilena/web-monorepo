# Copilot Instructions

## Project Overview

This is a web monorepo containing:
- **`/backend`**: Python FastAPI application
- **`/frontend`**: TypeScript Next.js application
- **`/shared`**: (Optional) Shared schema definitions

---

## Python / FastAPI Guidelines

### Code Style
- Follow **PEP 8** standards strictly
- Use **async/await** for all I/O bound operations
- Maximum line length: 88 characters (Black formatter compatible)

### Dependency Injection
- Use FastAPI's `Depends()` for all dependencies
- Prefer **Annotated syntax** for cleaner type hints:

```python
from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

async def get_endpoint(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    ...
```

### Database Sessions
- Always inject database sessions via dependency injection
- Never create sessions manually in route handlers
- Use async context managers for session lifecycle

```python
# dependencies/database.py
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

### Authentication
- Inject authentication via `Depends(get_current_user)`
- Create reusable auth dependencies for different permission levels:

```python
# dependencies/auth.py
CurrentUser = Annotated[User, Depends(get_current_user)]
AdminUser = Annotated[User, Depends(get_admin_user)]
OptionalUser = Annotated[User | None, Depends(get_optional_user)]
```

---

## TypeScript / Next.js Guidelines

### Component Architecture
- Use **Functional Components** with **Hooks** exclusively
- Prefer **Server Components** for data fetching when possible
- Use **Client Components** with TanStack Query for interactive states

```tsx
// Server Component (default) - for static/fetched data
async function ProductList() {
  const products = await fetchProducts();
  return <ul>{products.map(p => <ProductItem key={p.id} product={p} />)}</ul>;
}

// Client Component - for interactive states
'use client';
function ProductFilter() {
  const { data, isLoading } = useQuery({ queryKey: ['products'], queryFn: fetchProducts });
  // ...
}
```

### TypeScript Strictness
- **Never use `any`** - always define proper types
- Define **interfaces for all API responses**
- Use `unknown` with type guards when type is truly unknown

```typescript
// types/api.ts
interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

## Database Guidelines (CRITICAL)

### SQLAlchemy 2.0 Configuration
- Use **SQLAlchemy 2.0 declarative mapping** with `Mapped` and `mapped_column`
- All database configurations must reside in **`.env`**

```python
# models/base.py
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

# IMPORTANT: Import all models here for Alembic detection
from models.user import User
from models.product import Product
# ... import all other models
```

### Model Definition Pattern
```python
# models/user.py
from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from models.base import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
```

### Database Portability
- **Avoid database-specific dialects** (e.g., PostgreSQL `JSONB`, `ARRAY`)
- If database-specific features are needed, wrap them in feature flags:

```python
# core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    USE_POSTGRES_FEATURES: bool = False

    class Config:
        env_file = ".env"

# models/mixins.py
from core.config import settings

if settings.USE_POSTGRES_FEATURES:
    from sqlalchemy.dialects.postgresql import JSONB
    JsonColumn = JSONB
else:
    from sqlalchemy import JSON
    JsonColumn = JSON
```

---

## Code Generation Patterns

### New Endpoint Checklist
When generating new endpoints, create all three layers simultaneously:

1. **Pydantic Schema** (`schemas/`)
```python
# schemas/product.py
from pydantic import BaseModel, ConfigDict

class ProductBase(BaseModel):
    name: str
    price: float
    description: str | None = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: str | None = None
    price: float | None = None
    description: str | None = None

class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
```

2. **Repository Method** (`repositories/`)
```python
# repositories/product.py
from typing import Annotated
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

class ProductRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, product_id: int) -> Product | None:
        result = await self.db.execute(
            select(Product).where(Product.id == product_id)
        )
        return result.scalar_one_or_none()

    async def create(self, data: ProductCreate) -> Product:
        product = Product(**data.model_dump())
        self.db.add(product)
        await self.db.flush()
        return product
```

3. **Route Handler** (`routes/`)
```python
# routes/product.py
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status

router = APIRouter(prefix="/products", tags=["products"])

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ProductResponse:
    repo = ProductRepository(db)
    product = await repo.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return product
```

### Frontend Component Checklist
When generating frontend components:

1. **Check Backend OpenAPI spec** for field naming conventions
2. **Define TypeScript interfaces** matching backend schemas
3. **Create API client functions** with proper typing
4. **Build components** with appropriate data fetching strategy

```typescript
// api/products.ts
import { apiClient } from '@/lib/api';

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string | null;
  createdAt: string;  // Match backend field naming
}

export async function getProduct(id: number): Promise<Product> {
  const response = await apiClient.get<Product>(`/products/${id}`);
  return response.data;
}

// components/ProductDetail.tsx
interface ProductDetailProps {
  productId: number;
}

export async function ProductDetail({ productId }: ProductDetailProps) {
  const product = await getProduct(productId);
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <span>${product.price}</span>
    </div>
  );
}
```

---

## File Structure

```
/backend
├── alembic/              # Database migrations
├── core/
│   ├── config.py         # Settings from .env
│   ├── database.py       # Database connection setup
│   └── security.py       # Auth utilities
├── dependencies/
│   ├── auth.py           # Auth dependencies
│   └── database.py       # DB session dependency
├── models/
│   ├── base.py           # Base model + all imports
│   └── *.py              # Individual models
├── repositories/         # Data access layer
├── routes/               # API endpoints
├── schemas/              # Pydantic models
├── services/             # Business logic
├── tests/
└── main.py

/frontend
├── app/                  # Next.js App Router
├── components/
│   ├── ui/               # Reusable UI components
│   └── features/         # Feature-specific components
├── hooks/                # Custom React hooks
├── lib/
│   ├── api.ts            # API client setup
│   └── utils.ts          # Utility functions
├── types/                # TypeScript interfaces
└── providers/            # Context providers

/shared                   # (Optional) Shared definitions
```

---

## Testing Requirements

### Backend Tests
- Use **pytest** with **pytest-asyncio**
- Mock database sessions in unit tests
- Use test database for integration tests

```python
# tests/conftest.py
import pytest
from httpx import AsyncClient

@pytest.fixture
async def client(test_db: AsyncSession):
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
```

### Frontend Tests
- Use **Jest** and **React Testing Library**
- Mock API calls with **MSW** (Mock Service Worker)
- Test components in isolation

---

## Environment Variables

All configuration must be in `.env`:

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/dbname
USE_POSTGRES_FEATURES=false

# Auth
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API
API_V1_PREFIX=/api/v1
CORS_ORIGINS=["http://localhost:3000"]
```

---

## Quick Reference

| Task | Pattern |
|------|---------|
| New endpoint | Schema → Repository → Route |
| DB dependency | `db: Annotated[AsyncSession, Depends(get_db)]` |
| Auth dependency | `user: Annotated[User, Depends(get_current_user)]` |
| Server Component | Default, use `async` function |
| Client Component | Add `'use client'`, use TanStack Query |
| API types | Interface per endpoint response |
