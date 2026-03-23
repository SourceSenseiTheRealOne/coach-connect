# Elite-Connect: Complete Implementation Guide

> **Client:** Sérgio Augusto da Silva
> **Project:** Elite-Connect (Working Title) — The "Technical Heart" of Portuguese Football
> **Document Version:** 1.0 | March 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Tech Stack Decision & Justification](#2-tech-stack-decision--justification)
3. [Architecture Overview](#3-architecture-overview)
4. [Database Schema Design](#4-database-schema-design)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Phase 1 — MVP Website (Core)](#6-phase-1--mvp-website)
7. [Phase 2 — Networking Features](#7-phase-2--networking-features)
8. [Phase 3 — Mobile Apps](#8-phase-3--mobile-apps)
9. [Phase 4 — Marketplace & Payments](#9-phase-4--marketplace--payments)
10. [Subscription & Monetization Implementation](#10-subscription--monetization-implementation)
11. [Real-Time Features](#11-real-time-features)
12. [File Storage & Media](#12-file-storage--media)
13. [Deployment & Infrastructure](#13-deployment--infrastructure)
14. [Security Considerations](#14-security-considerations)
15. [Third-Party Integrations](#15-third-party-integrations)
16. [Project Structure](#16-project-structure)
17. [Development Timeline Estimate](#17-development-timeline-estimate)

---

## 1. Executive Summary

Elite-Connect is a multi-pillar platform targeting Portuguese football professionals. It combines:

| Pillar | Inspiration | Core Purpose |
|--------|------------|--------------|
| **Technical Hub** | KNVB Rinus | Drill library, season planner, tactical board |
| **Professional Network** | LinkedIn | Verified profiles, feed, messaging, job board |
| **Marketplace** | Fiverr/LinkedIn Services | Service listings, bookings, payments |

**Four user types:** Grassroots Coaches, Clubs, Scouts, Private Trainers — each with distinct needs and feature access governed by subscription tiers (Free, Premium Coach, Pro Service, Club License).

---

## 2. Tech Stack Decision & Justification

### Recommended Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 15 (App Router + Turbopack) | SSR for SEO on public pages, React Server Components for performance, Turbopack for fast DX |
| **Backend API** | Next.js API Routes + Supabase Edge Functions | Eliminates need for separate backend; API routes handle custom logic, Edge Functions handle webhooks/cron |
| **Database** | Supabase (PostgreSQL) | Managed Postgres with Row Level Security, real-time subscriptions, built-in auth, and storage |
| **Auth** | Supabase Auth | Email/password, OAuth (Google), magic links, role-based access via JWT claims |
| **Real-Time** | Supabase Realtime | WebSocket-based real-time for messaging, feed updates, notifications |
| **File Storage** | Supabase Storage | Profile photos, drill images/videos, exercise animations, club logos |
| **Payments** | Stripe | Subscriptions, marketplace payouts (Stripe Connect), invoicing |
| **Email** | Resend | Transactional emails (verification, notifications, receipts) |
| **Hosting** | Vercel | Optimized for Next.js, edge network, automatic previews |
| **UI Library** | Tailwind CSS + shadcn/ui | Rapid UI development, consistent design system |
| **State Management** | Zustand + TanStack Query | Zustand for client state, TanStack Query for server state/caching |
| **Canvas/Graphics** | Konva.js (react-konva) | Tactical board rendering, drag-and-drop field diagrams |
| **Calendar** | FullCalendar or custom with date-fns | Season planner, match calendar, drag-and-drop scheduling |
| **Mobile (Phase 3)** | React Native (Expo) | Shared React knowledge from Next.js, near-native performance |

### Why NOT NestJS?

| Concern | How the Recommended Stack Handles It |
|---------|--------------------------------------|
| Business logic | Next.js API routes (server-side, type-safe with the same codebase) |
| Auth & middleware | Supabase Auth + Next.js middleware |
| Real-time | Supabase Realtime (WebSocket channels out of the box) |
| Background jobs | Supabase Edge Functions + Vercel Cron |
| Data validation | Zod schemas shared between client and API routes |
| Scalability | Vercel auto-scales; Supabase scales Postgres independently |

**When NestJS WOULD make sense:** If the platform reaches 50k+ concurrent users and needs microservice decomposition, custom WebSocket servers, or complex job queues. This is a Phase 5+ concern.

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Web (Next.js)│  │ iOS (Expo)   │  │ Android (Expo)   │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
└─────────┼─────────────────┼───────────────────┼─────────────┘
          │                 │                   │
          ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS APP (Vercel)                      │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │ Server Comps   │  │  API Routes    │  │  Middleware    │ │
│  │ (SSR pages)    │  │  /api/*        │  │  (auth guard)  │ │
│  └────────────────┘  └───────┬────────┘  └───────────────┘ │
└──────────────────────────────┼──────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
┌──────────────┐   ┌───────────────────┐   ┌──────────────┐
│  Supabase    │   │  Supabase         │   │  Stripe      │
│  PostgreSQL  │   │  Auth + Realtime  │   │  Payments    │
│  + RLS       │   │  + Storage        │   │  + Connect   │
└──────────────┘   └───────────────────┘   └──────────────┘
```

### Key Architectural Decisions

1. **Monorepo with Turborepo** — shared types, validation schemas, and utilities between web and mobile
2. **Server Components by default** — client components only where interactivity is needed (tactical board, drag-and-drop calendar, real-time chat)
3. **Row Level Security (RLS)** — all data access rules enforced at the database level, not just in application code
4. **Edge Middleware** — auth checks, subscription tier verification, rate limiting at the edge before hitting the server

---

## 4. Database Schema Design

### Core Tables

```sql
-- ============================================================
-- USERS & AUTHENTICATION
-- ============================================================

-- Extends Supabase auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  cover_image_url TEXT,
  bio TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('coach', 'club', 'scout', 'trainer', 'admin')),
  -- Coach-specific
  uefa_license TEXT CHECK (uefa_license IN ('C', 'B', 'A', 'PRO')),
  is_verified BOOLEAN DEFAULT FALSE,
  -- Location
  city TEXT,
  district TEXT,
  country TEXT DEFAULT 'Portugal',
  -- Subscription
  subscription_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'premium_coach', 'pro_service', 'club_license')),
  stripe_customer_id TEXT,
  subscription_expires_at TIMESTAMPTZ,
  -- Metadata
  profile_views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Club-specific extension (only for user_type = 'club')
CREATE TABLE public.club_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  club_name TEXT NOT NULL,
  founded_year INTEGER,
  logo_url TEXT,
  website_url TEXT,
  webshop_url TEXT,
  max_sub_accounts INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sub-accounts for clubs (multi-user)
CREATE TABLE public.club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES club_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'coach', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

-- ============================================================
-- PILLAR 1: TECHNICAL HUB
-- ============================================================

-- Exercise/Drill Library
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  -- Categorization
  category TEXT NOT NULL CHECK (category IN (
    'warmup', 'passing', 'shooting', 'dribbling', 'defending',
    'goalkeeping', 'tactical', 'physical', 'cooldown', 'rondo',
    'small_sided_game', 'set_piece'
  )),
  age_group TEXT NOT NULL CHECK (age_group IN (
    'U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13',
    'U14', 'U15', 'U16', 'U17', 'U18', 'U19', 'senior'
  )),
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  -- Content
  image_url TEXT,
  animation_url TEXT,         -- Animated diagram (Lottie/GIF/video)
  video_url TEXT,             -- Video demonstration
  diagram_data JSONB,         -- Tactical board JSON for rendering
  -- Settings
  min_players INTEGER,
  max_players INTEGER,
  duration_minutes INTEGER,
  equipment JSONB,            -- ["cones", "bibs", "goals"]
  -- Access control
  is_premium BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,  -- Admin moderation
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercise likes
CREATE TABLE public.exercise_likes (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, exercise_id)
);

-- Exercise reviews/feedback
CREATE TABLE public.exercise_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Season Planner
CREATE TABLE public.season_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  club_id UUID REFERENCES club_profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  age_group TEXT NOT NULL,
  season_start DATE NOT NULL,
  season_end DATE NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN (
    '2_week', 'month', '3_month', 'full_season'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training sessions within a season plan
CREATE TABLE public.training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES season_plans(id) ON DELETE CASCADE,
  title TEXT,
  scheduled_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercises assigned to training sessions
CREATE TABLE public.session_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  duration_minutes INTEGER,
  notes TEXT
);

-- Saved tactical boards
CREATE TABLE public.tactic_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  board_data JSONB NOT NULL,        -- Full canvas state (players, arrows, zones)
  animation_data JSONB,             -- Movement keyframes for animation
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PILLAR 2: PROFESSIONAL NETWORK
-- ============================================================

-- Social connections (follow/connect)
CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'following' CHECK (status IN ('following', 'connected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Feed posts
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  post_type TEXT DEFAULT 'general' CHECK (post_type IN (
    'general', 'match_report', 'tactical_insight', 'drill_share', 'job_share'
  )),
  -- Media attachments
  media_urls JSONB DEFAULT '[]',    -- Array of {url, type, caption}
  -- References
  exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.post_likes (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Private messaging
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job board / Vacancies
CREATE TABLE public.job_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES club_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN (
    'head_coach', 'assistant_coach', 'goalkeeper_coach',
    'scout', 'video_analyst', 'physio', 'fitness_coach',
    'director', 'other'
  )),
  age_group TEXT,                   -- Which team age group
  is_paid BOOLEAN DEFAULT TRUE,
  salary_range TEXT,
  location TEXT,
  application_deadline DATE,
  is_active BOOLEAN DEFAULT TRUE,
  applications_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cover_letter TEXT,
  cv_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, applicant_id)
);

-- Discussion forum
CREATE TABLE public.forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE public.forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  views_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MATCHES & NATIONAL CALENDAR
-- ============================================================

CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  club_id UUID REFERENCES club_profiles(id) ON DELETE SET NULL,
  -- Match info
  home_team TEXT NOT NULL,
  away_team TEXT,
  match_type TEXT NOT NULL CHECK (match_type IN ('competition', 'friendly', 'tournament', 'cup')),
  age_group TEXT NOT NULL,
  -- Schedule
  match_date DATE NOT NULL,
  kick_off_time TIME,
  -- Location
  venue TEXT,
  city TEXT,
  district TEXT,
  -- Visibility
  is_public BOOLEAN DEFAULT TRUE,    -- Visible on national calendar
  -- Result (post-match)
  home_score INTEGER,
  away_score INTEGER,
  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Match Maker: friendly match requests
CREATE TABLE public.match_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Request details
  team_name TEXT NOT NULL,
  age_group TEXT NOT NULL,
  preferred_date DATE,
  preferred_time TIME,
  location_preference TEXT,
  district TEXT,
  message TEXT,
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'expired', 'cancelled')),
  accepted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resulting_match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- ============================================================
-- PILLAR 3: MARKETPLACE
-- ============================================================

CREATE TABLE public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN (
    'private_training', 'video_analysis', 'consulting',
    'scouting', 'event_organizing', 'equipment', 'other'
  )),
  -- Pricing
  price_cents INTEGER,             -- Price in cents (€)
  price_type TEXT CHECK (price_type IN ('fixed', 'hourly', 'per_session', 'contact')),
  currency TEXT DEFAULT 'EUR',
  -- Media
  images JSONB DEFAULT '[]',
  -- Location
  service_area TEXT,
  is_remote BOOLEAN DEFAULT FALSE,
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  views_count INTEGER DEFAULT 0,
  -- Stripe
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, reviewer_id)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'like', 'comment', 'follow', 'connection_request',
    'message', 'job_application', 'match_request',
    'exercise_approved', 'system'
  )),
  title TEXT NOT NULL,
  body TEXT,
  -- Reference to source
  reference_type TEXT,             -- 'post', 'exercise', 'job', 'match', etc.
  reference_id UUID,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_exercises_category ON exercises(category);
CREATE INDEX idx_exercises_age_group ON exercises(age_group);
CREATE INDEX idx_exercises_author ON exercises(author_id);
CREATE INDEX idx_exercises_approved ON exercises(status) WHERE status = 'approved';
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_matches_district ON matches(district);
CREATE INDEX idx_job_listings_active ON job_listings(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_connections_follower ON connections(follower_id);
CREATE INDEX idx_connections_following ON connections(following_id);
CREATE INDEX idx_forum_threads_category ON forum_threads(category_id, created_at DESC);
CREATE INDEX idx_marketplace_type ON marketplace_listings(service_type) WHERE is_active = TRUE;
```

---

## 5. Authentication & Authorization

### Auth Flow

```
User signs up → Supabase Auth creates auth.users row
            → Database trigger creates public.profiles row
            → User selects user_type during onboarding
            → If coach: enters UEFA license level
            → If club: creates club_profile
```

### Supabase Auth Configuration

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

### Next.js Middleware (Auth Guard)

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const publicRoutes = ['/', '/about', '/features', '/pricing', '/login', '/signup']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname === route
  )

  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)'],
}
```

### Row Level Security (RLS) Examples

```sql
-- Profiles: anyone can read, only owner can update
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Exercises: approved visible to all, premium requires subscription
CREATE POLICY "Approved exercises visible to all"
  ON exercises FOR SELECT
  USING (
    status = 'approved'
    AND (
      is_premium = FALSE
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND subscription_tier IN ('premium_coach', 'pro_service', 'club_license')
      )
    )
  );

-- Messages: only conversation participants can read
CREATE POLICY "Participants can read messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );

-- Job listings: only clubs can create
CREATE POLICY "Clubs can create job listings"
  ON job_listings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_profiles WHERE id = club_id
      AND id IN (
        SELECT id FROM profiles WHERE id = auth.uid() AND user_type = 'club'
        UNION
        SELECT user_id FROM club_members WHERE club_id = job_listings.club_id
      )
    )
  );
```

### Subscription Tier Access Control

```typescript
// lib/permissions.ts
type SubscriptionTier = 'free' | 'premium_coach' | 'pro_service' | 'club_license'

const FEATURE_ACCESS: Record<string, SubscriptionTier[]> = {
  // Technical Hub
  'exercises.view_free':        ['free', 'premium_coach', 'pro_service', 'club_license'],
  'exercises.view_premium':     ['premium_coach', 'pro_service', 'club_license'],
  'exercises.submit_limited':   ['free'],        // 1x per year
  'exercises.submit_unlimited': ['premium_coach', 'pro_service', 'club_license'],
  'planner.2_week':             ['free', 'premium_coach', 'pro_service', 'club_license'],
  'planner.month':              ['premium_coach', 'pro_service', 'club_license'],
  'planner.3_month':            ['premium_coach', 'pro_service', 'club_license'],
  'planner.full_season':        ['premium_coach', 'pro_service', 'club_license'],
  'tactic_board.basic':         ['free', 'premium_coach', 'pro_service', 'club_license'],
  'tactic_board.animation':     ['premium_coach', 'pro_service', 'club_license'],
  'tactic_board.save':          ['premium_coach', 'pro_service', 'club_license'], // 5 saves

  // Network
  'verified_badge':             ['premium_coach', 'pro_service', 'club_license'],
  'national_calendar.insert':   ['premium_coach', 'club_license'],
  'match_maker':                ['premium_coach', 'club_license'],

  // Marketplace
  'marketplace.list_service':   ['pro_service'],
  'profile.analytics':          ['pro_service', 'club_license'],
  'profile.featured':           ['pro_service'],

  // Club
  'club.multi_user':            ['club_license'],
  'club.internal_tools':        ['club_license'],
  'club.webshop_link':          ['club_license'],
  'club.post_vacancies':        ['club_license'],
}

export function hasAccess(tier: SubscriptionTier, feature: string): boolean {
  return FEATURE_ACCESS[feature]?.includes(tier) ?? false
}
```

---

## 6. Phase 1 — MVP Website

### Scope

- User registration & onboarding (coach/club/scout/trainer type selection)
- Profile creation & editing
- Drill/exercise library with filters (category, age group, difficulty)
- Basic feed (post creation, viewing)
- Public pages (home, about, features, pricing)

### Implementation Steps

#### 6.1 Project Setup

```bash
# Create monorepo
npx create-turbo@latest elite-connect --package-manager pnpm

# Project structure
elite-connect/
├── apps/
│   └── web/                    # Next.js app
├── packages/
│   ├── ui/                     # Shared UI components (shadcn/ui)
│   ├── db/                     # Supabase client, types, queries
│   ├── validators/             # Zod schemas (shared validation)
│   └── config/                 # Shared configs (eslint, tsconfig)
├── supabase/
│   ├── migrations/             # SQL migration files
│   ├── seed.sql                # Seed data
│   └── config.toml
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

```bash
# Inside apps/web
npx create-next-app@latest web --typescript --tailwind --eslint --app --turbopack

# Install key dependencies
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add zustand @tanstack/react-query
pnpm add zod react-hook-form @hookform/resolvers
pnpm add date-fns lucide-react
pnpm add -D supabase                    # CLI for migrations

# Initialize shadcn/ui
npx shadcn@latest init
```

#### 6.2 App Router Structure

```
apps/web/src/app/
├── (public)/                    # Public layout (no auth required)
│   ├── page.tsx                 # Home/landing page
│   ├── about/page.tsx
│   ├── features/page.tsx
│   ├── pricing/page.tsx
│   └── layout.tsx               # Public navbar + footer
├── (auth)/                      # Auth pages
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── onboarding/page.tsx      # Post-signup type selection
│   └── layout.tsx
├── (dashboard)/                 # Protected area
│   ├── layout.tsx               # Sidebar + topbar
│   ├── feed/page.tsx            # Social feed
│   ├── profile/
│   │   ├── page.tsx             # Own profile
│   │   └── [username]/page.tsx  # Other's profile
│   ├── exercises/
│   │   ├── page.tsx             # Browse library
│   │   ├── [id]/page.tsx        # Exercise detail
│   │   └── submit/page.tsx      # Submit new exercise
│   ├── planner/
│   │   ├── page.tsx             # Season plans list
│   │   └── [id]/page.tsx        # Plan detail with calendar
│   ├── tactic-board/
│   │   ├── page.tsx             # Board list
│   │   └── [id]/page.tsx        # Board editor
│   ├── messages/
│   │   ├── page.tsx             # Conversation list
│   │   └── [id]/page.tsx        # Chat view
│   ├── calendar/
│   │   ├── page.tsx             # Personal calendar
│   │   └── national/page.tsx    # National matches calendar
│   ├── jobs/
│   │   ├── page.tsx             # Job listings
│   │   └── [id]/page.tsx        # Job detail
│   ├── marketplace/
│   │   ├── page.tsx             # Browse services
│   │   └── [id]/page.tsx        # Service detail
│   ├── forum/
│   │   ├── page.tsx             # Categories
│   │   ├── [category]/page.tsx  # Threads in category
│   │   └── thread/[id]/page.tsx # Thread detail
│   ├── match-maker/page.tsx     # Friendly match requests
│   └── settings/page.tsx
├── api/
│   ├── webhooks/
│   │   └── stripe/route.ts      # Stripe webhook handler
│   ├── exercises/
│   │   └── route.ts             # Exercise CRUD API
│   └── upload/
│       └── route.ts             # File upload handler
├── layout.tsx                   # Root layout
└── globals.css
```

#### 6.3 Exercise Library Implementation

```typescript
// app/(dashboard)/exercises/page.tsx
import { createClient } from '@/lib/supabase/server'
import { ExerciseGrid } from '@/components/exercises/exercise-grid'
import { ExerciseFilters } from '@/components/exercises/exercise-filters'

interface SearchParams {
  category?: string
  age_group?: string
  difficulty?: string
  search?: string
  page?: string
}

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get user profile for subscription check
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user!.id)
    .single()

  const page = parseInt(params.page || '1')
  const pageSize = 20

  let query = supabase
    .from('exercises')
    .select('*, author:profiles(username, avatar_url, full_name)', { count: 'exact' })
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (params.category) query = query.eq('category', params.category)
  if (params.age_group) query = query.eq('age_group', params.age_group)
  if (params.difficulty) query = query.eq('difficulty', params.difficulty)
  if (params.search) query = query.ilike('title', `%${params.search}%`)

  // Free tier: only non-premium exercises
  if (profile?.subscription_tier === 'free') {
    query = query.eq('is_premium', false)
  }

  const { data: exercises, count } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Exercise Library</h1>
        <SubmitExerciseButton tier={profile?.subscription_tier} />
      </div>
      <ExerciseFilters currentFilters={params} />
      <ExerciseGrid
        exercises={exercises ?? []}
        totalCount={count ?? 0}
        currentPage={page}
        pageSize={pageSize}
      />
    </div>
  )
}
```

#### 6.4 Onboarding Flow

```typescript
// app/(auth)/onboarding/page.tsx — Multi-step onboarding
// Step 1: Select user type (coach / club / scout / trainer)
// Step 2: Fill type-specific details (UEFA license for coaches, club info for clubs)
// Step 3: Profile photo + bio
// Step 4: Follow suggested profiles

// Key: store onboarding progress in URL search params for back/forward navigation
// /onboarding?step=1 → /onboarding?step=2&type=coach → etc.
```

### Phase 1 Deliverables Checklist

- [ ] Project scaffolding (Turborepo monorepo)
- [ ] Supabase project setup + database migrations
- [ ] Landing page (Home, About, Features, Pricing)
- [ ] Auth flow (signup, login, email verification)
- [ ] Onboarding wizard (user type selection, profile setup)
- [ ] Profile page (view + edit)
- [ ] Exercise library (browse, filter, search)
- [ ] Exercise detail page (with diagram, description, video)
- [ ] Exercise submission form
- [ ] Admin moderation panel for submitted exercises
- [ ] Basic social feed (create post, view feed)
- [ ] Basic tactic board (static, no animation)
- [ ] Responsive design (mobile-friendly web)

---

## 7. Phase 2 — Networking Features

### Scope

- Private messaging (real-time)
- Activity feed with algorithm
- Follow & connect system
- Job board / vacancy page
- Discussion forum
- Notifications system

### Implementation Steps

#### 7.1 Real-Time Messaging

```typescript
// hooks/use-messages.ts
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/types/database'

export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const supabase = createClient()

  useEffect(() => {
    // Load existing messages
    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, sender:profiles(username, avatar_url)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (data) setMessages(data)
    }

    loadMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  const sendMessage = async (content: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user!.id,
      content,
    })
  }

  return { messages, sendMessage }
}
```

#### 7.2 Feed Algorithm

```sql
-- Supabase database function for personalized feed
CREATE OR REPLACE FUNCTION get_personalized_feed(
  requesting_user_id UUID,
  page_size INTEGER DEFAULT 20,
  page_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  author_id UUID,
  content TEXT,
  post_type TEXT,
  media_urls JSONB,
  likes_count INTEGER,
  comments_count INTEGER,
  created_at TIMESTAMPTZ,
  author_username TEXT,
  author_full_name TEXT,
  author_avatar_url TEXT,
  author_user_type TEXT,
  author_is_verified BOOLEAN,
  is_liked_by_me BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.author_id,
    p.content,
    p.post_type,
    p.media_urls,
    p.likes_count,
    p.comments_count,
    p.created_at,
    pr.username,
    pr.full_name,
    pr.avatar_url,
    pr.user_type,
    pr.is_verified,
    EXISTS (
      SELECT 1 FROM post_likes pl
      WHERE pl.post_id = p.id AND pl.user_id = requesting_user_id
    ) AS is_liked_by_me
  FROM posts p
  JOIN profiles pr ON p.author_id = pr.id
  WHERE
    -- Posts from people I follow + my own posts
    p.author_id IN (
      SELECT following_id FROM connections WHERE follower_id = requesting_user_id
      UNION ALL
      SELECT requesting_user_id
    )
  ORDER BY
    -- Boost: posts from verified users
    CASE WHEN pr.is_verified THEN 1 ELSE 0 END DESC,
    -- Chronological
    p.created_at DESC
  LIMIT page_size
  OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 7.3 Follow/Connect System

```typescript
// Server Action for following
// app/actions/connections.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleFollow(targetUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Check if already following
  const { data: existing } = await supabase
    .from('connections')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId)
    .single()

  if (existing) {
    await supabase.from('connections').delete().eq('id', existing.id)
  } else {
    await supabase.from('connections').insert({
      follower_id: user.id,
      following_id: targetUserId,
    })

    // Create notification
    await supabase.from('notifications').insert({
      user_id: targetUserId,
      type: 'follow',
      title: 'New follower',
      actor_id: user.id,
      reference_type: 'profile',
      reference_id: user.id,
    })
  }

  revalidatePath('/profile')
}
```

### Phase 2 Deliverables Checklist

- [ ] Follow/connect system with UI
- [ ] Personalized activity feed (with algorithm)
- [ ] Private messaging (real-time via Supabase Realtime)
- [ ] Conversation list with unread indicators
- [ ] Job board (club-only posting, public browsing)
- [ ] Job application flow
- [ ] Discussion forum (categories, threads, replies)
- [ ] Notification system (in-app + email)
- [ ] Profile analytics (view count for Pro users)

---

## 8. Phase 3 — Mobile Apps

### Approach: React Native with Expo

```
elite-connect/
├── apps/
│   ├── web/             # Next.js (existing)
│   └── mobile/          # Expo React Native (new)
├── packages/
│   ├── db/              # Shared Supabase client + types
│   ├── validators/      # Shared Zod schemas
│   └── shared/          # Shared business logic
```

### Why Expo over a PWA?

| Factor | PWA | Expo (React Native) |
|--------|-----|---------------------|
| Push notifications | Limited on iOS | Full native support |
| Offline drill access | Service workers (fragile) | Native file system |
| App Store presence | No | Yes (iOS + Android) |
| Camera/media access | Limited | Full native APIs |
| Code sharing with web | Same codebase | ~60-70% shared logic |

### Key Mobile Features

1. **Drill access during training** — download exercises for offline viewing
2. **Push notifications** — new messages, job updates, match reminders
3. **Messaging** — real-time chat (identical to web)
4. **Quick tactic board** — simplified touch-friendly version

### Mobile Setup

```bash
cd apps/
npx create-expo-app mobile --template tabs
cd mobile
npx expo install @supabase/supabase-js
npx expo install expo-secure-store  # For auth token storage
npx expo install expo-notifications
npx expo install expo-file-system   # For offline drill storage
```

### Phase 3 Deliverables Checklist

- [ ] Expo project setup within monorepo
- [ ] Auth flow (login/signup with secure token storage)
- [ ] Exercise library with offline download
- [ ] Social feed (view + post)
- [ ] Messaging (real-time)
- [ ] Push notifications (Expo Push + Supabase Edge Function trigger)
- [ ] National match calendar
- [ ] Profile viewing
- [ ] App Store + Google Play deployment

---

## 9. Phase 4 — Marketplace & Payments

### Stripe Integration Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ User (buyer) │────▶│  Next.js API │────▶│   Stripe     │
│              │     │  /api/stripe  │     │   Checkout   │
└──────────────┘     └──────┬───────┘     └──────┬───────┘
                            │                     │
                            │  Webhook            │ Payment
                            │  /api/webhooks/     │ processed
                            │  stripe             │
                            ▼                     ▼
                     ┌──────────────┐     ┌──────────────┐
                     │  Supabase    │     │   Seller     │
                     │  Update sub  │     │   (Stripe    │
                     │  or order    │     │   Connect)   │
                     └──────────────┘     └──────────────┘
```

### Subscription Implementation

```typescript
// app/api/stripe/checkout/route.ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const PRICE_MAP: Record<string, string> = {
  premium_coach: process.env.STRIPE_PREMIUM_COACH_PRICE_ID!,
  pro_service: process.env.STRIPE_PRO_SERVICE_PRICE_ID!,
  club_license: process.env.STRIPE_CLUB_LICENSE_PRICE_ID!,
}

export async function POST(request: Request) {
  const { tier } = await request.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, full_name')
    .eq('id', user.id)
    .single()

  // Create or retrieve Stripe customer
  let customerId = profile?.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: profile?.full_name,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await supabase.from('profiles').update({
      stripe_customer_id: customerId,
    }).eq('id', user.id)
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: tier === 'club_license' ? 'subscription' : 'subscription',
    line_items: [{ price: PRICE_MAP[tier], quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?subscription=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?cancelled=true`,
    metadata: { supabase_user_id: user.id, tier },
  })

  return NextResponse.json({ url: session.url })
}
```

### Webhook Handler

```typescript
// app/api/webhooks/stripe/route.ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Use service role for webhook (no user context)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body, sig, process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id
      const tier = session.metadata?.tier

      if (userId && tier) {
        await supabase.from('profiles').update({
          subscription_tier: tier,
          subscription_expires_at: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
          ).toISOString(),
        }).eq('id', userId)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      await supabase.from('profiles').update({
        subscription_tier: 'free',
        subscription_expires_at: null,
      }).eq('stripe_customer_id', customerId)
      break
    }

    case 'invoice.payment_failed': {
      // Notify user of failed payment
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (profile) {
        await supabase.from('notifications').insert({
          user_id: profile.id,
          type: 'system',
          title: 'Payment failed',
          body: 'Your subscription payment failed. Please update your payment method.',
        })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
```

### Marketplace: Stripe Connect (for seller payouts)

```typescript
// Sellers onboard to Stripe Connect
// When a buyer purchases a marketplace service:
// 1. Payment goes to platform's Stripe account
// 2. Platform takes commission (e.g., 10%)
// 3. Rest is transferred to seller's connected account

export async function createMarketplaceCheckout(listingId: string, buyerId: string) {
  const { data: listing } = await supabase
    .from('marketplace_listings')
    .select('*, seller:profiles(stripe_customer_id)')
    .eq('id', listingId)
    .single()

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: { name: listing.title },
        unit_amount: listing.price_cents,
      },
      quantity: 1,
    }],
    payment_intent_data: {
      application_fee_amount: Math.round(listing.price_cents * 0.10), // 10% platform fee
      transfer_data: {
        destination: listing.seller.stripe_connect_account_id,
      },
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace/${listingId}?purchased=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace/${listingId}`,
  })

  return session.url
}
```

### Phase 4 Deliverables Checklist

- [ ] Stripe integration (subscriptions for all tiers)
- [ ] Stripe webhook handler (subscription lifecycle)
- [ ] Customer portal (manage subscription, payment methods)
- [ ] Marketplace listing creation (Pro Service users)
- [ ] Marketplace browsing and search
- [ ] Stripe Connect onboarding for sellers
- [ ] Marketplace checkout flow
- [ ] Service reviews system
- [ ] Match Maker (request friendly matches)
- [ ] Match request accept/reject flow
- [ ] National calendar integration (matches auto-appear after acceptance)

---

## 10. Subscription & Monetization Implementation

### Tier Feature Matrix (enforced in code)

| Feature | Free | Premium Coach (€3.99-7.99/mo) | Pro Service (€12.99/mo) | Club License (€59.99-150/yr) |
|---------|------|-------------------------------|-------------------------|------------------------------|
| Community feed | Yes | Yes | Yes | Yes |
| Basic tactic board | Yes | Yes | Yes | Yes |
| Exercises (free only) | Yes | Yes | Yes | Yes |
| Exercises (premium) | No | Yes | Yes | Yes |
| 2-week planner | Yes | Yes | Yes | Yes |
| Month/3-month/season planner | No | Yes | Yes | Yes |
| Submit exercise (1x/year) | Yes | No | No | No |
| Submit exercise (unlimited) | No | Yes | Yes | Yes |
| Animated tactic board + 5 saves | No | Yes | Yes | Yes |
| Verified badge | No | Yes | Yes | Yes |
| National calendar insert | No | Yes | No | Yes |
| Match maker | No | Yes | No | Yes |
| Marketplace listing | No | No | Yes | No |
| Profile analytics | No | No | Yes | Yes |
| Featured profile | No | No | Yes | No |
| Multi-user accounts (5-10) | No | No | No | Yes |
| Internal club tools | No | No | No | Yes |
| Webshop link | No | No | No | Yes |
| Post vacancies | No | No | No | Yes |

### Enforcement Points

1. **Database level (RLS)** — premium exercises filtered by subscription
2. **API route level** — check tier before allowing actions (e.g., submit exercise)
3. **UI level** — show/hide features, show upgrade prompts with lock icons on premium content
4. **Middleware level** — route-level access control for premium-only pages

---

## 11. Real-Time Features

### What Needs Real-Time

| Feature | Supabase Channel | Trigger |
|---------|-----------------|---------|
| Chat messages | `messages:{conversationId}` | INSERT on messages table |
| Notifications | `notifications:{userId}` | INSERT on notifications table |
| Feed updates | `feed:{userId}` | INSERT on posts (from followed users) |
| Match requests | `match_requests:{district}` | INSERT/UPDATE on match_requests |

### Notification Delivery Strategy

```
Event occurs (new message, like, follow, etc.)
     │
     ▼
Database trigger → inserts into notifications table
     │
     ├──▶ Supabase Realtime → pushes to connected web clients
     │
     └──▶ Supabase Edge Function (cron or trigger)
              │
              ├──▶ Expo Push API → mobile push notification
              └──▶ Resend API → email notification (if user preference)
```

---

## 12. File Storage & Media

### Supabase Storage Buckets

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('covers', 'covers', true),
  ('exercises', 'exercises', true),        -- Exercise images/diagrams
  ('exercise-videos', 'exercise-videos', false),  -- Premium video content
  ('post-media', 'post-media', true),
  ('club-logos', 'club-logos', true),
  ('cvs', 'cvs', false),                  -- Job application CVs
  ('marketplace', 'marketplace', true);

-- Storage policies
CREATE POLICY "Avatar upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public avatar access" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
```

### Upload Helper

```typescript
// lib/upload.ts
import { createClient } from '@/lib/supabase/client'

export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<string> {
  const supabase = createClient()

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (error) throw error

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
```

---

## 13. Deployment & Infrastructure

### Production Architecture

```
                    ┌─────────────────┐
                    │   Cloudflare    │  DNS + CDN + DDoS protection
                    │   (optional)    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │     Vercel      │  Next.js hosting
                    │  (Edge Network) │  Auto-scaling, preview deploys
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐
     │   Supabase    │ │  Stripe  │ │   Resend   │
     │  (Database,   │ │ Payments │ │   Emails   │
     │   Auth, RT,   │ │          │ │            │
     │   Storage)    │ │          │ │            │
     └───────────────┘ └──────────┘ └────────────┘
```

### Environment Variables

```env
# .env.local (NEVER commit this file)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...     # Server-only, NEVER expose to client

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PREMIUM_COACH_PRICE_ID=price_...
STRIPE_PRO_SERVICE_PRICE_ID=price_...
STRIPE_CLUB_LICENSE_PRICE_ID=price_...

# Email
RESEND_API_KEY=re_...

# App
NEXT_PUBLIC_APP_URL=https://elite-connect.pt
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm test

  # Vercel handles deployment automatically via GitHub integration
```

### Cost Estimate (Monthly)

| Service | Tier | Estimated Cost |
|---------|------|---------------|
| Vercel | Pro | ~€20/mo |
| Supabase | Pro | ~€25/mo |
| Stripe | Pay-as-you-go | 1.4% + €0.25 per transaction (EU cards) |
| Resend | Free → Pro | €0-20/mo |
| Domain | .pt | ~€10/year |
| **Total (start)** | | **~€50-70/mo** |

---

## 14. Security Considerations

### Critical Security Measures

1. **Row Level Security (RLS)** — every table must have RLS enabled. No exceptions.
2. **Service role key** — NEVER exposed to client. Only used in API routes and webhooks.
3. **Input validation** — Zod schemas on every API route and form.
4. **CSRF protection** — built into Next.js Server Actions.
5. **Rate limiting** — Vercel's built-in rate limiting on API routes.
6. **Content moderation** — admin approval queue for user-submitted exercises.
7. **File upload validation** — check MIME types, file sizes, scan for malicious content.
8. **Stripe webhook verification** — always verify signatures.
9. **SQL injection** — Supabase client uses parameterized queries by default.
10. **XSS** — React auto-escapes by default; use DOMPurify for any `dangerouslySetInnerHTML`.

### Data Privacy (GDPR — Portugal/EU)

- Cookie consent banner
- Privacy policy page
- Data export functionality (user can download their data)
- Account deletion (cascade delete all user data)
- Consent tracking for marketing emails

---

## 15. Third-Party Integrations

| Service | Purpose | When Needed |
|---------|---------|-------------|
| **Supabase** | Database, Auth, Realtime, Storage, Edge Functions | Phase 1 |
| **Stripe** | Subscriptions, marketplace payments, Stripe Connect | Phase 4 (basic in Phase 1 for subscriptions) |
| **Resend** | Transactional emails (verification, notifications) | Phase 1 |
| **Vercel** | Hosting, edge functions, preview deploys | Phase 1 |
| **Expo Push** | Mobile push notifications | Phase 3 |
| **Cloudflare** | CDN, DDoS protection (optional) | When traffic grows |
| **Sentry** | Error tracking and monitoring | Phase 1 |
| **PostHog / Plausible** | Analytics (privacy-friendly) | Phase 1 |
| **Lottie** | Exercise animations (if using Lottie format) | Phase 1 |

---

## 16. Project Structure

### Final Monorepo Layout

```
elite-connect/
├── apps/
│   ├── web/                          # Next.js 15 (App Router)
│   │   ├── src/
│   │   │   ├── app/                  # Pages and routes
│   │   │   ├── components/           # React components
│   │   │   │   ├── ui/              # shadcn/ui base components
│   │   │   │   ├── exercises/       # Exercise-related components
│   │   │   │   ├── feed/            # Social feed components
│   │   │   │   ├── messaging/       # Chat components
│   │   │   │   ├── tactic-board/    # Canvas-based tactic board
│   │   │   │   ├── calendar/        # Calendar/planner components
│   │   │   │   ├── marketplace/     # Marketplace components
│   │   │   │   └── layout/          # Navbar, sidebar, footer
│   │   │   ├── hooks/               # Custom React hooks
│   │   │   ├── lib/                 # Utilities, Supabase client, helpers
│   │   │   ├── actions/             # Server Actions
│   │   │   └── types/               # TypeScript types
│   │   ├── public/                  # Static assets
│   │   └── next.config.ts
│   │
│   └── mobile/                      # Expo React Native (Phase 3)
│       ├── app/                     # Expo Router
│       ├── components/
│       └── hooks/
│
├── packages/
│   ├── ui/                          # Shared UI primitives
│   ├── db/                          # Supabase client + generated types
│   │   ├── src/
│   │   │   ├── client.ts           # Browser client
│   │   │   ├── server.ts           # Server client
│   │   │   ├── types.ts            # Generated from Supabase
│   │   │   └── queries/            # Reusable query functions
│   │   └── package.json
│   ├── validators/                  # Zod schemas
│   │   ├── src/
│   │   │   ├── exercise.ts
│   │   │   ├── profile.ts
│   │   │   ├── post.ts
│   │   │   └── index.ts
│   │   └── package.json
│   └── config/                      # Shared ESLint, TS configs
│
├── supabase/
│   ├── migrations/                  # SQL migration files
│   │   ├── 00001_create_profiles.sql
│   │   ├── 00002_create_exercises.sql
│   │   ├── 00003_create_social.sql
│   │   ├── 00004_create_messaging.sql
│   │   ├── 00005_create_marketplace.sql
│   │   └── 00006_create_rls_policies.sql
│   ├── functions/                   # Edge Functions
│   │   ├── send-notification/
│   │   └── cron-subscription-check/
│   ├── seed.sql
│   └── config.toml
│
├── .github/
│   └── workflows/
│       └── ci.yml
├── turbo.json
├── package.json
├── pnpm-workspace.yaml
└── .env.local.example
```

---

## 17. Development Timeline Estimate

### Phase 1 — MVP Website

| Task | Estimated Effort |
|------|-----------------|
| Project setup, Supabase, Vercel | 1 week |
| Auth + onboarding flow | 1 week |
| Profile pages (CRUD) | 1 week |
| Exercise library (browse, filter, detail) | 2 weeks |
| Exercise submission + admin moderation | 1 week |
| Basic tactic board (static) | 1.5 weeks |
| Season planner (2-week for free tier) | 1.5 weeks |
| Basic social feed | 1 week |
| Landing pages (home, about, features, pricing) | 1 week |
| Responsive design + polish | 1 week |
| Testing + bug fixes | 1 week |
| **Phase 1 Total** | **~12-13 weeks** |

### Phase 2 — Networking

| Task | Estimated Effort |
|------|-----------------|
| Follow/connect system | 1 week |
| Enhanced feed with algorithm | 1 week |
| Real-time messaging | 2 weeks |
| Notification system (in-app + email) | 1.5 weeks |
| Job board + application flow | 1.5 weeks |
| Discussion forum | 1.5 weeks |
| National match calendar | 1 week |
| Testing + bug fixes | 1 week |
| **Phase 2 Total** | **~10-11 weeks** |

### Phase 3 — Mobile Apps

| Task | Estimated Effort |
|------|-----------------|
| Expo setup + shared packages | 1 week |
| Auth flow (mobile) | 0.5 weeks |
| Exercise library + offline | 2 weeks |
| Feed + messaging | 2 weeks |
| Push notifications | 1 week |
| Calendar + match views | 1 week |
| App store submission + review | 1 week |
| **Phase 3 Total** | **~8-9 weeks** |

### Phase 4 — Marketplace & Payments

| Task | Estimated Effort |
|------|-----------------|
| Stripe subscriptions (all tiers) | 1.5 weeks |
| Stripe webhook handling | 1 week |
| Marketplace listings CRUD | 1.5 weeks |
| Stripe Connect (seller payouts) | 1.5 weeks |
| Match Maker feature | 1.5 weeks |
| Advanced tactic board (animation) | 2 weeks |
| Club license features (multi-user, internal tools) | 2 weeks |
| Testing + bug fixes | 1 week |
| **Phase 4 Total** | **~12-13 weeks** |

### Summary

| Phase | Duration | Running Total |
|-------|----------|---------------|
| Phase 1 — MVP | ~13 weeks | 13 weeks |
| Phase 2 — Networking | ~11 weeks | 24 weeks |
| Phase 3 — Mobile | ~9 weeks | 33 weeks |
| Phase 4 — Marketplace | ~13 weeks | 46 weeks |

> **Note:** These estimates assume a single full-time developer. With 2 developers working in parallel on frontend and backend/database, timelines can be reduced by ~35-40%.

---

## Appendix: Key Technical Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend framework | Next.js API Routes (NOT NestJS) | Supabase handles 80% of backend concerns; separate backend adds unnecessary deployment complexity for MVP |
| Database | Supabase (PostgreSQL) | RLS, Realtime, Auth, Storage in one managed service |
| Auth | Supabase Auth | Integrated with RLS, supports OAuth, JWT-based, no extra service needed |
| Tactic board | Konva.js (react-konva) | Best React canvas library for drag-and-drop, shapes, animations |
| Calendar | FullCalendar | Mature, feature-rich, supports drag-and-drop, integrates with React |
| Payments | Stripe | Industry standard, supports subscriptions + Connect for marketplace |
| Mobile | Expo (React Native) | Code sharing with web (React), near-native performance, OTA updates |
| Monorepo | Turborepo | Shared types/validators between web and mobile, fast builds |
| Hosting | Vercel | Optimized for Next.js, edge network, zero-config deployment |
| UI | Tailwind + shadcn/ui | Fast development, consistent design, accessible components |
