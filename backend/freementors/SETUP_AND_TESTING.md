# Free Mentors — Remote Setup & Testing Guide

A complete guide for cloning, running, and testing the Free Mentors GraphQL backend on any machine (local laptop, VM, or cloud server).

> **Database requirement:** This project uses **MongoDB** (via Djongo). Set the `MONGO_URI` env var before running migrations. SQLite is supported only as a development fallback when `MONGO_URI` is unset.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone & Install](#2-clone--install)
3. [Environment Configuration](#3-environment-configuration)
4. [Database Setup](#4-database-setup)
5. [Running the Server](#5-running-the-server)
6. [Running with Docker](#6-running-with-docker)
7. [Running with MongoDB](#7-running-with-mongodb)
8. [Running the Test Suite](#8-running-the-test-suite)
9. [Manual API Testing](#9-manual-api-testing)
10. [Common Issues & Troubleshooting](#10-common-issues--troubleshooting)

---

## 1. Prerequisites

| Tool        | Version | Purpose                     |
| ----------- | ------- | --------------------------- |
| Python      | 3.10+   | Runtime                     |
| pip         | 22+     | Package manager             |
| git         | any     | Clone the repo              |
| Docker      | 20+     | Optional containerized runs |
| MongoDB     | 4.x     | Optional production DB      |
| curl / Postman / Insomnia | any | API testing                |

Verify Python:

```bash
python --version    # should print Python 3.10.x or higher
pip --version
```

---

## 2. Clone & Install

```bash
# Clone the repo
git clone <YOUR_REPO_URL>
cd <repo>/freementors

# Create a virtual environment (recommended)
python -m venv .venv
source .venv/bin/activate         # macOS / Linux
# .venv\Scripts\activate          # Windows PowerShell

# Install dependencies
pip install -r requirements.txt
```

The `requirements.txt` covers everything: Django, Graphene, JWT, CORS, pytest, etc.

---

## 3. Environment Configuration

Create a `.env` file in the `freementors/` directory (or export these in your shell):

```bash
# Required for production — random 50+ char string
export SECRET_KEY="your-very-long-random-secret-key-here"

# Optional — defaults to True
export DEBUG=True

# Optional — server port (default 8000)
export PORT=8000

# Optional — switch to MongoDB. Leave unset to use SQLite.
# export MONGO_URI="mongodb://localhost:27017"
# export MONGO_URI="mongodb+srv://user:pass@cluster.mongodb.net"
```

If you skip `SECRET_KEY` entirely, a development default is used. **Never deploy without a real `SECRET_KEY`.**

---

## 4. Database Setup

### Verify MongoDB connection (recommended first step)

Before migrating, run the included connection check:

```bash
MONGO_URI="mongodb://localhost:27017" python scripts/check_mongo.py
```

This confirms pymongo can reach your MongoDB server, reports the server version, and verifies Django + Djongo can open a connection through the ORM. Fix any errors here before continuing.

### Run migrations

```bash
export MONGO_URI="mongodb://localhost:27017"
python manage.py migrate --run-syncdb
```

This creates all collections (`users_customuser`, `mentorship_mentorshipsession`, `mentorship_review`, plus Django's built-in tables) in your MongoDB instance under the `freementors` database. If `MONGO_URI` is unset, Django falls back to a local `db.sqlite3` file (development only).

### Seed the database

```bash
# Seed (skips items that already exist)
python manage.py seed_db

# Wipe and re-seed from scratch
python manage.py seed_db --clear
```

This inserts:

- **1 admin** — `admin@freementors.com`
- **3 mentors** — Tech / Finance / Health
- **5 users** — distinct occupations
- **7 sessions** — 2 PENDING, 2 ACCEPTED, 1 REJECTED, 2 COMPLETED
- **3 reviews** — 1 hidden

**Universal password:** `Password123!`

---

## 5. Running the Server

```bash
python manage.py runserver 0.0.0.0:8000
```

You should see:

```
Django version 4.2.9, using settings 'freementors_project.settings'
Starting development server at http://0.0.0.0:8000/
```

### Endpoints

| URL                          | Description                                    |
| ---------------------------- | ---------------------------------------------- |
| `http://HOST:8000/graphql/`  | GraphQL endpoint (POST) + GraphiQL UI (GET)   |
| `http://HOST:8000/admin/`    | Django admin panel                             |

For production, use gunicorn instead of `runserver`:

```bash
pip install gunicorn
gunicorn freementors_project.wsgi --bind 0.0.0.0:8000 --workers 4
```

---

## 6. Running with Docker

### Build and run

```bash
cd freementors

# Build image
docker build -t freementors-api .

# Run container (SQLite mode)
docker run -p 8000:8000 \
  -e SECRET_KEY="your-secret-key" \
  -e DEBUG=False \
  freementors-api

# Run container with MongoDB
docker run -p 8000:8000 \
  -e SECRET_KEY="your-secret-key" \
  -e MONGO_URI="mongodb://host.docker.internal:27017" \
  freementors-api
```

### docker-compose example

Create `docker-compose.yml` in `freementors/`:

```yaml
version: "3.9"
services:
  mongo:
    image: mongo:5
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      SECRET_KEY: "your-secret-key"
      MONGO_URI: "mongodb://mongo:27017"
      DEBUG: "False"
    depends_on:
      - mongo
    command: >
      sh -c "python manage.py migrate --run-syncdb &&
             python manage.py seed_db &&
             python manage.py runserver 0.0.0.0:8000"

volumes:
  mongo_data:
```

Run with:

```bash
docker-compose up --build
```

---

## 7. Running with MongoDB

The project uses **Djongo** as the connector. Note that Djongo requires `pymongo<4`, which is reflected in `requirements.txt`.

### Local MongoDB

```bash
# Install MongoDB Community Edition (macOS via Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Or run via Docker
docker run -d -p 27017:27017 --name mongo mongo:5

# Set the env var and start the server
export MONGO_URI="mongodb://localhost:27017"
python manage.py migrate --run-syncdb
python manage.py seed_db
python manage.py runserver 0.0.0.0:8000
```

### MongoDB Atlas (cloud)

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com).
2. Add your IP to the network access list (or `0.0.0.0/0` for testing).
3. Create a database user.
4. Get the connection string and export it:

```bash
export MONGO_URI="mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"
```

5. Run migrations and seed as usual.

---

## 8. Running the Test Suite

```bash
# Run all tests with coverage
python -m pytest tests/ -v --cov=. --cov-report=term-missing

# Run a specific test file
python -m pytest tests/test_auth.py -v

# Run a single test
python -m pytest tests/test_auth.py::TestLogin::test_login_returns_jwt_token -v

# HTML coverage report
python -m pytest tests/ --cov=. --cov-report=html
open htmlcov/index.html
```

### Expected output

```
collected 22 items

tests/test_auth.py::TestRegistration::test_registration_creates_user_with_default_role PASSED
tests/test_auth.py::TestRegistration::test_registration_fails_with_duplicate_email   PASSED
tests/test_auth.py::TestRegistration::test_registration_stores_hashed_password       PASSED
tests/test_auth.py::TestLogin::test_login_returns_jwt_token                          PASSED
tests/test_auth.py::TestLogin::test_login_fails_with_wrong_password                  PASSED
tests/test_auth.py::TestLogin::test_login_fails_with_nonexistent_email               PASSED
tests/test_business_logic.py::...                                                    PASSED (9 tests)
tests/test_permissions.py::...                                                       PASSED (7 tests)

============================== 22 passed in 5.70s ==============================

Coverage: 66%
```

### Test categories

| File                           | What it tests                                                    |
| ------------------------------ | ---------------------------------------------------------------- |
| `tests/test_auth.py`           | Registration, login, JWT issuance, password hashing              |
| `tests/test_permissions.py`    | Role-based access control (admin-only queries, role mutations)   |
| `tests/test_business_logic.py` | Session creation defaults, mentor scoping, role-based queries    |

---

## 9. Manual API Testing

The server exposes a single GraphQL endpoint at `/graphql/`. The easiest way to explore is the built-in **GraphiQL UI** at `http://HOST:8000/graphql/` (just visit in a browser).

### Headers

For any authenticated request, include the JWT in the header:

```
Authorization: Bearer <YOUR_JWT_TOKEN>
Content-Type: application/json
```

### Example requests (curl)

#### 1. List all mentors (public)

```bash
curl -X POST http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -d '{"query": "{ allMentors { id email firstName lastName expertise role } }"}'
```

#### 2. Register a new user

```bash
curl -X POST http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation Register($email: String!, $password: String!, $firstName: String!, $lastName: String!) { register(email: $email, password: $password, firstName: $firstName, lastName: $lastName) { success errors user { id email role } } }",
    "variables": {
      "email": "newuser@test.com",
      "password": "MyPassword123!",
      "firstName": "Jane",
      "lastName": "Doe"
    }
  }'
```

#### 3. Login (returns JWT)

```bash
curl -X POST http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { login(email: \"admin@freementors.com\", password: \"Password123!\") { success token user { email role } } }"
  }'
```

Save the `token` from the response — you'll use it next.

#### 4. Authenticated query — `me`

```bash
TOKEN="paste-your-jwt-here"

curl -X POST http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query": "{ me { id email role firstName lastName } }"}'
```

#### 5. Admin-only query — `allUsers`

```bash
# Login as admin first to get a token, then:
curl -X POST http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"query": "{ allUsers { id email role } }"}'
```

If you use a non-admin token, you get `"Admin access required."`

#### 6. Create a mentorship session

```bash
# Login as a regular user, then:
curl -X POST http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "query": "mutation CreateSession($mentorId: ID!, $questions: String!) { createSession(mentorId: $mentorId, questions: $questions) { success errors session { id status questions } } }",
    "variables": {
      "mentorId": "2",
      "questions": "How should I prepare for my first tech interview?"
    }
  }'
```

#### 7. Mentor accepts a session

```bash
# Login as the mentor who owns the session, then:
curl -X POST http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MENTOR_TOKEN" \
  -d '{
    "query": "mutation { updateSessionStatus(sessionId: \"1\", status: \"ACCEPTED\") { success errors session { id status } } }"
  }'
```

#### 8. List my sessions (role-aware)

```bash
curl -X POST http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query": "{ mySessions { id status questions mentor { email } mentee { email } } }"}'
```

- If you're a USER → returns sessions you requested.
- If you're a MENTOR → returns sessions assigned to you.

#### 9. Admin toggles a user to mentor

```bash
curl -X POST http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "query": "mutation { toggleMentorStatus(userId: \"5\") { success errors user { email role } } }"
  }'
```

#### 10. Hide a review (admin only)

```bash
curl -X POST http://localhost:8000/graphql/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "query": "mutation { hideReview(reviewId: \"1\") { success errors review { id isHidden remark } } }"
  }'
```

### Postman / Insomnia collection

If you prefer a GUI client:

1. Set the URL to `http://HOST:8000/graphql/` (POST).
2. Set body to `JSON`.
3. Use the structure: `{ "query": "...", "variables": {...} }`.
4. For auth, set header: `Authorization: Bearer <token>`.

---

## 10. Common Issues & Troubleshooting

### `Port 8000 already in use`

```bash
# Find what's on it
lsof -i :8000          # macOS / Linux
netstat -ano | findstr :8000   # Windows

# Run on a different port
python manage.py runserver 0.0.0.0:8001
```

### `ModuleNotFoundError: No module named 'django'`

You forgot to activate your virtualenv or install requirements:

```bash
source .venv/bin/activate
pip install -r requirements.txt
```

### `OperationalError: no such table: users_customuser`

Migrations haven't been applied:

```bash
python manage.py migrate --run-syncdb
```

### `Authentication credentials were not provided` (in GraphQL response)

You forgot the `Authorization: Bearer <token>` header, or the token has expired (default expiry: 30 days). Login again to get a fresh token.

### `Signature has expired`

JWT tokens expire after 30 days. Re-login to get a new one. To customize, edit `GRAPHQL_JWT["JWT_EXPIRATION_DELTA"]` in `freementors_project/settings.py`.

### `djongo` install errors on Python 3.10+

Djongo can have compatibility issues with newer Python versions. The project defaults to SQLite — only install MongoDB packages if you actually need MongoDB:

```bash
pip install "djongo==1.3.6" "pymongo==3.12.3"
```

If installation still fails, use SQLite (omit `MONGO_URI`) — all functionality works identically.

### `CORS error` from a frontend

The backend already has `CORS_ALLOW_ALL_ORIGINS = True` for `/graphql/*` paths. If you need to restrict origins for production, edit `freementors_project/settings.py`:

```python
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "https://your-frontend-domain.com",
    "http://localhost:3000",
]
```

### Tests fail with `database is locked`

SQLite doesn't handle concurrent writes well. If you're running tests while the dev server is hitting the DB, stop the server first.

---

## Quick Reference — Sample Workflow

```bash
# 1. Setup
git clone <repo> && cd <repo>/freementors
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 2. Initialize DB
python manage.py migrate --run-syncdb
python manage.py seed_db

# 3. Run tests
python -m pytest tests/ -v

# 4. Start server
python manage.py runserver 0.0.0.0:8000

# 5. Open GraphiQL in your browser
open http://localhost:8000/graphql/
```

---

## Need help?

- **GraphiQL UI** at `/graphql/` is the fastest way to explore the schema interactively.
- The full schema is auto-introspectable: any GraphQL client (Postman, Insomnia, Apollo Studio) can pull the docs directly.
- Check the test files in `tests/` for examples of every query and mutation in action.
