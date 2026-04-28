// Centralised GraphQL query/mutation strings for Free Mentors.

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
  scheduledAt
  durationMinutes
  rejectReason
  mentor { ${USER_FIELDS} }
  mentee { ${USER_FIELDS} }
`;

export const REVIEW_FIELDS = `
  id
  remark
  score
  isHidden
  hideRequestStatus
  mentor { ${USER_FIELDS} }
  mentee { ${USER_FIELDS} }
`;

export const PROMOTION_REQUEST_FIELDS = `
  id
  expertise
  occupation
  status
  createdAt
  user { ${USER_FIELDS} }
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
    $occupation: String!
    $address: String
    $bio: String
  ) {
    register(
      email: $email
      password: $password
      firstName: $firstName
      lastName: $lastName
      occupation: $occupation
      address: $address
      bio: $bio
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
  mutation CreateSession(
    $mentorId: ID!
    $questions: String!
    $scheduledAt: DateTime!
    $durationMinutes: Int!
  ) {
    createSession(
      mentorId: $mentorId
      questions: $questions
      scheduledAt: $scheduledAt
      durationMinutes: $durationMinutes
    ) {
      success
      errors
      session { ${SESSION_FIELDS} }
    }
  }
`;

export const UPDATE_SESSION_STATUS_MUTATION = `
  mutation UpdateSessionStatus(
    $sessionId: ID!
    $status: String!
    $rejectReason: String
  ) {
    updateSessionStatus(
      sessionId: $sessionId
      status: $status
      rejectReason: $rejectReason
    ) {
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

export const REQUEST_REVIEW_HIDE_MUTATION = `
  mutation RequestReviewHide($reviewId: ID!) {
    requestReviewHide(reviewId: $reviewId) {
      success
      errors
      review { ${REVIEW_FIELDS} }
    }
  }
`;

export const RESOLVE_REVIEW_HIDE_REQUEST_MUTATION = `
  mutation ResolveReviewHideRequest($reviewId: ID!, $approve: Boolean!) {
    resolveReviewHideRequest(reviewId: $reviewId, approve: $approve) {
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
  mutation AddAdmin(
    $firstName: String!
    $lastName: String!
    $email: String!
    $address: String
  ) {
    addAdmin(
      firstName: $firstName
      lastName: $lastName
      email: $email
      address: $address
    ) {
      success
      errors
      user { ${USER_FIELDS} }
    }
  }
`;

export const MY_PROMOTION_REQUEST_QUERY = `
  query MyPromotionRequest {
    myPromotionRequest { ${PROMOTION_REQUEST_FIELDS} }
  }
`;

export const ALL_PROMOTION_REQUESTS_QUERY = `
  query AllPromotionRequests {
    allPromotionRequests { ${PROMOTION_REQUEST_FIELDS} }
  }
`;

export const CREATE_PROMOTION_REQUEST_MUTATION = `
  mutation CreatePromotionRequest($expertise: String!, $occupation: String!) {
    createPromotionRequest(expertise: $expertise, occupation: $occupation) {
      success
      errors
      request { ${PROMOTION_REQUEST_FIELDS} }
    }
  }
`;

export const RESOLVE_PROMOTION_REQUEST_MUTATION = `
  mutation ResolvePromotionRequest($requestId: ID!, $approve: Boolean!) {
    resolvePromotionRequest(requestId: $requestId, approve: $approve) {
      success
      errors
      request { ${PROMOTION_REQUEST_FIELDS} }
    }
  }
`;

export const PENDING_HIDE_REQUESTS_QUERY = `
  query PendingHideRequests {
    pendingHideRequests { ${REVIEW_FIELDS} }
  }
`;