# Web Monorepo

A full-stack web application with Python/FastAPI backend and TypeScript/Next.js frontend. The aim is to hastening my own workflow by having develop-ready template/boilerplate for web application project. Detailed documentation regarding the structure provided on `docs` folder for backend & frontend

## Project Structure

```
/backend          # Python FastAPI application
/frontend         # TypeScript Next.js application
/shared           # (Optional) Shared definitions
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv .venv
   source ./.venv/bin/activate  # On Windows: ./.venv/Scripts/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Copy environment file and configure:
   ```bash
   cp .env.example .env
   ```

5. Run the development server:
   ```bash
   uvicorn main:app --reload
   ```

The API will be available at `http://localhost:8000` with docs at `/docs`.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment file and configure:
   ```bash
   cp .env.example .env.local
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:3000`.

## Development Guidelines

See [.github/copilot-instructions.md](.github/copilot-instructions.md) for detailed development guidelines.

### Key Patterns

#### Backend (FastAPI)
- Use `Annotated` syntax for dependency injection
- All database sessions via `Depends(get_db)`
- Follow Schema → Repository → Route pattern for new endpoints

#### Frontend (Next.js)
- Server Components for data fetching when possible
- Client Components with TanStack Query for interactive states
- Strict TypeScript - no `any` types

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login (OAuth2 form)
- `POST /api/v1/auth/token` - Login (JSON body)

### Users
- `GET /api/v1/users/me` - Get current user profile
- `PATCH /api/v1/users/me` - Update current user profile
- `GET /api/v1/users` - List users (admin)
- `GET /api/v1/users/{id}` - Get user by ID (admin)
- `PATCH /api/v1/users/{id}` - Update user (admin)
- `DELETE /api/v1/users/{id}` - Delete user (admin)

## Testing

### Backend
```bash
cd backend
pytest
```

### Frontend
```bash
cd frontend
npm test
```

## License

MIT
