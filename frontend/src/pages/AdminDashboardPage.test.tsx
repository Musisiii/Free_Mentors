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

import AdminDashboardPage from "./AdminDashboardPage";
import { useAuthStore } from "@/stores/authStore";

const MOCK_ADMIN = {
  id: "a1",
  firstName: "Ada",
  lastName: "Admin",
  email: "ada@x.com",
  role: "ADMIN" as const,
};

const MOCK_USERS = [
  MOCK_ADMIN,
  { id: "m1", firstName: "Mira", lastName: "Mentor", email: "m@x.com", role: "MENTOR" },
  { id: "u1", firstName: "Sam", lastName: "User", email: "s@x.com", role: "USER" },
];

const MOCK_REVIEWS = [
  {
    id: "r1",
    remark: "Nice!",
    score: 5,
    isHidden: false,
    hideRequestStatus: "NONE",
    mentor: { id: "m1", firstName: "Mira", lastName: "Mentor", email: "m@x.com", role: "MENTOR" },
    mentee: { id: "u1", firstName: "Sam", lastName: "User", email: "s@x.com", role: "USER" },
  },
  {
    id: "r2",
    remark: "Hidden one",
    score: 1,
    isHidden: true,
    hideRequestStatus: "APPROVED",
    mentor: { id: "m1", firstName: "Mira", lastName: "Mentor", email: "m@x.com", role: "MENTOR" },
    mentee: { id: "u1", firstName: "Sam", lastName: "User", email: "s@x.com", role: "USER" },
  },
];

const MOCK_PROMOTIONS = [
  {
    id: "p1",
    expertise: "Python",
    occupation: "Developer",
    status: "PENDING",
    createdAt: "2026-01-01T00:00:00Z",
    user: { id: "u1", firstName: "Sam", lastName: "User", email: "s@x.com", role: "USER" },
  },
];

const MOCK_HIDE_REQUESTS = [
  {
    id: "r3",
    remark: "Flag this please",
    score: 2,
    isHidden: false,
    hideRequestStatus: "PENDING",
    mentor: { id: "m1", firstName: "Mira", lastName: "Mentor", email: "m@x.com", role: "MENTOR" },
    mentee: { id: "u1", firstName: "Sam", lastName: "User", email: "s@x.com", role: "USER" },
  },
];

describe("AdminDashboardPage", () => {
  beforeEach(() => {
    gqlMock.mockReset();
    toastMock.mockReset();
    gqlMock.mockImplementation((q: string) => {
      if (q.includes("allUsers")) return Promise.resolve({ allUsers: MOCK_USERS });
      if (q.includes("allReviews")) return Promise.resolve({ allReviews: MOCK_REVIEWS });
      if (q.includes("allPromotionRequests"))
        return Promise.resolve({ allPromotionRequests: MOCK_PROMOTIONS });
      if (q.includes("pendingHideRequests"))
        return Promise.resolve({ pendingHideRequests: MOCK_HIDE_REQUESTS });
      return Promise.resolve({});
    });
    useAuthStore.setState({
      user: MOCK_ADMIN,
      token: "t",
      isAuthenticated: true,
      isInitializing: false,
    });
  });

  it("renders the admin dashboard heading", async () => {
    renderWithProviders(<AdminDashboardPage />);
    const matches = await screen.findAllByText(/admin/i);
    expect(matches.length).toBeGreaterThan(0);
    expect(screen.getByText(/Ada/)).toBeInTheDocument();
  });

  it("shows user count stats", async () => {
    renderWithProviders(<AdminDashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });

  it("displays user list with role chips", async () => {
    renderWithProviders(<AdminDashboardPage />);
    const miras = await screen.findAllByText(/Mira/);
    expect(miras.length).toBeGreaterThan(0);
    const sams = screen.getAllByText(/Sam/);
    expect(sams.length).toBeGreaterThan(0);
  });

  it("switches to reviews tab and shows review cards", async () => {
    renderWithProviders(<AdminDashboardPage />);
    await screen.findByText(/Ada/);

    const reviewsTab = screen.getByRole("button", { name: /reviews/i });
    await userEvent.click(reviewsTab);

    await waitFor(() => {
      expect(screen.getByText(/Nice!/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Hidden one/)).toBeInTheDocument();
  });

  it("shows review cards count on reviews tab", async () => {
    renderWithProviders(<AdminDashboardPage />);
    await screen.findByText(/Ada/);

    const reviewsTab = screen.getByRole("button", { name: /reviews/i });
    await userEvent.click(reviewsTab);

    await waitFor(() => {
      expect(screen.getByText(/Nice!/)).toBeInTheDocument();
      expect(screen.getByText(/Hidden one/)).toBeInTheDocument();
    });
  });

  it("switches to requests tab and shows pending promotion", async () => {
    renderWithProviders(<AdminDashboardPage />);
    await screen.findByText(/Ada/);

    const requestsTab = screen.getByRole("button", { name: /requests/i });
    await userEvent.click(requestsTab);

    await waitFor(() => {
      expect(screen.getByText(/Python/)).toBeInTheDocument();
    });
  });

  it("shows hide request cards under requests tab", async () => {
    renderWithProviders(<AdminDashboardPage />);
    await screen.findByText(/Ada/);

    const requestsTab = screen.getByRole("button", { name: /requests/i });
    await userEvent.click(requestsTab);

    await waitFor(() => {
      expect(screen.getByText(/Review Hide Requests/)).toBeInTheDocument();
    });

    const hideCard = screen.getByText(/Review Hide Requests/);
    await userEvent.click(hideCard);

    await waitFor(() => {
      expect(screen.getByText(/Flag this please/)).toBeInTheDocument();
    });
  });
});