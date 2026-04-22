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

import MentorDashboardPage from "./MentorDashboardPage";
import { useAuthStore } from "@/stores/authStore";

describe("MentorDashboardPage", () => {
  beforeEach(() => {
    gqlMock.mockReset();
    gqlMock.mockImplementation((q: string) => {
      if (q.includes("mySessions")) return Promise.resolve({ mySessions: [] });
      if (q.includes("allReviews")) return Promise.resolve({ allReviews: [] });
      return Promise.resolve({});
    });
    useAuthStore.setState({
      user: {
        id: "m1",
        firstName: "Mira",
        lastName: "Mentor",
        email: "mira@x.com",
        role: "MENTOR",
      },
      token: "t",
      isAuthenticated: true,
      isInitializing: false,
    });
  });

  it("renders the mentor's first name on the dashboard", async () => {
    renderWithProviders(<MentorDashboardPage />);
    expect(await screen.findByText(/Mira/)).toBeInTheDocument();
  });
});
