import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { GraduationCap, Shield, Users, TrendingUp } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

interface Feature {
  icon: typeof GraduationCap;
  title: string;
  text: string;
}

const features: Feature[] = [
  {
    icon: GraduationCap,
    title: "Expert Guidance",
    text: "Connect with experienced mentors who can guide you through your learning journey.",
  },
  {
    icon: Shield,
    title: "Safe & Secure",
    text: "Your data is protected with industry-standard authentication and encrypted connections.",
  },
  {
    icon: Users,
    title: "Community Driven",
    text: "Join thousands of learners accelerating their careers with mentor guidance.",
  },
  {
    icon: TrendingUp,
    title: "Always Improving",
    text: "We continuously update the platform with new features based on user feedback.",
  },
];

const stats = [
  { value: "2K+", label: "Active Users" },
  { value: "300+", label: "Experienced Mentors" },
  { value: "90%", label: "User Satisfaction" },
];

const LandingPage = () => {
  const theme = useTheme();
  const { isAuthenticated, user } = useAuthStore();

  const dashboardPath =
    user?.role === "ADMIN"
      ? "/dashboard/admin"
      : user?.role === "MENTOR"
        ? "/dashboard/mentor"
        : "/dashboard/user";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Hero */}
      <Container
        component="section"
        sx={{
          position: "relative",
          pt: { xs: 18, md: 24 },
          pb: { xs: 2, md: 2 },
          backgroundImage: `url('/images/pic4.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Box
          aria-hidden
          sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,0.4)" }}
        />
        <Box sx={{ position: "relative", zIndex: 1, maxWidth: 960, mx: "auto" }}>
          <Stack spacing={2} sx={{ textAlign: "center", alignItems: "center" }}>
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: "2.25rem", md: "3.75rem" },
                fontWeight: 700,
                letterSpacing: "-0.025em",
                color: "common.white",
              }}
            >
              Connect with{" "}
              <Box component="span" sx={{ color: "primary.main" }}>
                Expert Mentors
              </Box>
            </Typography>
            <Typography
              sx={{
                fontSize: "1.25rem",
                color: "rgba(255,255,255,0.9)",
                maxWidth: 640,
                mx: "auto",
              }}
            >
              Accelerate your learning journey with personalized guidance from experienced
              professionals in your field.
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="center"
              sx={{ pt: 2 }}
            >
              <Button
                size="large"
                variant={"default_landing" as any}
                component={RouterLink}
                to={isAuthenticated ? dashboardPath : "/register"}
              >
                {isAuthenticated ? "Open Dashboard" : "Register"}
              </Button>
              <Button
                size="large"
                variant={"outline_landing" as any}
                component={RouterLink}
                to={isAuthenticated ? "/mentors" : "/login"}
              >
                {isAuthenticated ? "Browse Mentors" : "Sign In"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Container>

      {/* Features */}
      <Container component="section" sx={{ py: 10 }}>
        <Stack spacing={2} sx={{ textAlign: "center", alignItems: "center", mb: 6 }}>
          <Typography
            component="h2"
            sx={{
              fontSize: { xs: "1.875rem", md: "2.25rem" },
              fontWeight: 700,
            }}
          >
            Why Choose Free Mentors?
          </Typography>
          <Typography sx={{ color: "text.secondary", maxWidth: 640, mx: "auto" }}>
            A simple, free platform to connect with experienced professionals.
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)",
            },
          }}
        >
          {features.map(({ icon: Icon, title, text }) => (
            <Card key={title}>
              <CardContent>
                <Stack spacing={1.5} sx={{ pt: 0.5 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: "rgba(58, 88, 65, 0.1)",
                      borderRadius: 1.5,
                      width: "fit-content",
                      lineHeight: 0,
                    }}
                  >
                    <Icon size={24} color={theme.palette.primary.main} />
                  </Box>
                  <Typography
                    component="h3"
                    sx={{ fontSize: "1.25rem", fontWeight: 600 }}
                  >
                    {title}
                  </Typography>
                  <Typography sx={{ color: "text.secondary" }}>{text}</Typography>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>

      {/* About */}
      <Container component="section" sx={{ pb: 5 }}>
        <Box sx={{ maxWidth: 896, mx: "auto" }}>
          <Stack spacing={2} sx={{ textAlign: "center", alignItems: "center", mb: 4 }}>
            <Typography
              component="h2"
              sx={{ fontSize: { xs: "1.875rem", md: "2.25rem" }, fontWeight: 700 }}
            >
              About Free Mentors
            </Typography>
          </Stack>

          <Stack spacing={3} sx={{ color: "text.secondary" }}>
            <Typography sx={{ fontSize: "1.125rem", lineHeight: 1.7 }}>
              Free Mentors was founded with a simple mission: to make mentorship more
              accessible and effective for everyone. We believe that everyone deserves access
              to guidance that can accelerate their personal and professional growth.
            </Typography>

            <Box
              sx={{
                display: "grid",
                gap: 4,
                pt: 4,
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              }}
            >
              {stats.map((s) => (
                <Stack key={s.label} spacing={1} sx={{ textAlign: "center" }}>
                  <Typography
                    sx={{
                      fontSize: "2.25rem",
                      fontWeight: 700,
                      color: "primary.main",
                    }}
                  >
                    {s.value}
                  </Typography>
                  <Typography sx={{ fontSize: "0.875rem" }}>{s.label}</Typography>
                </Stack>
              ))}
            </Box>
          </Stack>
        </Box>
      </Container>

      {/* CTA */}
      <Container component="section" sx={{ pt: 5, pb: 10 }}>
        <Card sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}>
          <CardContent sx={{ pt: 8, pb: 14, px: 3, textAlign: "center" }}>
            <Stack spacing={3} sx={{ alignItems: "center" }}>
              <Typography
                component="h2"
                sx={{ fontSize: { xs: "1.875rem", md: "2.25rem" }, fontWeight: 700 }}
              >
                Ready to Start Your Mentorship Journey?
              </Typography>
              <Typography
                sx={{
                  fontSize: "1.25rem",
                  color: "rgba(0,0,0,0.7)",
                  maxWidth: 640,
                  mx: "auto",
                  textAlign: "center",
                }}
              >
                Join thousands of learners who have accelerated their careers with Free
                Mentors.
              </Typography>
              <Box sx={{ pt: 1 }}>
                <Button
                  size="large"
                  variant={"secondary_landing" as any}
                  component={RouterLink}
                  to={isAuthenticated ? "/mentors" : "/register"}
                >
                  {isAuthenticated ? "Find a Mentor" : "Get Started"}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default LandingPage;
