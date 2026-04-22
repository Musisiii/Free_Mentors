import { createTheme, Theme } from "@mui/material/styles";

// HSL color helper that returns valid CSS for any alpha
const hsl = (h: number, s: number, l: number, a = 1) =>
  `hsla(${h}, ${s}%, ${l}%, ${a})`;
// Apply an alpha override to an existing token (since tokens are hsla strings)
const alpha = (color: string, a: number) =>
  color.replace(/hsla?\(([^,]+),([^,]+),([^,]+),[^)]+\)/, `hsla($1,$2,$3,${a})`);

const buildTheme = (mode: "light" | "dark"): Theme => {
  const isDark = mode === "dark";

  const tokens = isDark
    ? {
        background: hsl(0, 0, 10),
        foreground: hsl(0, 0, 95),
        card: hsl(0, 0, 14),
        primary: hsl(127, 19, 45),
        primaryHover: hsl(127, 19, 50),
        primaryFg: hsl(0, 0, 10),
        secondary: hsl(0, 0, 20),
        secondaryFg: hsl(0, 0, 95),
        muted: hsl(0, 0, 20),
        mutedFg: hsl(0, 0, 60),
        border: hsl(0, 0, 24),
        borderHover: hsl(0, 0, 32),
        input: hsl(0, 0, 24),
        destructive: hsl(0, 84, 60),
        destructiveFg: hsl(0, 0, 100),
        success: hsl(142, 76, 36),
        warning: hsl(38, 92, 50),
        ring: hsl(127, 19, 45),
      }
    : {
        background: hsl(0, 0, 100),
        foreground: hsl(0, 0, 10),
        card: hsl(0, 0, 100),
        primary: hsl(127, 19, 28),
        primaryHover: hsl(127, 19, 24),
        primaryFg: hsl(0, 0, 100),
        secondary: hsl(0, 0, 96),
        secondaryFg: hsl(127, 19, 28),
        muted: hsl(0, 0, 96),
        mutedFg: hsl(0, 0, 45),
        border: hsl(0, 0, 90),
        borderHover: hsl(0, 0, 78),
        input: hsl(0, 0, 90),
        destructive: hsl(0, 84, 60),
        destructiveFg: hsl(0, 0, 100),
        success: hsl(142, 76, 36),
        warning: hsl(38, 92, 50),
        ring: hsl(127, 19, 28),
      };

  return createTheme({
    palette: {
      mode,
      primary: {
        main: tokens.primary,
        dark: tokens.primaryHover,
        contrastText: tokens.primaryFg,
      },
      secondary: {
        main: tokens.secondary,
        contrastText: tokens.secondaryFg,
      },
      error: { main: tokens.destructive, contrastText: tokens.destructiveFg },
      success: { main: tokens.success, contrastText: "#fff" },
      warning: { main: tokens.warning, contrastText: "#fff" },
      background: { default: tokens.background, paper: tokens.card },
      text: { primary: tokens.foreground, secondary: tokens.mutedFg },
      divider: tokens.border,
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily:
        '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      button: { textTransform: "none", fontWeight: 500, letterSpacing: 0 },
      h5: { fontWeight: 600, letterSpacing: "-0.01em" },
      h6: { fontWeight: 600, letterSpacing: "-0.01em" },
      body1: { fontSize: "0.875rem" },
      body2: { fontSize: "0.875rem" },
      caption: { fontSize: "0.75rem" },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            fontFeatureSettings: '"rlig" 1, "calt" 1',
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true, disableRipple: false },
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 500,
            fontSize: "0.875rem",
            paddingTop: 8,
            paddingBottom: 8,
            // Tailwind's `transition-colors` = 150ms ease
            transition:
              "background-color 150ms ease, color 150ms ease, border-color 150ms ease, text-decoration-color 150ms ease, fill 150ms ease, stroke 150ms ease",
          },
          // ─── Mirror of components/ui/button.tsx variants ──────────────
          // default
          containedPrimary: {
            backgroundColor: `${tokens.primary} !important`,
            color: `${tokens.primaryFg} !important`,
            "&:hover": {
              backgroundColor: `${alpha(tokens.primary, 0.2)} !important`, // primary/20
              color: `${tokens.primary} !important`,
            },
            "&.Mui-disabled": {
              backgroundColor: `${tokens.primary} !important`,
              color: `${tokens.primaryFg} !important`,
              opacity: 0.7,
            },
          },
          // destructive
          containedError: {
            backgroundColor: `${tokens.destructive} !important`,
            color: `${tokens.destructiveFg} !important`,
            "&:hover": {
              backgroundColor: `${alpha(tokens.destructive, 0.2)} !important`,
              color: `${tokens.primary} !important`,
            },
            "&.Mui-disabled": {
              backgroundColor: `${tokens.destructive} !important`,
              color: `${tokens.destructiveFg} !important`,
              opacity: 0.7,
            },
          },
          // secondary
          containedSecondary: {
            backgroundColor: `${tokens.secondary} !important`,
            color: `${tokens.secondaryFg} !important`,
            "&:hover": {
              backgroundColor: `${alpha(tokens.primary, 0.2)} !important`,
              color: `${tokens.primary} !important`,
            },
            "&.Mui-disabled": {
              backgroundColor: `${tokens.secondary} !important`,
              color: `${tokens.secondaryFg} !important`,
              opacity: 0.7,
            },
          },
          // outline (primary)
          outlinedPrimary: {
            borderColor: `${tokens.primary} !important`,
            backgroundColor: `${tokens.background} !important`,
            color: `${tokens.primary} !important`,
            "&:hover": {
              backgroundColor: `${alpha(tokens.primary, 0.1)} !important`, // primary/10
              borderColor: `${tokens.primary} !important`,
            },
            "&.Mui-disabled": {
              opacity: 0.5,
            },
          },
          // outline_destructive
          outlinedError: {
            borderColor: `${tokens.destructive} !important`,
            backgroundColor: `${tokens.background} !important`,
            color: `${tokens.destructive} !important`,
            "&:hover": {
              backgroundColor: `${alpha(tokens.destructive, 0.1)} !important`,
              borderColor: `${tokens.destructive} !important`,
            },
          },
          // ghost (text)
          textPrimary: {
            color: `${tokens.primary} !important`,
            "&:hover": {
              backgroundColor: `${alpha(tokens.primary, 0.2)} !important`,
              color: `${tokens.primary} !important`,
            },
          },
        },
        variants: [
          // default_landing
          {
            props: { variant: "default_landing" as any },
            style: {
              backgroundColor: tokens.primary,
              color: tokens.primaryFg,
              "&:hover": { backgroundColor: alpha(tokens.primary, 0.6) }, // /60
            },
          },
          // outline_landing
          {
            props: { variant: "outline_landing" as any },
            style: {
              border: `1px solid ${tokens.primary}`,
              backgroundColor: tokens.background,
              color: tokens.primary,
              "&:hover": { backgroundColor: alpha(tokens.background, 0.7) }, // /70
            },
          },
          // outline_user (yellow-700)
          {
            props: { variant: "outline_user" as any },
            style: {
              border: `1px solid #a16207`,
              backgroundColor: tokens.background,
              color: "#a16207",
              "&:hover": { backgroundColor: "rgba(113, 63, 18, 0.10)" }, // yellow-900/10
            },
          },
          // outline_complete (blue)
          {
            props: { variant: "outline_complete" as any },
            style: {
              border: `1px solid #1d4ed8`,
              backgroundColor: tokens.background,
              color: "#1e40af",
              "&:hover": { backgroundColor: "rgba(30, 58, 138, 0.10)" }, // blue-900/10
            },
          },
          // secondary_landing
          {
            props: { variant: "secondary_landing" as any },
            style: {
              backgroundColor: tokens.secondary,
              color: tokens.secondaryFg,
              "&:hover": {
                backgroundColor: tokens.background,
                color: tokens.primary,
              },
            },
          },
          // ghost
          {
            props: { variant: "ghost" as any },
            style: {
              backgroundColor: "transparent",
              color: tokens.foreground,
              "&:hover": {
                backgroundColor: alpha(tokens.primary, 0.2),
                color: tokens.primary,
              },
            },
          },
          // link
          {
            props: { variant: "link" as any },
            style: {
              backgroundColor: "transparent",
              color: tokens.primary,
              textUnderlineOffset: "4px",
              "&:hover": {
                textDecoration: "underline",
                backgroundColor: alpha(tokens.primary, 0.2),
                color: tokens.primary,
              },
            },
          },
        ],
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            backgroundColor: tokens.background,
            fontSize: "0.875rem",
            "& fieldset": {
              borderColor: tokens.input,
              transition: "border-color 0.15s ease",
            },
            "&:hover:not(.Mui-focused) fieldset": {
              borderColor: tokens.borderHover,
            },
            "&.Mui-focused fieldset": {
              borderColor: tokens.ring,
              borderWidth: 1,
              boxShadow: `0 0 0 2px ${alpha(tokens.ring, 0.2)}`,
            },
            "& input::placeholder, & textarea::placeholder": {
              color: tokens.mutedFg,
              opacity: 1,
              fontSize: "0.875rem",
            },
          },
          input: { fontSize: "0.875rem" },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          input: { fontSize: "0.875rem" },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: tokens.mutedFg,
            fontSize: "0.875rem",
            "&.Mui-focused": { color: tokens.ring },
          },
        },
      },
      MuiFormLabel: {
        styleOverrides: {
          root: { fontSize: "0.875rem" },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            border: `1px solid ${tokens.border}`,
            boxShadow: "0 1px 2px rgba(16, 24, 40, 0.06)",
          },
        },
      },
      MuiCardHeader: {
        styleOverrides: {
          root: { padding: 24, paddingBottom: 0 },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            padding: 24,
            "&:last-child": { paddingBottom: 24 },
          },
        },
      },
      MuiCardActions: {
        styleOverrides: {
          root: { padding: 24, paddingTop: 0 },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 6, fontWeight: 500 },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 12 },
        },
      },
      MuiLink: {
        defaultProps: { underline: "hover" },
        styleOverrides: {
          root: { color: tokens.primary },
        },
      },
    },
  });
};

export const lightMuiTheme = buildTheme("light");
export const darkMuiTheme = buildTheme("dark");
