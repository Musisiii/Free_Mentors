import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { gql } from "@/lib/graphql";
import { LOGIN_MUTATION } from "@/lib/queries";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap } from "lucide-react";
import { User } from "@/types";

import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

interface LoginResponse {
  login: {
    token: string | null;
    success: boolean;
    errors: string[] | null;
    user: User | null;
  };
}

const LoginPage = () => {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { toast } = useToast();

  const testAccounts = [
    { label: "Admin", email: "admin@freementors.com" },
    { label: "Mentor", email: "mentor1.free@freementors.com" },
    { label: "User", email: "user1.free@freementors.com" },
  ];
  const testPassword = "Password123!";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await gql<LoginResponse>(LOGIN_MUTATION, {
        email: email.trim(),
        password,
      });
      const result = data.login;
      if (!result.success || !result.token || !result.user) {
        toast({
          title: "Login failed",
          description: result.errors?.[0] || "Invalid credentials",
          variant: "destructive",
        });
        return;
      }
      setAuth(result.user, result.token);
      toast({
        title: `Welcome back ${result.user.firstName} ${result.user.lastName}!`,
      });
      const paths: Record<string, string> = {
        ADMIN: "/dashboard/admin",
        MENTOR: "/dashboard/mentor",
        USER: "/dashboard/user",
      };
      navigate(paths[result.user.role] || "/", { replace: true });
    } catch (err: any) {
      toast({
        title: "Login failed",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fillTestAccount = (testEmail: string) => {
    setEmail(testEmail);
    setPassword(testPassword);
  };

  return (
    <Box
      className="min-h-[calc(100vh-7rem)] flex items-center justify-center p-4 relative auth-bg"
      sx={{ backgroundImage: `url('/images/pic4.png')` }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          bgcolor: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
        }}
      />
      <Card
        sx={{
          width: "100%",
          maxWidth: 448,
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Header — matches shadcn CardHeader: p-6, space-y-1.5 */}
        <Box sx={{ p: 3, pb: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
            }}
          >
            <Box
              sx={{
                p: 1.5,
                bgcolor: "primary.main",
                borderRadius: 1.5,
                display: "inline-flex",
                lineHeight: 0,
              }}
            >
              <GraduationCap
                size={32}
                color={theme.palette.primary.contrastText}
              />
            </Box>
          </Box>
          <Typography
            component="h3"
            sx={{
              fontSize: "1.5rem",
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: "-0.025em",
              textAlign: "center",
            }}
          >
            Welcome back
          </Typography>
          <Typography
            sx={{
              fontSize: "0.875rem",
              color: "text.secondary",
              textAlign: "center",
              mt: 0.75,
            }}
          >
            Enter your email to access your account
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          <CardContent>
            <Stack spacing={2}>
              <Stack spacing={1}>
                <Typography
                  component="label"
                  htmlFor="email"
                  sx={{ fontSize: "0.875rem", fontWeight: 500 }}
                >
                  Email
                </Typography>
                <TextField
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  required
                  fullWidth
                  size="small"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Stack>

              <Stack spacing={1}>
                <Typography
                  component="label"
                  htmlFor="password"
                  sx={{ fontSize: "0.875rem", fontWeight: 500 }}
                >
                  Password
                </Typography>
                <TextField
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  required
                  fullWidth
                  size="small"
                  onChange={(e) => setPassword(e.target.value)}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword((s) => !s)}
                            edge="end"
                            size="small"
                            aria-label="toggle password visibility"
                            sx={{ color: "text.secondary" }}
                          >
                            {showPassword ? (
                              <VisibilityOffIcon fontSize="small" />
                            ) : (
                              <VisibilityIcon fontSize="small" />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Stack>

              {/* Test accounts block — matches original border-t pt-3 */}
              <Box
                sx={{
                  textAlign: "center",
                  fontSize: "0.75rem",
                  mt: 1,
                  pt: 1.5,
                  borderTop: 1,
                  borderColor: "divider",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    color: "text.primary",
                  }}
                >
                  Test accounts (click to fill):
                </Typography>
                <Stack spacing={0.25} sx={{ mt: 0.5 }}>
                  {testAccounts.map((account) => (
                    <Box
                      key={account.email}
                      component="button"
                      type="button"
                      onClick={() => fillTestAccount(account.email)}
                      sx={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        fontSize: "0.75rem",
                        fontFamily: "inherit",
                        color: "text.primary",
                        "&:hover": { color: "primary.main" },
                      }}
                    >
                      <Box
                        component="span"
                        sx={{ color: "text.secondary" }}
                      >
                        {account.label}:
                      </Box>{" "}
                      {account.email}
                    </Box>
                  ))}
                </Stack>
                <Typography sx={{ fontSize: "0.75rem", mt: 0.5 }}>
                  <Box component="span" sx={{ color: "text.secondary" }}>
                    Password:
                  </Box>{" "}
                  {testPassword}
                </Typography>
              </Box>
            </Stack>
          </CardContent>

          {/* Footer — matches shadcn CardFooter: p-6 pt-0, flex-col space-y-4 */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              p: 3,
              pt: 0,
            }}
          >
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isLoading}
              startIcon={
                isLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : null
              }
              sx={{ height: 40 }}
            >
              Sign In
            </Button>
            <Typography
              sx={{
                fontSize: "0.875rem",
                textAlign: "center",
                color: "text.secondary",
              }}
            >
              Don't have an account?{" "}
              <Link
                component={RouterLink}
                to="/register"
                sx={{ fontWeight: 500 }}
              >
                Register here
              </Link>
            </Typography>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default LoginPage;
