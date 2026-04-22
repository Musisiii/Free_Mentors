import { Link as RouterLink, Outlet } from "react-router-dom";
import {
  AppBar,
  Box,
  Container,
  Stack,
  Toolbar,
  Typography,
  useTheme,
} from "@mui/material";
import { GraduationCap } from "lucide-react";

export const MainLayout = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          top: 0,
          bgcolor: "background.default",
          color: "text.primary",
          borderBottom: 1,
          borderColor: "divider",
          backdropFilter: "blur(8px)",
          backgroundImage: "none",
        }}
      >
        <Container maxWidth="lg" disableGutters>
          <Toolbar
            sx={{
              minHeight: 64,
              px: { xs: 2, sm: 3 },
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Stack
              component={RouterLink}
              to="/"
              direction="row"
              spacing={1}
              sx={{ textDecoration: "none", color: "inherit", alignItems: "center" }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: "primary.main",
                  borderRadius: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <GraduationCap
                  size={20}
                  color={theme.palette.primary.contrastText}
                />
              </Box>
              <Typography
                variant="h6"
                sx={{ lineHeight: 1, display: "flex", alignItems: "center", fontWeight: 700 }}
              >
                Free Mentors
              </Typography>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <Box component="main" sx={{ flex: 1 }}>
        <Outlet />
      </Box>

      <Box
        component="footer"
        sx={{
          position: "sticky",
          bottom: 0,
          zIndex: 50,
          width: "100%",
          borderTop: 1,
          borderColor: "divider",
          bgcolor: "background.default",
          backdropFilter: "blur(8px)",
          py: 1.5,
          textAlign: "center",
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", opacity: 0.6 }}
        >
          <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
            © 2026 Free Mentors.
          </Box>
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
            © 2026 Free Mentors. Connecting learners with experienced mentors.
          </Box>
        </Typography>
      </Box>
    </Box>
  );
};
