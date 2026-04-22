import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, waitFor } from "@/test/utils";

const gqlMock = vi.fn();
vi.mock("@/lib/graphql", () => ({
  gql: (...args: unknown[]) => gqlMock(...args),
  GraphQLError: class extends Error {},
}));
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import MentorsPage from "./MentorsPage";
import { useAuthStore } from "@/stores/authStore";

const sampleMentors = [
  {
    id: "1",
    firstName: "Grace",
    lastName: "Hopper",
    email: "grace@x.com",
    role: "MENTOR",
    expertise: "Compilers",
    occupation: "Engineer",
    address: "NY",
    bio: "COBOL legend",
  },
  {
    id: "2",
    firstName: "Linus",
    lastName: "Torvalds",
    email: "linus@x.com",
    role: "MENTOR",
    expertise: "Kernels",
    occupation: "Hacker",
    address: "Helsinki",
    bio: "Linux creator",
  },
];

describe("MentorsPage", () => {
  beforeEach(() => {
    gqlMock.mockReset();
    useAuthStore.setState({
      user: {
        id: "u1",
        firstName: "T",
        lastName: "U",
        email: "t@x.com",
        role: "USER",
      },
      token: "t",
      isAuthenticated: true,
      isInitializing: false,
    });
  });

  it("renders the list of mentors returned by the API", async () => {
    gqlMock.mockResolvedValue({ allMentors: sampleMentors });
    renderWithProviders(<MentorsPage />);
    expect(await screen.findByText(/Grace Hopper/)).toBeInTheDocument();
    expect(screen.getByText(/Linus Torvalds/)).toBeInTheDocument();
  });

  it("filters by search query", async () => {
    gqlMock.mockResolvedValue({ allMentors: sampleMentors });
    renderWithProviders(<MentorsPage />);
    await screen.findByText(/Grace Hopper/);

    const input = screen.getByPlaceholderText(/search/i);
    await userEvent.type(input, "kernel");

    await waitFor(() => {
      expect(screen.queryByText(/Grace Hopper/)).not.toBeInTheDocument();
      expect(screen.getByText(/Linus Torvalds/)).toBeInTheDocument();
    });
  });
});
