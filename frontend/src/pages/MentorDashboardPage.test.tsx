import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor } from "@/test/utils";

const gqlMock = vi.fn();
vi.mock("@/lib/graphql", () => ({
  gql: (...args: unknown[]) => gqlMock(...args),
  GraphQLError: class extends Error {},
}));
const toastMock = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

import MentorDashboardPage from "./MentorDashboardPage";
import { useAuthStore } from "@/stores/authStore";

const MOCK_MENTOR = {
  id: "m1",
  firstName: "Mira",
  lastName: "Mentor",
  email: "mira@x.com",
  role: "MENTOR" as const,
};

const MOCK_SESSIONS = [
  {
    id: "s1",
    questions: "Need help with React",
    status: "PENDING",
    createdAt: "2026-01-01T00:00:00Z",
    scheduledAt: "2026-02-01T10:00:00Z",
    durationMinutes: 30,
    rejectReason: null,
    mentor: MOCK_MENTOR,
    mentee: { id: "u1", firstName: "Sam", lastName: "U", email: "sam@x.com", role: "USER" },
  },
  {
    id: "s2",
    questions: "Django guidance",
    status: "ACCEPTED",
    createdAt: "2025-12-01T00:00:00Z",
    scheduledAt: "2026-01-15T14:00:00Z",
    durationMinutes: 60,
    rejectReason: null,
    mentor: MOCK_MENTOR,
    mentee: { id: "u2", firstName: "Joe", lastName: "V", email: "joe@x.com", role: "USER" },
  },
];

const MOCK_REVIEWS = [
  {
    id: "r1",
    remark: "Mira was amazing!",
    score: 5,
    isHidden: false,
    hideRequestStatus: "NONE",
    mentor: MOCK_MENTOR,
    mentee: { id: "u1", firstName: "Sam", lastName: "U", email: "sam@x.com", role: "USER" },
  },
  {
    id: "r2",
    remark: "Hidden rude review",
    score: 1,
    isHidden: true,
    hideRequestStatus: "APPROVED",
    mentor: MOCK_MENTOR,
    mentee: { id: "u2", firstName: "Joe", lastName: "V", email: "joe@x.com", role: "USER" },
  },
  {
    id: "r3",
    remark: "Review about another mentor",
    score: 4,
    isHidden: false,
    hideRequestStatus: "NONE",
    mentor: { id: "m9", firstName: "Other", lastName: "Mentor", email: "om@x.com", role: "MENTOR" },
    mentee: { id: "u1", firstName: "Sam", lastName: "U", email: "sam@x.com", role: "USER" },
  },
];

describe("MentorDashboardPage", () => {
  beforeEach(() => {
    gqlMock.mockReset();
    toastMock.mockReset();
    gqlMock.mockImplementation((q: string) => {
      if (q.includes("mySessions")) return Promise.resolve({ mySessions: MOCK_SESSIONS });
      if (q.includes("allReviews")) return Promise.resolve({ allReviews: MOCK_REVIEWS });
      return Promise.resolve({});
    });
    useAuthStore.setState({
      user: MOCK_MENTOR,
      token: "t",
      isAuthenticated: true,
      isInitializing: false,
    });
  });

  it("renders the mentor's first name on the dashboard", async () => {
    renderWithProviders(<MentorDashboardPage />);
    expect(await screen.findByText(/Mira/)).toBeInTheDocument();
  });

  it("shows pending session cards with accept/reject buttons", async () => {
    renderWithProviders(<MentorDashboardPage />);
    expect(await screen.findByText(/Need help with React/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /decline/i })).toBeInTheDocument();
  });

  it("shows session scheduling info", async () => {
    renderWithProviders(<MentorDashboardPage />);
    expect(await screen.findByText(/30 min/)).toBeInTheDocument();
  });

  it("switches to reviews tab and shows only mentor's reviews", async () => {
    renderWithProviders(<MentorDashboardPage />);
    await screen.findByText(/Mira/);

    const reviewsTab = screen.getByRole("button", { name: /reviews/i });
    await userEvent.click(reviewsTab);

    await waitFor(() => {
      expect(screen.getByText(/Mira was amazing!/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Hidden rude review/)).toBeInTheDocument();
    expect(screen.queryByText(/Review about another mentor/)).not.toBeInTheDocument();
  });

  it("computes average score from visible reviews only", async () => {
    renderWithProviders(<MentorDashboardPage />);
    await screen.findByText(/Mira/);

    await waitFor(() => {
      expect(screen.getByText(/5\.0/)).toBeInTheDocument();
    });
  });
});