import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test/utils";
import LandingPage from "./LandingPage";
import { useAuthStore } from "@/stores/authStore";

const setUser = (role: "USER" | "MENTOR" | "ADMIN") =>
  useAuthStore.setState({
    user: {
      id: "1",
      firstName: "T",
      lastName: "U",
      email: "t@example.com",
      role,
    },
    token: "t",
    isAuthenticated: true,
    isInitializing: false,
  });

const reset = () =>
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
    isInitializing: false,
  });

describe("LandingPage", () => {
  beforeEach(reset);

  it("renders the hero heading and feature cards", () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /Connect with/i,
    );
    expect(screen.getByText(/Why Choose Free Mentors/i)).toBeInTheDocument();
    expect(screen.getByText("Expert Guidance")).toBeInTheDocument();
    expect(screen.getByText("Safe & Secure")).toBeInTheDocument();
    expect(screen.getByText("Community Driven")).toBeInTheDocument();
    expect(screen.getByText("Always Improving")).toBeInTheDocument();
  });

  it("shows Register and Sign In CTAs when unauthenticated", () => {
    renderWithProviders(<LandingPage />);
    const register = screen.getByRole("link", { name: /Register/i });
    const signIn = screen.getByRole("link", { name: /Sign In/i });
    expect(register).toHaveAttribute("href", "/register");
    expect(signIn).toHaveAttribute("href", "/login");
    expect(
      screen.getByRole("link", { name: /Get Started/i }),
    ).toHaveAttribute("href", "/register");
  });

  it("shows Open Dashboard + Browse Mentors when authenticated as USER", () => {
    setUser("USER");
    renderWithProviders(<LandingPage />);
    expect(
      screen.getByRole("link", { name: /Open Dashboard/i }),
    ).toHaveAttribute("href", "/dashboard/user");
    expect(
      screen.getByRole("link", { name: /Browse Mentors/i }),
    ).toHaveAttribute("href", "/mentors");
    expect(
      screen.getByRole("link", { name: /Find a Mentor/i }),
    ).toHaveAttribute("href", "/mentors");
  });

  it("routes Open Dashboard to /dashboard/mentor for MENTOR role", () => {
    setUser("MENTOR");
    renderWithProviders(<LandingPage />);
    expect(
      screen.getByRole("link", { name: /Open Dashboard/i }),
    ).toHaveAttribute("href", "/dashboard/mentor");
  });

  it("routes Open Dashboard to /dashboard/admin for ADMIN role", () => {
    setUser("ADMIN");
    renderWithProviders(<LandingPage />);
    expect(
      screen.getByRole("link", { name: /Open Dashboard/i }),
    ).toHaveAttribute("href", "/dashboard/admin");
  });
});
