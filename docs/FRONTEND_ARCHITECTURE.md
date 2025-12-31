# Frontend Architecture

This document explains the clean architecture implemented in the **Next.js frontend** application.

## Overview

The frontend follows a **feature-based architecture** with clear separation between UI components, business logic, and data fetching.

```
┌─────────────────────────────────────────────────────────┐
│                    App (Pages/Routes)                   │
│         Next.js App Router pages                        │
├─────────────────────────────────────────────────────────┤
│                 Components (Features)                   │
│         Feature-specific UI components                  │
├─────────────────────────────────────────────────────────┤
│                    Hooks (Logic)                        │
│         Business logic with TanStack Query              │
├─────────────────────────────────────────────────────────┤
│                   Lib (API Layer)                       │
│         API client and data fetching                    │
├─────────────────────────────────────────────────────────┤
│                   Types (Contracts)                     │
│         TypeScript interfaces                           │
└─────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Home page
│   ├── globals.css         # Global styles
│   ├── dashboard/          # Dashboard feature
│   │   └── page.tsx
│   └── login/              # Auth feature
│       └── page.tsx
├── components/             # UI Components
│   ├── ui/                 # Reusable UI primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── index.ts        # Barrel export
│   └── features/           # Feature-specific components
│       ├── auth/
│       │   ├── login-form.tsx
│       │   ├── register-form.tsx
│       │   └── index.ts
│       └── users/
│           ├── user-profile.tsx
│           └── index.ts
├── hooks/                  # Custom React hooks
│   ├── use-auth.ts         # Authentication hooks
│   ├── use-users.ts        # User data hooks
│   └── index.ts            # Barrel export
├── lib/                    # Utilities and API
│   ├── api.ts              # API client
│   ├── auth.ts             # Auth functions
│   ├── users.ts            # User API functions
│   └── utils.ts            # Helper functions
├── providers/              # React context providers
│   ├── auth-provider.tsx   # Authentication context
│   ├── query-provider.tsx  # TanStack Query provider
│   └── index.ts            # Barrel export
└── types/                  # TypeScript definitions
    ├── api.ts              # API types
    └── index.ts            # Barrel export
```

---

## Layer Details

### 1. Types Layer (`/types`)

TypeScript interfaces that define contracts between frontend and backend.

```typescript
// types/api.ts

// Generic response types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Domain types matching backend schemas
export interface User {
  id: number;
  email: string;
  name: string;
  isActive: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

// Input types
export interface UserCreate {
  email: string;
  name: string;
  password: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
```

**Key Principles:**
- Never use `any` - define proper types
- Match backend schema naming conventions
- Use interfaces for all API responses

---

### 2. Lib Layer (`/lib`)

API client and data fetching functions.

#### API Client (`api.ts`)

Centralized HTTP client with authentication:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
      headers: buildHeaders(),
    });
    return handleResponse<T>(response);
  },

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<T>(response);
  },
};

// Token management
export function setAuthToken(token: string): void {
  localStorage.setItem('access_token', token);
}

export function clearAuthToken(): void {
  localStorage.removeItem('access_token');
}
```

#### Domain Functions (`auth.ts`, `users.ts`)

API calls grouped by feature:

```typescript
// lib/auth.ts
export async function login(credentials: LoginCredentials): Promise<Token> {
  const token = await apiClient.post<Token>('/auth/token', credentials);
  setAuthToken(token.accessToken);
  return token;
}

export async function getCurrentUser(): Promise<User> {
  return apiClient.get<User>('/users/me');
}

export function logout(): void {
  clearAuthToken();
}
```

**Responsibilities:**
- HTTP requests to backend
- Token management
- Response transformation

---

### 3. Hooks Layer (`/hooks`)

Custom React hooks encapsulating business logic with **TanStack Query**.

```typescript
// hooks/use-auth.ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const USER_QUERY_KEY = ['currentUser'];

// Query hook for fetching current user
export function useCurrentUser() {
  return useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutation hook for login
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
    },
  });
}

// Mutation hook for logout
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => logout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
```

**Hook Patterns:**
- `useQuery` - For data fetching (GET)
- `useMutation` - For data mutations (POST/PUT/DELETE)
- Cache invalidation on mutations
- Loading and error states

---

### 4. Providers Layer (`/providers`)

React context providers for global state.

#### Query Provider

TanStack Query setup:

```typescript
// providers/query-provider.tsx
'use client';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,      // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

#### Auth Provider

Authentication context for global auth state:

```typescript
// providers/auth-provider.tsx
'use client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

### 5. Components Layer (`/components`)

UI components organized by scope.

#### UI Components (`/components/ui`)

Reusable, generic UI primitives:

```typescript
// components/ui/button.tsx
interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`${variantStyles[variant]} ${sizeStyles[size]}`}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
```

**Characteristics:**
- No business logic
- Configurable via props
- Styled with Tailwind CSS
- Barrel exported via `index.ts`

#### Feature Components (`/components/features`)

Feature-specific components with business logic:

```typescript
// components/features/auth/login-form.tsx
'use client';

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const loginMutation = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginMutation.mutateAsync({ email, password });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" loading={loginMutation.isPending}>
          Sign In
        </Button>
      </form>
    </Card>
  );
}
```

**Characteristics:**
- Uses hooks for data/logic
- Composes UI components
- Handles feature-specific state

---

### 6. App Layer (`/app`)

Next.js App Router pages.

#### Root Layout

Provider composition:

```typescript
// app/layout.tsx
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
```

#### Pages

Compose feature components:

```typescript
// app/login/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/features/auth';

