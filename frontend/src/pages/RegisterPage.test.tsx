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

import RegisterPage from "./RegisterPage";
import { useAuthStore } from "@/stores/authStore";

const fillField = async (id: string, value: string) => {
  const input = document.querySelector(`#${id}`) as HTMLInputElement;
  await userEvent.type(input, value);
};

describe("RegisterPage", () => {
  beforeEach(() => {
    gqlMock.mockReset();
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitializing: false,
    });
  });

  it("renders the registration form with all required fields", () => {
    renderWithProviders(<RegisterPage />);
    expect(document.querySelector("#firstName")).toBeInTheDocument();
    expect(document.querySelector("#lastName")).toBeInTheDocument();
    expect(document.querySelector("#email")).toBeInTheDocument();
    expect(document.querySelector("#password")).toBeInTheDocument();
    expect(document.querySelector("#address")).toBeInTheDocument();
    expect(document.querySelector("#occupation")).toBeInTheDocument();
    expect(document.querySelector("#bio")).toBeInTheDocument();
  });

  const fillRequired = async () => {
    await fillField("firstName", "New");
    await fillField("lastName", "User");
    await fillField("email", "new@x.com");
    await fillField("password", "Password123!");
    await fillField("address", "1 Main St");
    await fillField("occupation", "Engineer");
  };

  it("creates an account then logs in and stores auth", async () => {
    gqlMock.mockImplementation((query: string) => {
      if (query.includes("register")) {
        return Promise.resolve({
          register: {
            success: true,
            errors: null,
            user: {
              id: "10",
              firstName: "New",
              lastName: "User",
              email: "new@x.com",
              role: "USER",
            },
          },
        });
      }
      return Promise.resolve({
        login: {
          token: "tok-new",
          success: true,
          errors: null,
          user: {
            id: "10",
            firstName: "New",
            lastName: "User",
            email: "new@x.com",
            role: "USER",
          },
        },
      });
    });

    renderWithProviders(<RegisterPage />);
    await fillRequired();
    await userEvent.click(
      screen.getByRole("button", { name: /create account|register|sign up/i }),
    );

    await waitFor(() => {
      expect(gqlMock).toHaveBeenCalled();
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
  });

  it("does not authenticate when register fails", async () => {
    gqlMock.mockResolvedValue({
      register: {
        success: false,
        errors: ["Email already in use"],
        user: null,
      },
    });

    renderWithProviders(<RegisterPage />);
    await fillRequired();
    await userEvent.click(
      screen.getByRole("button", { name: /create account|register|sign up/i }),
    );

    await waitFor(() => expect(gqlMock).toHaveBeenCalled());
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
