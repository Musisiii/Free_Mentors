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

import LoginPage from "./LoginPage";
import { useAuthStore } from "@/stores/authStore";

describe("LoginPage", () => {
  beforeEach(() => {
    gqlMock.mockReset();
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitializing: false,
    });
  });

  const getEmail = () =>
    document.querySelector("#email") as HTMLInputElement;
  const getPwd = () =>
    document.querySelector("#password") as HTMLInputElement;

  it("renders the login form with email + password inputs", () => {
    renderWithProviders(<LoginPage />);
    expect(getEmail()).toBeInTheDocument();
    expect(getPwd()).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("submits credentials, stores auth and navigates on success", async () => {
    gqlMock.mockResolvedValue({
      login: {
        token: "tok-xyz",
        success: true,
        errors: null,
        user: {
          id: "9",
          firstName: "Sam",
          lastName: "User",
          email: "sam@example.com",
          role: "USER",
        },
      },
    });

    renderWithProviders(<LoginPage />);
    await userEvent.type(getEmail(), "sam@example.com");
    await userEvent.type(getPwd(), "secret");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(gqlMock).toHaveBeenCalled();
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user?.email).toBe("sam@example.com");
    });
  });

  it("does not authenticate when login returns errors", async () => {
    gqlMock.mockResolvedValue({
      login: {
        token: null,
        success: false,
        errors: ["Invalid credentials"],
        user: null,
      },
    });

    renderWithProviders(<LoginPage />);
    await userEvent.type(getEmail(), "x@y.com");
    await userEvent.type(getPwd(), "bad");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(gqlMock).toHaveBeenCalled());
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("toggles password visibility", async () => {
    renderWithProviders(<LoginPage />);
    const pwd = getPwd();
    expect(pwd.type).toBe("password");
    await userEvent.click(
      screen.getByRole("button", { name: /toggle password visibility/i }),
    );
    expect(pwd.type).toBe("text");
  });
});
