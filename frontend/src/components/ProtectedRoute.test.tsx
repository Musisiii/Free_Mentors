import { describe, it, expect, beforeEach } from "vitest";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders, screen } from "@/test/utils";
import { ProtectedRoute, RedirectIfAuthed } from "./ProtectedRoute";
import { useAuthStore } from "@/stores/authStore";
import { Role, User } from "@/types";

const makeUser = (role: Role): User => ({
  id: "1",
  firstName: "T",
  lastName: "User",
  email: "t@example.com",
  role,
});

const Tree = ({ initial }: { initial: string }) => (
  <Routes>
    <Route path="/login" element={<div>LOGIN PAGE</div>} />
    <Route path="/" element={<div>HOME PAGE</div>} />
    <Route
      path="/dashboard/admin"
      element={<div>ADMIN DASHBOARD</div>}
    />
    <Route
      path="/dashboard/mentor"
      element={<div>MENTOR DASHBOARD</div>}
    />
    <Route
      path="/dashboard/user"
      element={<div>USER DASHBOARD</div>}
    />
    <Route
      path="/protected"
      element={
        <ProtectedRoute>
          <div>SECRET</div>
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin-only"
      element={
        <ProtectedRoute requiredRole="ADMIN">
          <div>ADMIN AREA</div>
        </ProtectedRoute>
      }
    />
    <Route
      path="/mentor-or-admin"
      element={
        <ProtectedRoute requiredRole={["MENTOR", "ADMIN"]}>
          <div>MENTOR OR ADMIN AREA</div>
        </ProtectedRoute>
      }
    />
    <Route
      path="/auth-gate"
      element={
        <RedirectIfAuthed>
          <div>PUBLIC AUTH PAGE</div>
        </RedirectIfAuthed>
      }
    />
  </Routes>
);

const reset = () =>
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
    isInitializing: false,
  });

describe("ProtectedRoute", () => {
  beforeEach(reset);

  it("redirects to /login when not authenticated", () => {
    renderWithProviders(<Tree initial="/protected" />, {
      initialEntries: ["/protected"],
    });
    expect(screen.getByText("LOGIN PAGE")).toBeInTheDocument();
  });

  it("renders the children when authenticated and no role required", () => {
    useAuthStore.setState({
      user: makeUser("USER"),
      token: "t",
      isAuthenticated: true,
      isInitializing: false,
    });
    renderWithProviders(<Tree initial="/protected" />, {
      initialEntries: ["/protected"],
    });
    expect(screen.getByText("SECRET")).toBeInTheDocument();
  });

  it("blocks the wrong role and sends user home", () => {
    useAuthStore.setState({
      user: makeUser("USER"),
      token: "t",
      isAuthenticated: true,
      isInitializing: false,
    });
    renderWithProviders(<Tree initial="/admin-only" />, {
      initialEntries: ["/admin-only"],
    });
    expect(screen.getByText("HOME PAGE")).toBeInTheDocument();
  });

  it("allows the correct role through", () => {
    useAuthStore.setState({
      user: makeUser("ADMIN"),
      token: "t",
      isAuthenticated: true,
      isInitializing: false,
    });
    renderWithProviders(<Tree initial="/admin-only" />, {
      initialEntries: ["/admin-only"],
    });
    expect(screen.getByText("ADMIN AREA")).toBeInTheDocument();
  });

  it("supports an array of allowed roles", () => {
    useAuthStore.setState({
      user: makeUser("MENTOR"),
      token: "t",
      isAuthenticated: true,
      isInitializing: false,
    });
    renderWithProviders(<Tree initial="/mentor-or-admin" />, {
      initialEntries: ["/mentor-or-admin"],
    });
    expect(screen.getByText("MENTOR OR ADMIN AREA")).toBeInTheDocument();
  });
});

describe("RedirectIfAuthed", () => {
  beforeEach(reset);

  it("renders children when not authenticated", () => {
    renderWithProviders(<Tree initial="/auth-gate" />, {
      initialEntries: ["/auth-gate"],
    });
    expect(screen.getByText("PUBLIC AUTH PAGE")).toBeInTheDocument();
  });

  it("redirects USER to /dashboard/user", () => {
    useAuthStore.setState({
      user: makeUser("USER"),
      token: "t",
      isAuthenticated: true,
      isInitializing: false,
    });
    renderWithProviders(<Tree initial="/auth-gate" />, {
      initialEntries: ["/auth-gate"],
    });
    expect(screen.getByText("USER DASHBOARD")).toBeInTheDocument();
  });

  it("redirects MENTOR to /dashboard/mentor", () => {
    useAuthStore.setState({
      user: makeUser("MENTOR"),
      token: "t",
      isAuthenticated: true,
      isInitializing: false,
    });
    renderWithProviders(<Tree initial="/auth-gate" />, {
      initialEntries: ["/auth-gate"],
    });
    expect(screen.getByText("MENTOR DASHBOARD")).toBeInTheDocument();
  });

  it("redirects ADMIN to /dashboard/admin", () => {
    useAuthStore.setState({
      user: makeUser("ADMIN"),
      token: "t",
      isAuthenticated: true,
      isInitializing: false,
    });
    renderWithProviders(<Tree initial="/auth-gate" />, {
      initialEntries: ["/auth-gate"],
    });
    expect(screen.getByText("ADMIN DASHBOARD")).toBeInTheDocument();
  });
});
