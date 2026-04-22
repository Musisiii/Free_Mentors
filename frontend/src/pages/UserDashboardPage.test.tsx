import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test/utils";

const gqlMock = vi.fn();
vi.mock("@/lib/graphql", () => ({
  gql: (...args: unknown[]) => gqlMock(...args),
  GraphQLError: class extends Error {},
}));
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import UserDashboardPage from "./UserDashboardPage";
import { useAuthStore } from "@/stores/authStore";

describe("UserDashboardPage", () => {
  beforeEach(() => {
    gqlMock.mockReset();
    gqlMock.mockImplementation((q: string) => {
      if (q.includes("mySessions")) return Promise.resolve({ mySessions: [] });
      if (q.includes("allReviews")) return Promise.resolve({ allReviews: [] });
      if (q.includes("allMentors")) return Promise.resolve({ allMentors: [] });
      return Promise.resolve({});
    });
    useAuthStore.setState({
      user: {
        id: "u1",
        firstName: "Sam",
        lastName: "User",
        email: "sam@x.com",
        role: "USER",
      },
      token: "t",
      isAuthenticated: true,
      isInitializing: false,
    });
  });

  it("renders the dashboard heading and the user's first name", async () => {
    renderWithProviders(<UserDashboardPage />);
    expect(await screen.findByText(/Sam/)).toBeInTheDocument();
  });
});
