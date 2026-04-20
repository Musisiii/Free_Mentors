# Free Mentors — Frontend

React + Vite + TypeScript client for the Free Mentors platform. Talks to the
Django/GraphQL backend in `../freementors/`.

## Stack

- Vite 7 + React 18 + TypeScript
- Tailwind CSS + shadcn/ui (Radix primitives)
- TanStack Query for data fetching/caching
- Zustand (with `persist`) for auth state
- Axios as the HTTP transport for GraphQL requests
- React Router v6
- React Hook Form + Zod (available; used as needed)

## Getting started

```bash
# 1. Install deps
npm install

# 2. Configure environment
cp .env.example .env

# 3. Start the backend (in a separate terminal, from the repo root)
cd ../freementors
python manage.py migrate --run-syncdb
python manage.py seed_db
python manage.py runserver 0.0.0.0:8000

# 4. Start the frontend
npm run dev
```

The dev server runs at <http://localhost:5173>. All `/graphql` requests are
proxied to `VITE_BACKEND_URL` (defaults to `http://localhost:8000`).

## Environment variables

| Variable             | Purpose                                                                      |
| -------------------- | ---------------------------------------------------------------------------- |
| `VITE_BACKEND_URL`   | Origin of the Django backend. Used by the Vite dev proxy. Default `http://localhost:8000`. |
| `VITE_GRAPHQL_URL`   | Path or absolute URL the client posts queries to. Default `/graphql/` (uses dev proxy). |

## Test accounts

`python manage.py seed_db` creates these accounts (all share the same password):

| Role   | Email                            | Password       |
| ------ | -------------------------------- | -------------- |
| Admin  | `admin@freementors.com`          | `Password123!` |
| Mentor | `mentor1.free@freementors.com`   | `Password123!` |
| Mentor | `mentor2.free@freementors.com`   | `Password123!` |
| Mentor | `mentor3.free@freementors.com`   | `Password123!` |
| User   | `user1.free@freementors.com` … `user5.free@freementors.com` | `Password123!` |

The login screen lets you click any test account to autofill the form.

## Project structure

```
src/
  App.tsx                Root routes + auth bootstrap
  main.tsx               React entry point
  index.css              Tailwind base + design tokens
  lib/
    graphql.ts           Axios-based GraphQL client (`gql(query, variables)`)
    queries.ts           All query/mutation strings, centralised
    axios.ts             Back-compat re-export of the GraphQL client
    utils.ts             cn() helper from shadcn
  stores/
    authStore.ts         Zustand store (persists JWT + user)
  components/
    layout/MainLayout.tsx
    ProtectedRoute.tsx   Role-aware route guard
    sessions/            Session request + review modals
    admin/AddAdminDialog.tsx
    ui/                  shadcn/ui primitives
  pages/
    LandingPage.tsx
    LoginPage.tsx        login mutation
    RegisterPage.tsx     register + auto-login
    MentorsPage.tsx      allMentors with search filter
    MentorDetailPage.tsx mentorDetail + reviews + request modal
    UserDashboardPage.tsx     mySessions + review CTA
    MentorDashboardPage.tsx   mySessions + accept/reject/complete
    AdminDashboardPage.tsx    allUsers + reviews moderation + add admin
    NotFound.tsx
```

## Authentication

- The backend uses GraphQL JWT (`graphql_jwt`).
- After `login`, the JWT is stored in `localStorage` under `free_mentors_token`
  and added to every request as the `Authorization: JWT <token>` header by the
  axios interceptor in `src/lib/graphql.ts`.
- On boot, `App.tsx` calls the `me` query to validate the persisted token.

## Backend GraphQL operations used

Queries: `me`, `allMentors`, `mentorDetail(id)`, `allUsers`, `mySessions`,
`allReviews`.

Mutations: `register`, `login`, `createSession`, `updateSessionStatus`,
`createReview`, `hideReview`, `toggleMentorStatus`, `addAdmin`.

See `src/lib/queries.ts` for the exact strings and `freementors/freementors_project/schema.py`
for the backend schema definition.
