import { describe, it, expect } from "vitest";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders, screen } from "@/test/utils";
import { MainLayout } from "./MainLayout";

const Tree = () => (
  <Routes>
    <Route element={<MainLayout />}>
      <Route path="/" element={<div>HOME CONTENT</div>} />
    </Route>
  </Routes>
);

describe("MainLayout", () => {
  it("renders the brand name and the outlet content", () => {
    renderWithProviders(<Tree />, { initialEntries: ["/"] });
    expect(screen.getByText("Free Mentors")).toBeInTheDocument();
    expect(screen.getByText("HOME CONTENT")).toBeInTheDocument();
  });

  it("renders the footer with copyright text", () => {
    renderWithProviders(<Tree />, { initialEntries: ["/"] });
    expect(screen.getByText(/© 2026 Free Mentors/)).toBeInTheDocument();
  });

  it("brand link routes back to /", () => {
    renderWithProviders(<Tree />, { initialEntries: ["/"] });
    const brandLink = screen.getByRole("link", { name: /Free Mentors/i });
    expect(brandLink).toHaveAttribute("href", "/");
  });
});
