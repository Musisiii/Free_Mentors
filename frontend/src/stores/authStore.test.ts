import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "./authStore";
import { User } from "@/types";

const sampleUser: User = {
  id: "1",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  role: "USER",
};

describe("useAuthStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitializing: true,
    });
  });

  it("starts with no user and isInitializing true", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isInitializing).toBe(true);
  });

  it("setAuth stores user, token, sets isAuthenticated and persists token", () => {
    useAuthStore.getState().setAuth(sampleUser, "tok-123");
    const state = useAuthStore.getState();
    expect(state.user).toEqual(sampleUser);
    expect(state.token).toBe("tok-123");
    expect(state.isAuthenticated).toBe(true);
    expect(state.isInitializing).toBe(false);
    expect(localStorage.getItem("free_mentors_token")).toBe("tok-123");
  });

  it("clearAuth wipes user, token, and removes localStorage entry", () => {
    useAuthStore.getState().setAuth(sampleUser, "tok-123");
    useAuthStore.getState().clearAuth();
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(localStorage.getItem("free_mentors_token")).toBeNull();
  });

  it("updateUser merges patch into existing user", () => {
    useAuthStore.getState().setAuth(sampleUser, "tok-123");
    useAuthStore.getState().updateUser({ bio: "Hello", occupation: "Engineer" });
    const u = useAuthStore.getState().user!;
    expect(u.bio).toBe("Hello");
    expect(u.occupation).toBe("Engineer");
    expect(u.firstName).toBe("Ada");
  });

  it("updateUser is a no-op when there is no user", () => {
    useAuthStore.getState().updateUser({ bio: "ignored" });
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("setInitializing toggles the flag", () => {
    useAuthStore.getState().setInitializing(false);
    expect(useAuthStore.getState().isInitializing).toBe(false);
    useAuthStore.getState().setInitializing(true);
    expect(useAuthStore.getState().isInitializing).toBe(true);
  });
});
