# 🚀 BACKEND GENERATION PROMPT: Free Mentors

Build a robust **GraphQL Backend** using:
*   **Language/Framework:** Python, Django 4.x
*   **API Layer:** Graphene-Django (GraphQL)
*   **Database:** MongoDB via Djongo (Connector)
*   **Authentication:** JWT (JSON Web Tokens) with `django-graphql-jwt`
*   **Testing:** Pytest-Django

---

## 1. DATABASE SCHEMA & MODELS
All models must support MongoDB (Object IDs) but maintain Django relational logic where possible.

### A. CustomUser Model (Inherits `AbstractUser`)
*   `id`: UUID or AutoField
*   `email`: EmailField (Unique, used as Username)
*   `password`: String (Hashed)
*   `firstName`: String
*   `lastName`: String
*   `address`: String
*   `bio`: Long Text (Blank=True)
*   `occupation`: String
*   `expertise`: String (Specific to Mentors, e.g., "Tech", "Finance")
*   `role`: CharField / Enum
    *   Choices: `ADMIN`, `MENTOR`, `USER` (Default: `USER`)

### B. MentorshipSession Model
*   `id`: UUID or AutoField
*   `mentee`: ForeignKey to `CustomUser` (on_delete=CASCADE)
*   `mentor`: ForeignKey to `CustomUser` (on_delete=CASCADE)
*   `questions`: Long Text (The user's request details)
*   `status`: CharField / Enum
    *   Choices: `PENDING`, `ACCEPTED`, `REJECTED`, `COMPLETED` (Default: `PENDING`)
*   `created_at`: DateTimeField (auto_now_add=True)

### C. Review Model
*   `id`: UUID or AutoField
*   `mentor`: ForeignKey to `CustomUser`
*   `mentee`: ForeignKey to `CustomUser`
*   `remark`: Long Text
*   `score`: Integer (1 to 5)
*   `is_hidden`: Boolean (Default: `False`)

---

## 2. API LAYER (GRAPHQL)

### A. Queries
Implement the following resolvers with appropriate permission checks:
*   `allMentors`: Returns list of Users where `role='MENTOR'`.
*   `mentorDetail(id)`: Returns specific mentor profile.
*   `mySessions`: 
    *   If user is MENTEE: Returns sessions they requested.
    *   If user is MENTOR: Returns sessions requested from them.
*   `allUsers`: **(Admin Only)** Returns all registered users.
*   `allReviews`: Returns all reviews where `is_hidden=False`.

### B. Mutations
*   **Auth:**
    *   `register`: Creates a new User (Default role: USER).
    *   `login`: Validates credentials and returns a JWT.
*   **Mentorship:**
    *   `createSession(mentorId, questions)`: Logged-in User creates a PENDING session.
    *   `updateSessionStatus(sessionId, status)`: **(Mentor Only)** Change status to ACCEPTED or REJECTED.
*   **Admin Actions:**
    *   `toggleMentorStatus(userId)`: Changes a USER role to MENTOR or vice-versa.
    *   `addAdmin(email)`: Upgrades a user to ADMIN role.
    *   `hideReview(reviewId)`: Toggles the `is_hidden` boolean on a review.

---

## 3. CORE LOGIC & PERMISSIONS
*   **JWT Middleware:** All requests must check for `Authorization: Bearer <token>` in the header.
*   **Role Enforcement:** 
    *   Only `ADMIN` can access `allUsers`.
    *   Only `MENTOR` can accept/reject sessions assigned to them.
    *   Users cannot review a mentor unless they have had an `COMPLETED` session with them.

---

## 4. SEEDING ENGINE (`management/commands/seed_db.py`)
Create a command to populate the database with the following:
*   **Password for all:** `Password123!`
*   **Admin:** 1 account (`admin@freementors.com`).
*   **Users/Mentees:** 5 accounts with distinct occupations. (user1.free..., user2.free...,...)
*   **Mentors:** 3 accounts with expertise in "Tech", "Finance", and "Health". (mentor1.free...,...)
*   **Sessions:** 
    *   2 PENDING, 2 ACCEPTED, 1 REJECTED.
*   **Reviews:** 3 total, with 1 marked as `is_hidden=True`.

---

## 5. QUALITY ASSURANCE (TDD)
Setup `pytest` to verify the following (Aim for >60% coverage):

1.  **Auth Tests:**
    *   Registration creates a user in MongoDB.
    *   Login returns a valid JWT.
    *   Invalid credentials return a GraphQL error.
2.  **Permission Tests:**
    *   A standard USER cannot call `allUsers`.
    *   A USER cannot change their own role to ADMIN.
3.  **Business Logic Tests:**
    *   Creating a session defaults to `PENDING`.
    *   A mentor cannot accept a session that isn't theirs.

---

## 6. INFRASTRUCTURE & DOCKER
*   **Dockerfile:** Use `python:3.10-slim`. Include `pip install` for `django`, `graphene-django`, `djongo`, `django-graphql-jwt`, `pytest`.
*   **Environment Variables:**
    *   `SECRET_KEY`
    *   `MONGO_URI` (Local or Atlas)
    *   `DEBUG=True`
*   **CORS:** Configure `django-cors-headers` to allow requests from the frontend port.