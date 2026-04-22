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

import AdminDashboardPage from "./AdminDashboardPage";
import { useAuthStore } from "@/stores/authStore";

describe("AdminDashboardPage", () => {
  beforeEach(() => {
    gqlMock.mockReset();
    gqlMock.mockImplementation((q: string) => {
      if (q.includes("allUsers")) return Promise.resolve({ allUsers: [] });
      if (q.includes("allReviews")) return Promise.resolve({ allReviews: [] });
      return Promise.resolve({});
    });
    useAuthStore.setState({
      user: {
        id: "a1",
        firstName: "Ada",
        lastName: "Admin",
        email: "ada@x.com",
        role: "ADMIN",
      },
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
});
