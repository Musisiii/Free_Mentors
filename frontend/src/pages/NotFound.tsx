import { Link as RouterLink, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { Home, AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 3,
        bgcolor: "background.default",
      }}
    >
      <Stack spacing={3} sx={{ textAlign: "center", maxWidth: 480,  alignItems:"center" }}>
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            bgcolor: "rgba(58, 88, 65, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AlertTriangle size={36} color="#7da487" />
        </Box>

        <Typography
          component="h1"
          sx={{
            fontSize: { xs: "4rem", md: "5rem" },
            fontWeight: 700,
            lineHeight: 1,
            color: "primary.main",
          }}
        >
          404
        </Typography>

        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Page not found
        </Typography>

        <Typography sx={{ color: "text.secondary" }}>
          The page{" "}
          <Box
            component="code"
            sx={{
              px: 0.75,
              py: 0.25,
              borderRadius: 0.5,
              bgcolor: "rgba(255,255,255,0.06)",
              fontFamily: "monospace",
              fontSize: "0.9em",
            }}
          >
            {location.pathname}
          </Box>{" "}
          doesn't exist or has been moved.
        </Typography>

        <Button
          component={RouterLink}
          to="/"
          variant="contained"
          startIcon={<Home size={18} />}
          sx={{ textTransform: "none", mt: 1 }}
        >
          Back to Home
        </Button>
      </Stack>
    </Box>
  );
};

export default NotFound;
