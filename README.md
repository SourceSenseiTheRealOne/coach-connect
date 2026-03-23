# 🏆 Coach Connect

A modern, full-stack web platform designed for football/soccer coaches, clubs, scouts, and trainers to connect, share knowledge, manage training sessions, and advance their careers.

![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![React](https://img.shields.io/badge/React-18.3-61DAFB)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF)
![Supabase](https://img.shields.io/badge/Supabase-2.99-3ECF8E)
![tRPC](https://img.shields.io/badge/tRPC-11.14-2596BE)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Scripts](#scripts)
- [Testing](#testing)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)

---

## 🎯 Overview

Coach Connect is a comprehensive platform that empowers football coaches and clubs with tools for:

- **Training Management**: Create, share, and organize training exercises
- **Season Planning**: Build structured training plans across seasons
- **Tactical Analysis**: Design tactical boards with animations
- **Social Networking**: Connect with other coaches, share insights
- **Career Development**: Job board and marketplace for services
- **Match Management**: Schedule matches and find opponents

---

## ✨ Features

### 👤 User Management
- Multiple user types: **Coach**, **Club**, **Scout**, **Trainer**
- UEFA License verification (C, B, A, PRO)
- Subscription tiers: Free, Premium Coach, Pro Service, Club License
- Profile customization with avatars and cover images
- Google OAuth authentication

### 🏋️ Exercise Library
- 12 exercise categories (warmup, passing, shooting, dribbling, defending, goalkeeping, tactical, physical, cooldown, rondo, small-sided games, set pieces)
- Age group targeting (U7 through Senior)
- Difficulty levels (Beginner, Intermediate, Advanced)
- Rich media support (images, videos, animations)
- Diagram data for visual representations
- Premium content gating
- Exercise reviews and ratings

### 📅 Season Planner
- Multiple plan types: 2-week, monthly, 3-month, full season
- Training session scheduling
- Exercise assignment to sessions
- Duration and notes tracking
- Club-wide plan sharing

### 🎯 Tactic Board
- Interactive tactical board creation
- Animation data support
- Thumbnail generation
- Save and share tactical setups

### 📰 Social Feed
- Post types: General, Match Reports, Tactical Insights, Drill Shares, Job Shares
- Media attachments (images/videos)
- Likes, comments, and shares
- Follow/Connect system

### 💬 Messaging
- Real-time direct messaging
- Conversation management
- Media sharing
- Read receipts

### 💼 Job Board
- Job types: Head Coach, Assistant Coach, GK Coach, Scout, Video Analyst, Physio, Fitness Coach, Director
- Application management
- CV upload support
- Application status tracking

### 🏟️ Match Management
- Match scheduling (competition, friendly, tournament, cup)
- Match Maker - find opponents by age group and location
- Score tracking
- Venue management

### 🛒 Marketplace
- Service listings: Private Training, Video Analysis, Consulting, Scouting, Event Organizing, Equipment
- Flexible pricing (fixed, hourly, per session, contact)
- Service area targeting
- Remote service options
- Reviews and ratings

### 💬 Forum
- Categorized discussions
- Thread pinning and locking
- Reply system

### 🔔 Notifications
- Multiple notification types (likes, comments, follows, messages, etc.)
- Real-time updates

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI Framework |
| **TypeScript** | 5.8.3 | Type Safety |
| **Vite** | 5.4.19 | Build Tool & Dev Server |
| **React Router** | 6.30.1 | Client-side Routing |
| **TanStack Query** | 5.95.0 | Server State Management |
| **Tailwind CSS** | 3.4.17 | Styling |
| **shadcn/ui** | Latest | UI Components |
| **Radix UI** | Various | Accessible Primitives |
| **Framer Motion** | 12.38.0 | Animations |
| **React Hook Form** | 7.61.1 | Form Handling |
| **Zod** | 3.25.76 | Schema Validation |
| **Lucide React** | 0.462.0 | Icons |
| **Recharts** | 2.15.4 | Charts |
| **date-fns** | 3.6.0 | Date Utilities |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Express.js** | 5.2.1 | API Server |
| **tRPC** | 11.14.1 | End-to-end Type Safety |
| **Supabase** | 2.99.3 | Backend as a Service |
| **PostgreSQL** | Via Supabase | Database |
| **SuperJSON** | 2.2.6 | JSON Serialization |

### Authentication & Storage
- **Supabase Auth**: Email/password + Google OAuth
- **Row Level Security**: Database-level authorization
- **Supabase Storage**: File uploads (avatars, exercises, media)

### Development Tools
| Tool | Purpose |
|------|---------|
| **ESLint** | Code Linting |
| **Vitest** | Unit Testing |
| **Playwright** | E2E Testing |
| **tsx** | TypeScript Execution |
| **Concurrently** | Parallel Script Execution |

---

## 🏗️ Project Architecture

```
coach-connect/
├── public/                  # Static assets
├── scripts/                 # Utility scripts
│   ├── create-user.ts       # User creation script
│   ├── fix-prod-user.ts     # Production user fix
│   ├── seed.ts              # Database seeding
│   └── test-login.ts        # Login testing
├── server/                  # Express API server
│   └── index.ts             # Server entry point
├── src/
│   ├── assets/              # Images, fonts, etc.
│   ├── components/          # React components
│   │   ├── auth/            # Authentication components
│   │   ├── layout/          # Layout components
│   │   └── ui/              # shadcn/ui components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities and configurations
│   │   ├── auth-context.tsx # Auth provider
│   │   ├── supabase.ts      # Supabase client
│   │   ├── supabase-server.ts # Server Supabase client
│   │   ├── trpc.ts          # tRPC client
│   │   └── trpc-provider.tsx # tRPC provider
│   ├── pages/               # Page components
│   │   └── dashboard/       # Dashboard pages
│   ├── server/              # Server-side code
│   │   ├── db/              # Database utilities
│   │   ├── routers/         # tRPC routers
│   │   └── trpc.ts          # tRPC configuration
│   ├── shared/              # Shared types and validators
│   │   ├── types/           # TypeScript types
│   │   └── validators/      # Zod schemas
│   ├── test/                # Test files
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── supabase/
│   └── migrations/          # Database migrations
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── playwright.config.ts
```

### tRPC Routers

The API is organized into domain-specific routers:

| Router | Purpose |
|--------|---------|
| `auth` | Authentication operations |
| `profile` | User profile management |
| `exercise` | Exercise CRUD and reviews |
| `planner` | Season plans and training sessions |
| `tacticBoard` | Tactical board management |
| `feed` | Social feed and posts |
| `connection` | Follow/connect system |
| `messaging` | Direct messaging |
| `jobs` | Job listings and applications |
| `forum` | Forum threads and replies |
| `matches` | Match scheduling |
| `matchMaker` | Finding opponents |
| `marketplace` | Service listings |
| `notifications` | User notifications |
| `upload` | File upload URLs |
| `club` | Club management |

### Procedure Types

```typescript
// Public - No authentication required
publicProcedure

// Protected - Requires authentication
protectedProcedure

// Admin - Requires admin role
adminProcedure

// Club - Requires club user type
clubProcedure

// Pro Service - Requires Pro Service or Club License
proServiceProcedure

// Tier-protected - Custom tier requirements
createTierProtectedProcedure(['premium_coach', 'pro_service'])
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ or **Bun**
- **npm**, **yarn**, **pnpm**, or **bun**
- **Supabase account** (for backend)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SourceSenseiTheRealOne/coach-connect.git
   cd coach-connect
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file with your Supabase credentials (see [Environment Variables](#environment-variables)).

4. **Start the development servers**
   ```bash
   # Start both frontend and backend
   npm run dev:all
   
   # Or start separately
   npm run dev          # Frontend only (port 8080)
   npm run dev:server   # API server only (port 3001)
   ```

5. **Open your browser**
   Navigate to `http://localhost:8080`

---

## 📚 API Documentation

### tRPC Endpoints

The API uses tRPC for end-to-end type safety. All endpoints are available at `/api/trpc`.

#### Example Usage (Frontend)

```typescript
import { trpc } from '@/lib/trpc';

// In a React component
const { data } = trpc.exercise.list.useQuery({
  category: 'passing',
  age_group: 'U12',
  page: 1,
  pageSize: 20
});

// Mutations
const createExercise = trpc.exercise.create.useMutation();
await createExercise.mutateAsync({
  title: 'Passing Drill',
  category: 'passing',
  age_group: 'U12',
  // ...
});
```

### Authentication Flow

1. **Sign Up**: Email/password or Google OAuth
2. **Email Confirmation**: If enabled
3. **Profile Creation**: Automatic on first signup
4. **Session Management**: JWT tokens via Supabase
5. **API Authorization**: Bearer token in Authorization header

---

## 🗄️ Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles with type, license, subscription |
| `club_profiles` | Club-specific data |
| `club_members` | Club membership and roles |
| `exercises` | Training exercises |
| `exercise_reviews` | Exercise ratings and comments |
| `season_plans` | Training season plans |
| `training_sessions` | Individual training sessions |
| `session_exercises` | Exercises in sessions |
| `tactic_boards` | Tactical diagrams |
| `posts` | Social feed posts |
| `post_comments` | Comments on posts |
| `connections` | Follow/connect relationships |
| `conversations` | Message conversations |
| `messages` | Direct messages |
| `job_listings` | Job postings |
| `job_applications` | Job applications |
| `forum_categories` | Forum categories |
| `forum_threads` | Forum discussions |
| `forum_replies` | Thread replies |
| `matches` | Scheduled matches |
| `match_requests` | Opponent finding |
| `marketplace_listings` | Service listings |
| `marketplace_reviews` | Service reviews |
| `notifications` | User notifications |

---

## 📜 Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start Vite dev server |
| `dev:server` | `npm run dev:server` | Start API server with watch |
| `dev:all` | `npm run dev:all` | Start both servers |
| `build` | `npm run build` | Production build |
| `build:dev` | `npm run build:dev` | Development build |
| `preview` | `npm run preview` | Preview production build |
| `lint` | `npm run lint` | Run ESLint |
| `test` | `npm run test` | Run Vitest tests |
| `test:watch` | `npm run test:watch` | Run tests in watch mode |
| `server` | `npm run server` | Start API server |
| `seed` | `npm run seed` | Seed database |
| `create-user` | `npm run create-user` | Create a new user |
| `fix-prod-user` | `npm run fix-prod-user` | Fix production user |

---

## 🧪 Testing

### Unit Tests (Vitest)

```bash
# Run all tests
npm run test

# Run in watch mode
npm run test:watch
```

### E2E Tests (Playwright)

```bash
# Install Playwright browsers
npx playwright install

# Run E2E tests
npx playwright test
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Frontend
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_FRONTEND_URL=http://localhost:8080

# Backend
API_PORT=3001
FRONTEND_URL=http://localhost:8080

# Supabase (Server-side)
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Getting Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Navigate to Settings > API
4. Copy the **Project URL** and **anon/public** key

---

## 🎨 UI Components

This project uses **shadcn/ui** - a collection of reusable components built with:

- **Radix UI** primitives for accessibility
- **Tailwind CSS** for styling
- **Class Variance Authority** for variant management

### Available Components

`accordion`, `alert`, `alert-dialog`, `aspect-ratio`, `avatar`, `badge`, `breadcrumb`, `button`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `collapsible`, `command`, `context-menu`, `dialog`, `drawer`, `dropdown-menu`, `form`, `hover-card`, `input`, `input-otp`, `label`, `menubar`, `navigation-menu`, `pagination`, `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `toast`, `toggle`, `tooltip`

---

## 📱 Pages

### Public Pages
- `/` - Landing page
- `/about` - About the platform
- `/features` - Feature showcase
- `/pricing` - Subscription plans

### Auth Pages
- `/login` - Sign in
- `/signup` - Create account
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset
- `/auth/callback` - OAuth callback

### Dashboard Pages (Protected)
- `/dashboard/feed` - Social feed
- `/dashboard/exercises` - Exercise library
- `/dashboard/tactic-board` - Tactical boards
- `/dashboard/planner` - Season planner
- `/dashboard/messages` - Direct messages
- `/dashboard/jobs` - Job board
- `/dashboard/marketplace` - Service marketplace
- `/dashboard/forum` - Community forum
- `/dashboard/profile` - User profile
- `/dashboard/settings` - Account settings

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 👥 Authors

- **SourceSensei** - *Initial work* - [GitHub](https://github.com/SourceSenseiTheRealOne)

---

<div align="center">
  <p>Built with ❤️ for football coaches worldwide</p>
</div>