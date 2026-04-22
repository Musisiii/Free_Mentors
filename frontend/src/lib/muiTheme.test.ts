import { describe, it, expect } from "vitest";
import { darkMuiTheme, lightMuiTheme } from "./muiTheme";

describe("muiTheme", () => {
  it("exports a dark theme with primary palette set", () => {
    expect(darkMuiTheme.palette.mode).toBe("dark");
    expect(darkMuiTheme.palette.primary.main).toBeTruthy();
  });

  it("exports a light theme with primary palette set", () => {
    expect(lightMuiTheme.palette.mode).toBe("light");
    expect(lightMuiTheme.palette.primary.main).toBeTruthy();
  });

  it("registers custom button variants", () => {
    const variants = (darkMuiTheme.components?.MuiButton as any)?.variants;
    expect(Array.isArray(variants)).toBe(true);
    expect(variants.length).toBeGreaterThan(0);
  });
});
