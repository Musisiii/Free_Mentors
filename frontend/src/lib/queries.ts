// Centralised GraphQL query/mutation strings for Free Mentors.
// Keeping them in one place makes them easy to audit against the backend schema.

export const USER_FIELDS = `
  id
  firstName
  lastName
  email
  role
  address
  bio
  occupation
  expertise
`;

export const SESSION_FIELDS = `
  id
  questions
  status
  createdAt
  mentor { ${USER_FIELDS} }
  mentee { ${USER_FIELDS} }
`;

export const REVIEW_FIELDS = `
  id
  remark
  score
  isHidden
  mentor { ${USER_FIELDS} }
  mentee { ${USER_FIELDS} }
`;

export const ME_QUERY = `
  query Me {
    me { ${USER_FIELDS} }
  }
`;

export const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      success
      errors
      user { ${USER_FIELDS} }
    }
  }
`;

export const REGISTER_MUTATION = `
  mutation Register(
    $email: String!
    $password: String!
    $firstName: String!
    $lastName: String!
    $address: String
    $bio: String
    $occupation: String
  ) {
    register(
      email: $email
      password: $password
      firstName: $firstName
      lastName: $lastName
      address: $address
      bio: $bio
      occupation: $occupation
    ) {
      success
      errors
      user { ${USER_FIELDS} }
    }
  }
`;

export const ALL_MENTORS_QUERY = `
  query AllMentors {
    allMentors { ${USER_FIELDS} }
  }
`;

export const MENTOR_DETAIL_QUERY = `
  query MentorDetail($id: ID!) {
    mentorDetail(id: $id) { ${USER_FIELDS} }
  }
`;

export const ALL_USERS_QUERY = `
  query AllUsers {
    allUsers { ${USER_FIELDS} }
  }
`;

export const MY_SESSIONS_QUERY = `
  query MySessions {
    mySessions { ${SESSION_FIELDS} }
  }
`;

export const CREATE_SESSION_MUTATION = `
  mutation CreateSession($mentorId: ID!, $questions: String!) {
    createSession(mentorId: $mentorId, questions: $questions) {
      success
      errors
      session { ${SESSION_FIELDS} }
    }
  }
`;

export const UPDATE_SESSION_STATUS_MUTATION = `
  mutation UpdateSessionStatus($sessionId: ID!, $status: String!) {
    updateSessionStatus(sessionId: $sessionId, status: $status) {
      success
      errors
      session { ${SESSION_FIELDS} }
    }
  }
`;

export const ALL_REVIEWS_QUERY = `
  query AllReviews {
    allReviews { ${REVIEW_FIELDS} }
  }
`;

export const CREATE_REVIEW_MUTATION = `
  mutation CreateReview($mentorId: ID!, $remark: String!, $score: Int!) {
    createReview(mentorId: $mentorId, remark: $remark, score: $score) {
      success
      errors
      review { ${REVIEW_FIELDS} }
    }
  }
`;

export const HIDE_REVIEW_MUTATION = `
  mutation HideReview($reviewId: ID!) {
    hideReview(reviewId: $reviewId) {
      success
      errors
      review { ${REVIEW_FIELDS} }
    }
  }
`;

export const TOGGLE_MENTOR_STATUS_MUTATION = `
  mutation ToggleMentorStatus($userId: ID!) {
    toggleMentorStatus(userId: $userId) {
      success
      errors
      user { ${USER_FIELDS} }
    }
  }
`;

export const ADD_ADMIN_MUTATION = `
  mutation AddAdmin($email: String!) {
    addAdmin(email: $email) {
      success
      errors
      user { ${USER_FIELDS} }
    }
  }
`;
