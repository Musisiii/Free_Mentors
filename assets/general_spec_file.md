# Development Specification: Free Mentors

## 1. Project Overview & Architecture
*   **Frontend:** ReactJS (Vite), Material UI (MUI), Redux Toolkit.
*   **Backend:** Django, Graphene (GraphQL), Djongo (MongoDB Connector).
*   **Database:** MongoDB (Local or Atlas).
*   **Auth:** JWT (JSON Web Tokens) passed via `Authorization: Bearer <token>`.
*   **Containerization:** Docker & Docker Compose (Configs provided for submission, dev handled locally).

---

## 2. Backend Specification (Django + GraphQL)

### A. Database Models & Schema
To allow flexibility for potential SQL migration, use standard Django Model fields.
*   **CustomUser:** Inherits `AbstractUser`.
    *   Fields: `email` (Unique), `address`, `bio`, `occupation`, `expertise`, `role` (Choices: `ADMIN`, `MENTOR`, `USER`).
*   **MentorshipSession:** 
    *   Fields: `mentee` (FK to User), `mentor` (FK to User), `questions` (Text), `status` (Choices: `PENDING`, `ACCEPTED`, `REJECTED`), `created_at`.
*   **Review:**
    *   Fields: `mentor` (FK), `mentee` (FK), `comment`, `rating` (Int), `is_hidden` (Boolean).

### B. The Seeding Engine
**Command:** `python manage.py seed_db`
The password for all users will be 'Password123!'. The script will populate:
1.  **Admin:** 1 Super Admin (Initial credentials: `admin@freementors.com`).
2.  **Users:** 5 Mentees with complete profiles.
3.  **Mentors:** 3 Mentors with specialized expertise (Tech, Finance, Health).
4.  **Sessions:** 
    *   2 Pending requests.
    *   2 Accepted requests.
    *   1 Rejected request.
5.  **Reviews:** 3 Reviews (one flagged as `is_hidden=True` for Admin testing).

### C. GraphQL Mutations & Queries
*   **Queries:** `allMentors`, `mentorDetail(id)`, `mySessions`, `allUsers` (Admin only), `allReviews`.
*   **Mutations:** `register`, `login`, `createSession`, `updateSessionStatus`, `toggleMentorStatus`, `addAdmin`, `hideReview`.

---

## 3. Frontend Specification (React + MUI)

### A. Theme Configuration (HSL Mapping)
We will use a custom MUI theme provider to inject the HSL variables.

```javascript
// Theme Logic Snippet
primary: { main: 'hsl(127, 19%, 28%)', contrastText: '#fff' },
secondary: { main: 'hsl(0, 0%, 96%)' },
error: { main: 'hsl(0, 84%, 60%)' },
success: { main: 'hsl(142, 76%, 36%)' },
// ... mapping radius and transitions from CSS vars
```

### B. Feature Modules
1.  **Auth Module:** Signup/Login forms with validation.
2.  **Mentor Module:** Card-based list view, Filter by expertise, Profile detail view.
3.  **Session Module:** Request form (Modal), Mentee dashboard (Session list), Mentor dashboard (Accept/Reject actions).
4.  **Admin Dashboard:** 
    *   User Table: Toggle "Change to Mentor" status.
    *   Admin Management: "Add New Admin" form.
    *   Review Moderation: Toggle "Hide Review".

---

## 4. Quality Assurance & Rubric Strategy

### A. Test-Driven Development (TDD)
*   **Backend:** `pytest-django` for testing GraphQL resolvers and Auth permissions.
*   **Frontend:** `Vitest` + `React Testing Library`. We will write tests for:
    *   Successful Login/Failed Login.
    *   Submission of a mentorship request.
    *   Role-based access (Mentors shouldn't see Admin buttons).
*   **Target Coverage:** > 60%.

### B. Figma Workflow
1.  Develop the UI using the HSL colors provided.
2.  Use the `html-to-design` plugin in Figma.
3.  Import the local dev pages into Figma to create the "Mobile, Tablet, Desktop" mockups required by the evaluation criteria.

### C. Git Workflow
*   Main branch is protected.
*   Feature branches: `feature/auth`, `feature/mentors`, `feature/sessions`, `feature/admin`.
*   Commit messages follow: `feat: add session request mutation`.

---

## 5. Deployment & Docker (Submission Ready)
Even though Docker won't run locally on your PC, the repository will include:
*   `backend.Dockerfile`: Multi-stage Python build.
*   `frontend.Dockerfile`: Nginx-based build.
*   `docker-compose.yml`: Orchestrates `web`, `api`, and `db` (mongo) containers.

---

### PROJECT ROADMAP

*   ### Sprint 1: The UI Shell (Frontend Core)
    *   Setup React (Vite) + Redux Toolkit.
    *   Implement the MUI Theme using the provided HSL color variables and dark mode logic.
    *   Create **Demo Data Arrays** for Mentors, Sessions, and Users to populate the UI.
    *   Develop high-fidelity Login, Signup, and Landing pages.

*   ### Sprint 2: The UI Features & Figma Mockups
    *   Build the Mentor Directory and Profile views using demo data.
    *   Build the Mentee/Mentor Dashboards (Session management).
    *   Build the Admin Dashboard (User & Review moderation).
    *   **Figma Phase:** Use the `html-to-design` tool on the completed UI components to generate the required Figma project for your presentation/submission.

*   ### Sprint 3: The Backend Core
    *   Setup Django and MongoDB (Djongo) connection.
    *   Implement the Custom User Model and JWT authentication logic.
    *   Create the `seed_db` script with the robust dataset (Admin, 3 Mentors, 5 Students, mixed Session statuses).

*   ### Sprint 4: The API Layer
    *   Build Graphene GraphQL Schemas (Queries & Mutations).
    *   Implement backend logic for session requests, mentor status toggling, and review hiding.
    *   Perform Backend TDD to ensure 60%+ coverage.

*   ### Sprint 5: Integration & Final Polish
    *   **Data Swap:** Replace the Frontend demo data arrays with Redux Toolkit Query (or Apollo) calls to the Django GraphQL API.
    *   Docker Configuration: Create `Dockerfile` and `docker-compose.yml` for submission.
    *   Final documentation and repository cleanup (Git workflow check).

---