# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

Development:
- `npm run dev` - Start development server with Vite HMR
- `npm run build` - Build for production (TypeScript compile + Vite build)
- `npm run lint` - Run ESLint checks
- `npm run preview` - Preview production build

## High-Level Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Authentication**: Clerk (OAuth provider)
- **Database**: Supabase with Row Level Security (RLS)
- **Routing**: React Router DOM v7
- **Styling**: CSS + CSS modules

### Authentication Flow
The app uses Clerk for authentication with Supabase integration:
- Clerk provides JWT tokens with `user_id` claim
- Supabase RLS policies verify `auth.jwt() ->> 'user_id'` matches `clerk_user_id`
- User records are auto-created in Supabase on first login
- Protected routes use `<SignedIn>` and `<SignedOut>` wrapper components

### Database Architecture
Supabase tables with RLS:
- `users` - Maps Clerk user IDs to internal Supabase user IDs
- `workout_templates` - User's saved workout plans
- `exercise_templates` - Exercises within workout templates
- `workout_instances` - Logged workout sessions
- `exercise_logs` - Individual exercise performance data
- `body_weight_logs` - User weight tracking

### Key Components Structure
- **Pages**: Route-level components in `src/pages/`
- **Components**: Reusable UI components in `src/components/`
- **Utils**: 
  - `SupaBase.ts` - Core workout CRUD operations and business logic
  - `supabaseClient.ts` - Authenticated Supabase client setup
  - `types.ts` - TypeScript interfaces for workouts, exercises, sets
  - `localStorage.ts` - Local storage utilities

### Data Flow
1. Clerk authenticates users and provides JWT tokens
2. `useSupabaseClient()` hook creates authenticated Supabase client
3. `SupaBase.ts` functions handle all workout/exercise CRUD operations
4. Components use these functions for data persistence
5. RLS policies ensure users only access their own data

### Environment Variables Required
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk authentication
- `VITE_SUPABASE_URL` - Supabase project URL  
- `VITE_SUPABASE_KEY` - Supabase anon key

### Key Business Logic
- Exercise names are normalized to uppercase for consistency
- Workout progression calculations based on RPE (Reps in Reserve)
- Fresh workout instances created daily (clears logs but preserves template)
- UUID generation using uuidv5 for deterministic IDs from Clerk user IDs