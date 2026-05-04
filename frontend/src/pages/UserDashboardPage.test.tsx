import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor, within } from "@/test/utils";

const gqlMock = vi.fn();
vi.mock("@/lib/graphql", () => ({
  gql: (...args: unknown[]) => gqlMock(...args),
  GraphQLError: class extends Error {},
}));
const toastMock = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

import UserDashboardPage from "./UserDashboardPage";
import { useAuthStore } from "@/stores/authStore";

const MOCK_USER = {
  id: "u1",
  firstName: "Sam",
  lastName: "User",
  email: "sam@x.com",
  role: "USER" as const,
};

const MOCK_SESSIONS = [
  {
    id: "s1",
    questions: "Help with Python",
    status: "PENDING",
    createdAt: "2026-01-01T00:00:00Z",
    scheduledAt: "2026-02-01T10:00:00Z",
    durationMinutes: 30,
    rejectReason: null,
    mentor: { id: "m1", firstName: "Alice", lastName: "M", email: "a@x.com", role: "MENTOR" },
    mentee: MOCK_USER,
  },
  {
    id: "s2",
    questions: "Career advice",
    status: "COMPLETED",
    createdAt: "2025-12-01T00:00:00Z",
    scheduledAt: "2025-12-15T14:00:00Z",
    durationMinutes: 45,
    rejectReason: null,
    mentor: { id: "m2", firstName: "Bob", lastName: "W", email: "b@x.com", role: "MENTOR" },
    mentee: MOCK_USER,
  },
  {
    id: "s3",
    questions: "Rejected session",
    status: "REJECTED",
    createdAt: "2025-11-01T00:00:00Z",
    scheduledAt: "2025-11-10T09:00:00Z",
    durationMinutes: 60,
    rejectReason: "I am unavailable.",
    mentor: { id: "m1", firstName: "Alice", lastName: "M", email: "a@x.com", role: "MENTOR" },
    mentee: MOCK_USER,
  },
];

const MOCK_REVIEWS = [
  {
    id: "r1",
    remark: "Great mentor!",
    score: 5,
    isHidden: false,
    hideRequestStatus: "NONE",
    mentor: { id: "m2", firstName: "Bob", lastName: "W", email: "b@x.com", role: "MENTOR" },
    mentee: MOCK_USER,
  },
  {
    id: "r2",
    remark: "Other user review",
    score: 4,
    isHidden: false,
    hideRequestStatus: "NONE",
    mentor: { id: "m1", firstName: "Alice", lastName: "M", email: "a@x.com", role: "MENTOR" },
    mentee: { id: "u9", firstName: "Other", lastName: "Person", email: "o@x.com", role: "USER" },
  },
];

describe("UserDashboardPage", () => {
  beforeEach(() => {
    gqlMock.mockReset();
    toastMock.mockReset();
    gqlMock.mockImplementation((q: string) => {
      if (q.includes("mySessions")) return Promise.resolve({ mySessions: MOCK_SESSIONS });
      if (q.includes("allReviews")) return Promise.resolve({ allReviews: MOCK_REVIEWS });
      if (q.includes("myPromotionRequest")) return Promise.resolve({ myPromotionRequest: null });
      if (q.includes("allMentors")) return Promise.resolve({ allMentors: [] });
      return Promise.resolve({});
    });
    useAuthStore.setState({
      user: MOCK_USER,
      token: "t",
      isAuthenticated: true,
      isInitializing: false,
    });
  });

  it("renders the dashboard heading and the user's first name", async () => {
    renderWithProviders(<UserDashboardPage />);
    expect(await screen.findByText(/Sam/)).toBeInTheDocument();
  });

  it("displays session count stats", async () => {
    renderWithProviders(<UserDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });

  it("shows session cards with scheduling info", async () => {
    renderWithProviders(<UserDashboardPage />);
    expect(await screen.findByText(/Help with Python/)).toBeInTheDocument();
    expect(screen.getByText(/Career advice/)).toBeInTheDocument();
  });

  it("shows reject reason on rejected sessions", async () => {
    renderWithProviders(<UserDashboardPage />);
    expect(await screen.findByText(/I am unavailable/)).toBeInTheDocument();
  });

  it("switches to reviews tab and shows only user's reviews", async () => {
    renderWithProviders(<UserDashboardPage />);
    await screen.findByText(/Sam/);

    const reviewsTab = screen.getByRole("button", { name: /reviews/i });
    await userEvent.click(reviewsTab);

    await waitFor(() => {
      expect(screen.getByText(/Great mentor!/)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Other user review/)).not.toBeInTheDocument();
  });

  it("shows promotion request section when user has no pending request", async () => {
    renderWithProviders(<UserDashboardPage />);
    await screen.findByText(/Sam/);
    expect(screen.getByText(/Become a Mentor/i)).toBeInTheDocument();
  });

  it("shows pending promotion status when request exists", async () => {
    gqlMock.mockImplementation((q: string) => {
      if (q.includes("mySessions")) return Promise.resolve({ mySessions: [] });
      if (q.includes("allReviews")) return Promise.resolve({ allReviews: [] });
      if (q.includes("myPromotionRequest"))
        return Promise.resolve({
          myPromotionRequest: {
            id: "p1",
            expertise: "Python",
            occupation: "Dev",
            status: "PENDING",
            createdAt: "2026-01-01T00:00:00Z",
            user: MOCK_USER,
          },
        });
      if (q.includes("allMentors")) return Promise.resolve({ allMentors: [] });
      return Promise.resolve({});
    });

    renderWithProviders(<UserDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText(/pending/i)).toBeInTheDocument();
    });
  });
});