### 1. Auth & Profile Fields (Signup/Login)
**Goal:** Transition generic user fields to the specific "Free Mentors" identity system.

*   **User Object Schema:**
    *   `id`: UUID / Number
    *   `firstName`: String
    *   `lastName`: String
    *   `email`: String (Unique)
    *   `password`: String (Hashed)
    *   `role`: Enum (`"USER"`, `"MENTOR"`, `"ADMIN"`)
    *   `address`: String
    *   `bio`: String (Long text)
    *   `occupation`: String
    *   `expertise`: String (For mentors: e.g., "Web Development", "Marketing")

*   **UI Mapping:**
    *   **Signup Form:** Change current fields to `firstName`, `lastName`, `email`, `password`, `address`, `occupation`, and `expertise`.
    *   **Login Form:** Ensure fields are `email` and `password`.

---

### 2. Mentor Module Fields (MentorList & MentorDetail)
**Goal:** Map your existing "Item" or "Product" cards to "Mentor" profiles.

*   **Mentor Card/Detail Schema:**
    *   `mentorId`: ID of the user (where role is MENTOR)
    *   `fullName`: Concatenation of `firstName` + `lastName`
    *   `expertise`: Primary skill tag (e.g., "DevOps")
    *   `bio`: Professional summary
    *   `profileImage`: URL string
    *   `averageRating`: Number (1-5) — *Optional for MVP*
    *   `yearsOfExperience`: Number

*   **UI Mapping:**
    *   **Filter Dropdown:** Populated by unique `expertise` strings.
    *   **Mentor Card:** Display `fullName`, `expertise`, and a snippet of `bio`.
    *   **Mentor Detail Page:** Display all above fields plus a "Request Mentorship" button.

---

### 3. Session Request Module (The Interaction)
**Goal:** Replace your existing "Orders" or "Tickets" logic with "Mentorship Sessions."

*   **Session Object Schema:**
    *   `sessionId`: ID
    *   `mentorId`: ID of the assigned mentor
    *   `mentorName`: String (for display)
    *   `menteeId`: ID of the requesting user
    *   `menteeName`: String (for display)
    *   `questions`: String (The text area input where the user asks for help)
    *   `status`: Enum (`"PENDING"`, `"ACCEPTED"`, `"REJECTED"`)
    *   `createdAt`: Timestamp

*   **UI Mapping:**
    *   **Request Modal:** One primary textarea named `questions`.
    *   **Dashboard List:** Show `mentorName` (for mentees) or `menteeName` (for mentors), the `questions` text, and the `status` badge.

---

### 4. Admin Management Fields
**Goal:** Map "Admin Dashboard" tables to user and content moderation.

*   **User Management Table:**
    *   Columns: `fullName`, `email`, `role`.
    *   Action Button 1: `ChangeRole` (Logic: If role is USER, change to MENTOR).
*   **Review Moderation Schema:**
    *   `reviewId`: ID
    *   `mentorId`: ID
    *   `menteeName`: String
    *   `score`: Number (1-5)
    *   `remark`: String (The review text)
    *   `status`: Enum (`"VISIBLE"`, `"HIDDEN"`)

*   **UI Mapping:**
    *   **Admin Table:** Display all users. Add a toggle for `isAdmin` and a button "Promote to Mentor."
    *   **Reviews List:** Display `menteeName`, `score`, and `remark`. Add a "Delete/Hide" button for moderation.

---

### 5. Redux / State Management Mapping
**Goal:** Ensure your global state slices use these exact keys.

*   **authSlice:** `{ user: { id, email, role }, token: string, isAuthenticated: boolean }`
*   **mentorsSlice:** `{ allMentors: [], selectedMentor: {} }`
*   **sessionsSlice:** `{ mySessions: [], incomingRequests: [] }`