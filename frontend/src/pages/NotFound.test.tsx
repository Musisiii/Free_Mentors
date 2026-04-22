import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen } from "@/test/utils";
import NotFound from "./NotFound";

describe("NotFound page", () => {
  it("renders 404, message, and the requested path", () => {
    renderWithProviders(<NotFound />, { initialEntries: ["/nope/missing"] });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("404");
    expect(screen.getByText(/Page not found/i)).toBeInTheDocument();
    expect(screen.getByText("/nope/missing")).toBeInTheDocument();
  });

  it("renders a Back to Home link pointing at /", () => {
    renderWithProviders(<NotFound />, { initialEntries: ["/missing"] });
    const link = screen.getByRole("link", { name: /Back to Home/i });
    expect(link).toHaveAttribute("href", "/");
  });

  it("logs an error to the console with the bad path", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    renderWithProviders(<NotFound />, { initialEntries: ["/oops"] });
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("404 Error"),
      "/oops",
    );
    spy.mockRestore();
  });
});
