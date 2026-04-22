import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gql } from "@/lib/graphql";
import {
  ALL_USERS_QUERY,
  ALL_REVIEWS_QUERY,
  TOGGLE_MENTOR_STATUS_MUTATION,
  HIDE_REVIEW_MUTATION,
} from "@/lib/queries";
import { useAuthStore } from "@/stores/authStore";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material";
import { useToast } from "@/hooks/use-toast";
import { StatCard } from "@/components/ui/stat-card";
import {
  Users,
  GraduationCap,
  ShieldCheck,
  Star,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  PenLine,
  LogOut,
} from "lucide-react";
import { Review, User } from "@/types";

type Tab = "users" | "reviews";
type UserCategory = "all" | "mentees" | "mentors" | "admins";
type ReviewCategory = "all" | "visible" | "hidden";

const roleChipSx: Record<string, any> = {
  USER: { bgcolor: "rgba(113, 63, 18, 0.5)", color: "#facc15" },
  MENTOR: { bgcolor: "rgba(58, 88, 65, 0.2)", color: "primary.main" },
  ADMIN: { bgcolor: "rgba(30, 58, 138, 0.5)", color: "#60a5fa" },
};

const AdminDashboardPage = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const handleLogout = () => {
    clearAuth();
    toast({ title: `See you next time ${user?.firstName} ${user?.lastName}!` });
    navigate("/login");
  };
  const queryClient = useQueryClient();
  const theme = useTheme();
  const [tab, setTab] = useState<Tab>("users");
  const [selectedUserCategory, setSelectedUserCategory] =
    useState<UserCategory>("all");
  const [selectedReviewCategory, setSelectedReviewCategory] =
    useState<ReviewCategory>("all");

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const res = await gql<{ allUsers: User[] }>(ALL_USERS_QUERY);
      return res.allUsers;
    },
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ["all-reviews-admin"],
    queryFn: async () => {
      const res = await gql<{ allReviews: Review[] }>(ALL_REVIEWS_QUERY);
      return res.allReviews;
    },
  });

  const toggleMentor = useMutation({
    mutationFn: async (userId: string) => {
      const res = await gql<{
        toggleMentorStatus: { success: boolean; errors: string[] | null };
      }>(TOGGLE_MENTOR_STATUS_MUTATION, { userId });
      if (!res.toggleMentorStatus.success) {
        throw new Error(
          res.toggleMentorStatus.errors?.[0] || "Failed to update role",
        );
      }
    },
    onSuccess: () => {
      toast({ title: "Role updated" });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      queryClient.invalidateQueries({ queryKey: ["all-mentors"] });
    },
    onError: (err: any) =>
      toast({
        title: "Update failed",
        description: err.message,
        variant: "destructive",
      }),
  });

  const hideReview = useMutation({
    mutationFn: async (reviewId: string) => {
      const res = await gql<{
        hideReview: { success: boolean; errors: string[] | null };
      }>(HIDE_REVIEW_MUTATION, { reviewId });
      if (!res.hideReview.success) {
        throw new Error(res.hideReview.errors?.[0] || "Failed");
      }
    },
    onSuccess: () => {
      toast({ title: "Review visibility toggled" });
      queryClient.invalidateQueries({ queryKey: ["all-reviews-admin"] });
      queryClient.invalidateQueries({ queryKey: ["all-reviews"] });
    },
    onError: (err: any) =>
      toast({
        title: "Failed",
        description: err.message,
        variant: "destructive",
      }),
  });

  const totalUsers = users?.length ?? 0;
  const totalMentees = users?.filter((u) => u.role === "USER").length ?? 0;
  const totalMentors = users?.filter((u) => u.role === "MENTOR").length ?? 0;
  const totalAdmins = users?.filter((u) => u.role === "ADMIN").length ?? 0;

  const getFilteredUsers = () => {
    if (!users) return [];
    switch (selectedUserCategory) {
      case "mentees":
        return users.filter((u) => u.role === "USER");
      case "mentors":
        return users.filter((u) => u.role === "MENTOR");
      case "admins":
        return users.filter((u) => u.role === "ADMIN");
      default:
        return users;
    }
  };

  const filteredUsers = getFilteredUsers();

  const getFilteredReviews = () => {
    if (!reviews) return [];
    switch (selectedReviewCategory) {
      case "visible":
        return reviews.filter((r) => !r.isHidden);
      case "hidden":
        return reviews.filter((r) => r.isHidden);
      default:
        return reviews;
    }
  };

  const filteredReviews = getFilteredReviews();

  const navBtnSx = (active: boolean) => ({
    justifyContent: "flex-start",
    width: "100%",
    color: "text.primary",
    bgcolor: active ? "secondary.main" : "transparent",
    "&:hover": {
      bgcolor: active ? "secondary.main" : "rgba(0,0,0,0.04)",
    },
    textTransform: "none",
    fontWeight: 500,
    px: 1.5,
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "280px 1fr" },
          gap: 3,
          alignItems: "start",
        }}
      >
        <Box sx={{ position: { lg: "sticky" }, top: { lg: 160 } }}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <Box
                    sx={{
                      borderRadius: "50%",
                      bgcolor: "rgba(58, 88, 65, 0.1)",
                      width: 48,
                      height: 48,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ShieldCheck size={24} color={theme.palette.primary.main} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {user?.firstName} {user?.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user?.email}
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={user?.role}
                        size="small"
                        sx={{
                          ...roleChipSx[user?.role || "ADMIN"],
                          fontWeight: 600,
                          fontSize: "0.7rem",
                          height: 20,
                        }}
                      />
                    </Box>
                  </Box>
                </Stack>

                <Box sx={{ pt: 1, borderTop: 1, borderColor: "divider" }}>
                  <Stack spacing={0.5}>
                    <Button
                      size="small"
                      onClick={() => setTab("users")}
                      sx={navBtnSx(tab === "users")}
                      startIcon={<Users size={16} />}
                    >
                      Users
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setTab("reviews")}
                      sx={navBtnSx(tab === "reviews")}
                      startIcon={<Star size={16} />}
                    >
                      Reviews
                    </Button>
                    <Button
                      size="small"
                      component={RouterLink}
                      to="/mentors"
                      sx={navBtnSx(false)}
                      startIcon={<GraduationCap size={16} />}
                    >
                      Mentors
                    </Button>
                  </Stack>
                </Box>

                <Box sx={{ pt: 1, borderTop: 1, borderColor: "divider" }}>
                  <Button
                    size="small"
                    onClick={handleLogout}
                    startIcon={<LogOut size={16} />}
                    sx={{
                      ...navBtnSx(false),
                      color: "#ef4444",
                      "&:hover": { bgcolor: "rgba(239, 68, 68, 0.1)" },
                    }}
                  >
                    Logout
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Stack spacing={3}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Admin Dashboard
          </Typography>

          {tab === "users" && (
            <>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)", md: "repeat(4, 1fr)" },
                  gap: 2,
                }}
              >
                <StatCard
                  label="Total Users"
                  value={totalUsers}
                  loading={usersLoading}
                  icon={<Users className="h-7 w-7 text-gray-500" />}
                  isActive={selectedUserCategory === "all"}
                  onClick={() => setSelectedUserCategory("all")}
                />
                <StatCard
                  label="Mentees"
                  value={totalMentees}
                  loading={usersLoading}
                  icon={<PenLine className="h-7 w-7 text-yellow-700" />}
                  isActive={selectedUserCategory === "mentees"}
                  onClick={() => setSelectedUserCategory("mentees")}
                />
                <StatCard
                  label="Mentors"
                  value={totalMentors}
                  loading={usersLoading}
                  icon={<GraduationCap className="h-7 w-7 text-primary" />}
                  isActive={selectedUserCategory === "mentors"}
                  onClick={() => setSelectedUserCategory("mentors")}
                />
                <StatCard
                  label="Admins"
                  value={totalAdmins}
                  loading={usersLoading}
                  icon={<ShieldCheck className="h-7 w-7 text-blue-700" />}
                  isActive={selectedUserCategory === "admins"}
                  onClick={() => setSelectedUserCategory("admins")}
                />
              </Box>

              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      All Users
                    </Typography>

                    {usersLoading ? (
                      <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : filteredUsers.length === 0 ? (
                      <Box sx={{ textAlign: "center", py: 5, color: "text.secondary" }}>
                        No users found.
                      </Box>
                    ) : (
                      <>
                        {/* Desktop / tablet: keep the table */}
                        <Box sx={{ display: { xs: "none", sm: "block", md: "block" } }}>
                          <TableContainer
                            sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}
                          >
                            <Table size="small">
                              <TableHead sx={{ bgcolor: "action.hover" }}>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 600, pl: 5 }}>Name</TableCell>
                                  <TableCell sx={{ fontWeight: 600, pl: 10 }}>Email</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                                    Role
                                  </TableCell>
                                  {selectedUserCategory !== "admins" && (
                                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                                      Action
                                    </TableCell>
                                  )}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {filteredUsers.map((u) => (
                                  <TableRow
                                    key={u.id}
                                    sx={{ "&:hover": { bgcolor: "action.hover" } }}
                                  >
                                    <TableCell sx={{ fontWeight: 500 }}>
                                      {u.firstName} {u.lastName}
                                      {u.id === user?.id && (
                                        <Typography
                                          component="span"
                                          variant="caption"
                                          color="text.secondary"
                                          sx={{ ml: 0.5 }}
                                        >
                                          (You)
                                        </Typography>
                                      )}
                                    </TableCell>
                                    <TableCell sx={{ color: "text.secondary" }}>
                                      {u.email}
                                    </TableCell>
                                    <TableCell align="center">
                                      <Chip
                                        label={u.role}
                                        size="small"
                                        sx={{
                                          ...roleChipSx[u.role],
                                          fontWeight: 600,
                                          fontSize: "0.7rem",
                                          height: 20,
                                        }}
                                      />
                                    </TableCell>
                                    {selectedUserCategory !== "admins" && (
                                      <TableCell align="center">
                                        {u.role !== "ADMIN" ? (
                                          u.role === "MENTOR" ? (
                                            <Button
                                              size="small"
                                              variant="outlined"
                                              color="warning"
                                              disabled={toggleMentor.isPending}
                                              onClick={() => toggleMentor.mutate(u.id)}
                                              startIcon={<ArrowDown size={12} />}
                                              sx={{ textTransform: "none", py: 0.25, minHeight: 0 }}
                                            >
                                              Demote
                                            </Button>
                                          ) : (
                                            <Button
                                              size="small"
                                              variant="outlined"
                                              disabled={toggleMentor.isPending}
                                              onClick={() => toggleMentor.mutate(u.id)}
                                              startIcon={<ArrowUp size={12} />}
                                              sx={{ textTransform: "none", py: 0.25, minHeight: 0 }}
                                            >
                                              Promote
                                            </Button>
                                          )
                                        ) : null}
                                      </TableCell>
                                    )}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>

                        {/* Mobile: stacked cards */}
                        <Stack spacing={1.5} sx={{ display: { xs: "flex", sm:"none", md: "none" } }}>
                          {filteredUsers.map((u) => (
                            <Box
                              key={u.id}
                              sx={{
                                border: 1,
                                borderColor: "divider",
                                borderRadius: 1,
                                p: 1.5,
                                display: "flex",
                                flexDirection: "column",
                                gap: 1,
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "flex-start",
                                  gap: 1,
                                }}
                              >
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                  <Typography sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                                    {u.firstName} {u.lastName}
                                    {u.id === user?.id && (
                                      <Typography
                                        component="span"
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ ml: 0.5 }}
                                      >
                                        (You)
                                      </Typography>
                                    )}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                      wordBreak: "break-all",
                                      fontSize: "0.8rem",
                                      mt: 0.25,
                                    }}
                                  >
                                    {u.email}
                                  </Typography>
                                </Box>
                                <Chip
                                  label={u.role}
                                  size="small"
                                  sx={{
                                    ...roleChipSx[u.role],
                                    fontWeight: 600,
                                    fontSize: "0.7rem",
                                    height: 20,
                                    flexShrink: 0,
                                  }}
                                />
                              </Box>

                              {selectedUserCategory !== "admins" && u.role !== "ADMIN" && (
                                <Box sx={{ display: "flex", justifyContent: "center" }}>
                                  {u.role === "MENTOR" ? (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="warning"
                                      disabled={toggleMentor.isPending}
                                      onClick={() => toggleMentor.mutate(u.id)}
                                      startIcon={<ArrowDown size={12} />}
                                      sx={{ textTransform: "none", py: 0.25, justifyContent: "center" }}
                                    >
                                      Demote
                                    </Button>
                                  ) : (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      disabled={toggleMentor.isPending}
                                      onClick={() => toggleMentor.mutate(u.id)}
                                      startIcon={<ArrowUp size={12} />}
                                      sx={{ textTransform: "none", py: 0.25 }}
                                    >
                                      Promote
                                    </Button>
                                  )}
                                </Box>
                              )}
                            </Box>
                          ))}
                        </Stack>
                      </>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </>
          )}

          {tab === "reviews" && (
            <>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" },
                  gap: 2,
                }}
              >
                <StatCard
                  label="All Reviews"
                  value={reviews?.length ?? 0}
                  loading={reviewsLoading}
                  icon={<Star className="h-7 w-7 text-amber-600" />}
                  isActive={selectedReviewCategory === "all"}
                  onClick={() => setSelectedReviewCategory("all")}
                />
                <StatCard
                  label="Visible Reviews"
                  loading={reviewsLoading}
                  value={reviews?.filter((r) => !r.isHidden).length ?? 0}
                  icon={<Eye className="h-7 w-7 text-primary" />}
                  isActive={selectedReviewCategory === "visible"}
                  onClick={() => setSelectedReviewCategory("visible")}
                />
                <StatCard
                  label="Hidden Reviews"
                  loading={reviewsLoading}
                  icon={<EyeOff className="h-7 w-7 text-destructive" />}
                  value={reviews?.filter((r) => r.isHidden).length ?? 0}
                  isActive={selectedReviewCategory === "hidden"}
                  onClick={() => setSelectedReviewCategory("hidden")}
                />
              </Box>

              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {selectedReviewCategory === "all"
                        ? "All Reviews"
                        : selectedReviewCategory === "visible"
                          ? "Visible Reviews"
                          : "Hidden Reviews"}
                    </Typography>
                    {reviewsLoading ? (
                      <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : !filteredReviews || filteredReviews.length === 0 ? (
                      <Box sx={{ textAlign: "center", py: 5, color: "text.secondary" }}>
                        {selectedReviewCategory === "all"
                          ? "No reviews yet."
                          : selectedReviewCategory === "hidden"
                            ? "No hidden reviews."
                            : "No visible reviews."}
                      </Box>
                    ) : (
                      <Stack spacing={2.5}>
                        {filteredReviews.map((r) => (
                          <Box
                            key={r.id}
                            sx={{
                              position: "relative",
                              border: 1,
                              borderColor: "divider",
                              borderRadius: 1,
                              px: 2,
                              py: 1,
                            }}
                          >
                            <Box sx={{ pr: { xs: 0, sm: 12 } }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {r.mentee.firstName} {r.mentee.lastName}
                                <Typography
                                  component="span"
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ fontWeight: 400 }}
                                >
                                  {" "}reviewed Mentor{" "}
                                </Typography>
                                {r.mentor.firstName} {r.mentor.lastName}
                              </Typography>
                              <Stack
                                direction="row"
                                spacing={0.25}
                                sx={{ mt: 0.25, color: "#d97706", alignItems: "center" }}
                              >
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    size={12}
                                    fill={i < r.score ? "currentColor" : "none"}
                                    color={i < r.score ? "currentColor" : "#d1d5db"}
                                  />
                                ))}
                              </Stack>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.5 }}
                              >
                                {r.remark}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                mt: { xs: 1, sm: 0 },
                                position: { xs: "static", sm: "absolute" },
                                top: { sm: "50%" },
                                right: { sm: 16 },
                                transform: { sm: "translateY(-50%)" },
                                display: "flex",
                                justifyContent: "center"
                              }}
                            >
                              {r.isHidden ? (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  disabled={hideReview.isPending}
                                  onClick={() => hideReview.mutate(r.id)}
                                  startIcon={<Eye size={12} />}
                                  sx={{ textTransform: "none", py: 0.25, minHeight: 0 }}
                                >
                                  Unhide
                                </Button>
                              ) : (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  disabled={hideReview.isPending}
                                  onClick={() => hideReview.mutate(r.id)}
                                  startIcon={<EyeOff size={12} />}
                                  sx={{ textTransform: "none", py: 0.25, minHeight: 0 }}
                                >
                                  Hide
                                </Button>
                              )}
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </>
          )}
        </Stack>
      </Box>
    </Container>
  );
};

export default AdminDashboardPage;
