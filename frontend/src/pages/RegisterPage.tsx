import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { gql } from "@/lib/graphql";
import { REGISTER_MUTATION, LOGIN_MUTATION } from "@/lib/queries";
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

const RegisterPage = () => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    occupation: "",
    address: "",
    bio: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { toast } = useToast();

  const update =
    (k: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFormData((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.email.trim() ||
      !formData.occupation.trim() ||
      !formData.address.trim()
    ) {
      toast({ title: "Error", description: "Required form data missing", variant: "destructive" });
      return;
    }
    if (formData.password.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    let reg;
    try {
      reg = await gql<{
        register: { success: boolean; errors: string[] | null; user: User | null };
      }>(REGISTER_MUTATION, {
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        occupation: formData.occupation.trim(),
        address: formData.address.trim(),
        bio: formData.bio.trim(),
      });
    } catch (err: any) {
      toast({
        title: "Registration failed",
        description: err?.message || "Could not create account. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!reg?.register?.success || !reg.register.user) {
      toast({
        title: "Registration failed",
        description: reg?.register?.errors?.[0] || "Could not create account",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const login = await gql<{
        login: { token: string | null; success: boolean; errors: string[] | null; user: User | null };
      }>(LOGIN_MUTATION, {
        email: formData.email.trim(),
        password: formData.password,
      });

      if (login.login.success && login.login.token && login.login.user) {
        setAuth(login.login.user, login.login.token);
        toast({ title: "Welcome to Free Mentors!", description: "Your account has been created." });
        navigate("/dashboard/user", { replace: true });
      } else {
        toast({ title: "Account created", description: "Please log in to continue." });
        navigate("/login", { replace: true });
      }
    } catch {
      toast({ title: "Account created", description: "Please log in to continue." });
      navigate("/login", { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  const smallPlaceholder = {
    "& input::placeholder": { fontSize: "0.75rem", opacity: 1 },
  } as const;

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
          maxWidth: 512,
          position: "relative",
          zIndex: 10,
          my: 3,
        }}
      >
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
              <GraduationCap size={32} color={theme.palette.primary.contrastText} />
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
            Create an account
          </Typography>
          <Typography
            sx={{
              fontSize: "0.875rem",
              color: "text.secondary",
              textAlign: "center",
              mt: 0.75,
            }}
          >
            Join Free Mentors and connect with experienced professionals
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          <CardContent>
            <Stack spacing={2}>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <Stack spacing={1}>
                  <Typography component="label" htmlFor="firstName" sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                    First Name
                  </Typography>
                  <TextField
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    required
                    fullWidth
                    size="small"
                    onChange={update("firstName")}
                    sx={smallPlaceholder}
                  />
                </Stack>
                <Stack spacing={1}>
                  <Typography component="label" htmlFor="lastName" sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                    Last Name
                  </Typography>
                  <TextField
                    id="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    required
                    fullWidth
                    size="small"
                    onChange={update("lastName")}
                    sx={smallPlaceholder}
                  />
                </Stack>
              </Box>

              <Stack spacing={1}>
                <Typography component="label" htmlFor="email" sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                  Email
                </Typography>
                <TextField
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  required
                  fullWidth
                  size="small"
                  onChange={update("email")}
                  sx={smallPlaceholder}
                />
              </Stack>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <Stack spacing={1}>
                  <Typography component="label" htmlFor="address" sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                    Address
                  </Typography>
                  <TextField
                    id="address"
                    placeholder="City - Country"
                    value={formData.address}
                    required
                    fullWidth
                    size="small"
                    onChange={update("address")}
                    sx={smallPlaceholder}
                  />
                </Stack>
                <Stack spacing={1}>
                  <Typography component="label" htmlFor="occupation" sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                    Occupation
                  </Typography>
                  <TextField
                    id="occupation"
                    placeholder="e.g: Junior Developer"
                    value={formData.occupation}
                    required
                    fullWidth
                    size="small"
                    onChange={update("occupation")}
                    sx={smallPlaceholder}
                  />
                </Stack>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <Stack spacing={1}>
                  <Typography component="label" htmlFor="password" sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                    Password
                  </Typography>
                  <TextField
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    required
                    fullWidth
                    size="small"
                    onChange={update("password")}
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
                  <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                    Min 8 characters
                  </Typography>
                </Stack>
                <Stack spacing={1}>
                  <Typography component="label" htmlFor="confirmPassword" sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                    Confirm Password
                  </Typography>
                  <TextField
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    required
                    fullWidth
                    size="small"
                    onChange={update("confirmPassword")}
                    error={
                      formData.confirmPassword.length > 0 &&
                      formData.password !== formData.confirmPassword
                    }
                    helperText={
                      formData.confirmPassword.length > 0 &&
                      formData.password !== formData.confirmPassword
                        ? "Passwords do not match"
                        : " "
                    }
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowConfirm((s) => !s)}
                              edge="end"
                              size="small"
                              aria-label="toggle confirm password visibility"
                              sx={{ color: "text.secondary" }}
                            >
                              {showConfirm ? (
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
              </Box>

              <Stack spacing={1}>
                <Typography component="label" htmlFor="bio" sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                  Bio (optional)
                </Typography>
                <TextField
                  id="bio"
                  placeholder="Tell us a bit about yourself and what you're looking for in a mentor"
                  value={formData.bio}
                  multiline
                  rows={3}
                  fullWidth
                  size="small"
                  onChange={update("bio")}
                />
              </Stack>
            </Stack>
          </CardContent>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 3, pt: 0 }}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ height: 40 }}
            >
              Create Account
            </Button>
            <Typography sx={{ fontSize: "0.875rem", textAlign: "center", color: "text.secondary" }}>
              Already have an account?{" "}
              <Link component={RouterLink} to="/login" sx={{ fontWeight: 500 }}>
                Sign in
              </Link>
            </Typography>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default RegisterPage;