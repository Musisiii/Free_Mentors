# Free Mentors

A full-stack mentorship platform:
- Users/Mentees browse mentors, request 1-on-1 sessions, and leave reviews.
- Mentors accept or decline.
- Admins moderate the app.

## Stack

- **Backend** — Django 5 + Graphene-Django (GraphQL), JWT auth.
- **Database** — MongoDB via Djongo.
- **Frontend** — React 18 + TypeScript + Vite + MUI v6 + Zustand + TanStack Query.
- **Tests** — pytest (backend), Vitest + React Testing Library (frontend).
- **Infra** — Docker + docker-compose (Django backend + nginx-served frontend bundle).

Single GraphQL endpoint: `/graphql/` (GraphiQL enabled in dev).

---

## Quick start

**Prerequisites:** Python 3.11+, Node 20+, Docker 24+.

### Backend
```bash
cd freementors
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\Activate
pip install -r requirements.txt
python manage.py migrate --run-syncdb
python manage.py seed_db
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173 — GraphQL: http://localhost:8000/graphql/

### Docker
```bash
docker compose up --build      # backend on 8000, frontend on 5173
docker compose down
```

---

## Test accounts

Created by `seed_db`. Password for all: `Password123!`.

| Role   | Email                          |
| ------ | ------------------------------ |
| Admin  | `admin@freementors.com`        |
| Mentor | `mentor1.free@freementors.com` |
| User   | `user1.free@freementors.com`   |

---

## Testing

```bash
# Backend
cd freementors && pytest

# Frontend
cd frontend
npm test                # one-shot
npm run test:coverage   # HTML + lcov in coverage/
```

---

## Notes

- Auth token persisted in `localStorage["free_mentors_token"]` - refresh keeps the user signed in.
- Routes guarded by `<ProtectedRoute>` / `<RedirectIfAuthed>` - role mismatches redirect to landing, no auth token redirects to login page.
- MUI theme lives in `src/lib/muiTheme.ts` — primary HSL `127 19% 28%`.
