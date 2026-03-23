# System Patterns

## Architecture Overview

Coach Connect follows a **modern full-stack TypeScript architecture** with clear separation between frontend, backend, and shared code.

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  React + Vite + React Router + TanStack Query + tRPC Client │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ tRPC / HTTP
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
│         Express Server + tRPC + Supabase Client             │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ PostgreSQL Protocol
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database                                │
│                    Supabase (PostgreSQL)                     │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
coach-connect/
├── src/                          # Frontend source
│   ├── components/               # React components
│   │   ├── layout/              # Layout components (Navbar, Footer, etc.)
│   │   └── ui/                  # shadcn/ui components
│   ├── pages/                   # Page components
│   │   └── dashboard/           # Dashboard pages
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Frontend utilities
│   │   ├── supabase.ts         # Supabase client
│   │   ├── trpc.ts             # tRPC client
│   │   └── trpc-provider.tsx   # tRPC React provider
│   ├── server/                  # Backend source (shared location)
│   │   ├── trpc.ts             # tRPC server setup
│   │   └── routers/            # tRPC routers
│   └── shared/                  # Shared code (frontend + backend)
│       ├── types/              # TypeScript type definitions
│       └── validators/         # Zod validation schemas
├── server/                      # Express server entry point
│   └── index.ts                # Server bootstrap
├── public/                      # Static assets
└── memory-bank/                 # Project documentation
```

## Key Design Patterns

### 1. End-to-End Type Safety with tRPC
- Single source of truth for API types
- Automatic type inference on frontend
- Shared routers between client and server

```typescript
// Backend router defines procedures
export const appRouter = router({
  exercise: exerciseRouter,
  planner: plannerRouter,
  // ...
});

// Frontend gets full type inference
const exercises = await trpc.exercise.list.query();
```

### 2. Shared Types and Validators
- Types defined once in `src/shared/types/`
- Zod validators in `src/shared/validators/`
- Used by both frontend forms and backend validation

### 3. Feature-Based Router Organization
Each domain has its own tRPC router:
- `authRouter` - Authentication
- `profileRouter` - User profiles
- `exerciseRouter` - Exercise library
- `plannerRouter` - Training planning
- `tacticBoardRouter` - Tactical diagrams
- `feedRouter` - Social feed
- `connectionRouter` - User connections
- `messagingRouter` - Direct messages
- `jobsRouter` - Job board
- `forumRouter` - Discussion forum
- `matchesRouter` - Match management
- `matchMakerRouter` - Match finding
- `marketplaceRouter` - Services marketplace
- `notificationsRouter` - Notifications
- `uploadRouter` - File uploads
- `clubRouter` - Club management

### 4. Component Architecture
- **Layout Components**: `DashboardLayout`, `PublicLayout`, `Navbar`, `Footer`
- **UI Components**: shadcn/ui component library (Radix-based)
- **Page Components**: Route-level components

### 5. State Management
- **Server State**: TanStack Query via tRPC
- **Form State**: React Hook Form + Zod resolver
- **UI State**: React local state
- **Theme**: next-themes

## Data Flow Patterns

### Read Operations
```
Component → tRPC Query → Router → Supabase → Response
```

### Write Operations
```
Form → Zod Validation → tRPC Mutation → Router → Supabase → Invalidation → UI Update
```

### Real-time Updates (Future)
```
Supabase Realtime → Subscription → UI Update
```

## Authentication Flow
- Supabase Auth handles authentication
- Session managed via Supabase client
- tRPC middleware validates session for protected routes

## Error Handling
- tRPC error propagation
- Form validation errors via Zod
- Global error boundaries in React
- Toast notifications for user feedback

## Styling Approach
- Tailwind CSS for utility classes
- shadcn/ui for component primitives
- CSS variables for theming
- Dark mode support via next-themes