export default function LoginPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center">
      <LoginForm onSuccess={() => router.push('/dashboard')} />
    </main>
  );
}
```

---

## Data Flow

```
User Interaction (Click/Submit)
    │
    ▼
┌─────────────────┐
│    Component    │  ← Captures user input
│   (Feature)     │  ← Calls hook mutation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│      Hook       │  ← useMutation/useQuery
│   (TanStack)    │  ← Cache management
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│       Lib       │  ← apiClient.post()
│   (API Layer)   │  ← Token handling
└────────┬────────┘
         │
         ▼
    HTTP Request → Backend API
         │
         ▼
    HTTP Response
         │
         ▼
┌─────────────────┐
│      Hook       │  ← Updates cache
│                 │  ← Returns data/state
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Component    │  ← Re-renders with new data
│                 │  ← Shows loading/error states
└─────────────────┘
```

---

## Key Principles

### 1. Server vs Client Components

```typescript
// Server Component (default) - data fetching
async function UserList() {
  const users = await fetchUsers();
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}

// Client Component - interactivity
'use client';
function UserFilter() {
  const [filter, setFilter] = useState('');
  const { data } = useQuery({ queryKey: ['users', filter] });
  return <input value={filter} onChange={e => setFilter(e.target.value)} />;
}
```

### 2. Strict TypeScript

```typescript
// ✅ Good - explicit types
interface Props {
  user: User;
  onUpdate: (data: UserUpdate) => Promise<void>;
}

// ❌ Bad - avoid any
interface Props {
  user: any;
  onUpdate: (data: any) => any;
}
```

### 3. Barrel Exports

Simplify imports with index files:

```typescript
// components/ui/index.ts
export { Button } from './button';
export { Card, CardHeader, CardContent } from './card';
export { Input } from './input';

// Usage
import { Button, Card, Input } from '@/components/ui';
```

### 4. Colocation

Keep related code together:

```
features/
├── auth/
│   ├── login-form.tsx      # Component
│   ├── register-form.tsx   # Component
│   └── index.ts            # Exports
```

### 5. Separation of Concerns

| Layer | Responsibility |
|-------|---------------|
| **Types** | Data contracts |
| **Lib** | API communication |
| **Hooks** | Business logic + caching |
| **Components/UI** | Presentation |
| **Components/Features** | Feature composition |
| **App** | Routing + layout |

---

## State Management Strategy

### Server State (TanStack Query)

For data from the backend:

```typescript
// Fetching
const { data, isLoading, error } = useQuery({
  queryKey: ['users', page],
  queryFn: () => getUsers(page),
});

// Mutations
const mutation = useMutation({
  mutationFn: createUser,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
});
```

### Client State (useState/Context)

For UI state:

```typescript
// Local state
const [isOpen, setIsOpen] = useState(false);

// Global state (Context)
const { user, isAuthenticated } = useAuth();
```

---

## Adding New Features

### Checklist for New Feature

1. **Define Types** (`types/`)
   ```typescript
   export interface Product {
     id: number;
     name: string;
     price: number;
   }
   ```

2. **Create API Functions** (`lib/`)
   ```typescript
   export async function getProducts(): Promise<Product[]> {
     return apiClient.get<Product[]>('/products');
   }
   ```

3. **Create Hooks** (`hooks/`)
   ```typescript
   export function useProducts() {
     return useQuery({
       queryKey: ['products'],
       queryFn: getProducts,
     });
   }
   ```

4. **Create UI Components** (`components/ui/`) - if needed
   ```typescript
   export function ProductCard({ product }: { product: Product }) {
     return <Card>{product.name}</Card>;
   }
   ```

5. **Create Feature Component** (`components/features/`)
   ```typescript
   export function ProductList() {
     const { data: products, isLoading } = useProducts();
     
     if (isLoading) return <LoadingSpinner />;
     
     return (
       <div className="grid grid-cols-3 gap-4">
         {products?.map(p => <ProductCard key={p.id} product={p} />)}
       </div>
     );
   }
   ```

6. **Create Page** (`app/`)
   ```typescript
   export default function ProductsPage() {
     return (
       <main>
         <h1>Products</h1>
         <ProductList />
       </main>
     );
   }
   ```

---

## Import Conventions

Use path aliases for clean imports:

```typescript
// tsconfig.json paths
{
  "paths": {
    "@/*": ["./*"]
  }
}

// Usage
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks';
import type { User } from '@/types';
```

---

## Testing Strategy

```typescript
// Component testing with React Testing Library
import { render, screen } from '@testing-library/react';
import { LoginForm } from '@/components/features/auth';

test('renders login form', () => {
  render(<LoginForm />);
  expect(screen.getByLabelText('Email')).toBeInTheDocument();
  expect(screen.getByLabelText('Password')).toBeInTheDocument();
});

// Mock API with MSW
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/v1/users/me', (req, res, ctx) => {
    return res(ctx.json({ id: 1, name: 'Test User' }));
  })
);
```
