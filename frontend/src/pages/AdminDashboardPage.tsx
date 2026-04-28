import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gql } from "@/lib/graphql";
import {
  ALL_USERS_QUERY,
  ALL_REVIEWS_QUERY,
  TOGGLE_MENTOR_STATUS_MUTATION,
  HIDE_REVIEW_MUTATION,
  ALL_PROMOTION_REQUESTS_QUERY,
  PENDING_HIDE_REQUESTS_QUERY,
  RESOLVE_PROMOTION_REQUEST_MUTATION,
  RESOLVE_REVIEW_HIDE_REQUEST_MUTATION,
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
  UserPlus,
  Inbox,
  XCircle,
  CheckCircle,
} from "lucide-react";
import { Review, User, PromotionRequest } from "@/types";
import { AddAdminModal } from "@/components/admin/AddAdminModal";

type Tab = "users" | "reviews" | "requests";
type UserCategory = "all" | "mentees" | "mentors" | "admins";
type ReviewCategory = "all" | "visible" | "hidden";
type RequestCategory = "promotions" | "hides";

const roleChipSx: Record<string, any> = {
  USER: { bgcolor: "rgba(113, 63, 18, 0.5)", color: "#facc15" },
  MENTOR: { bgcolor: "rgba(58, 88, 65, 0.2)", color: "primary.main" },
  ADMIN: { bgcolor: "rgba(30, 58, 138, 0.5)", color: "#60a5fa" },
};

const reqChipSx: Record<string, any> = {
  PENDING: { bgcolor: "rgba(113, 63, 18, 0.5)", color: "#facc15" },
  APPROVED: { bgcolor: "rgba(58, 88, 65, 0.2)", color: "primary.main" },
  REJECTED: { bgcolor: "rgba(239, 68, 68, 0.15)", color: "#ef4444" },
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
  const [selectedRequestCategory, setSelectedRequestCategory] =
    useState<RequestCategory>("promotions");
  const [addAdminOpen, setAddAdminOpen] = useState(false);

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

  const { data: promotionRequests, isLoading: promotionsLoading } = useQuery({
    queryKey: ["all-promotion-requests"],
    queryFn: async () => {
      const res = await gql<{ allPromotionRequests: PromotionRequest[] }>(
        ALL_PROMOTION_REQUESTS_QUERY,
      );
      return res.allPromotionRequests;
    },
  });

  const { data: hideRequests, isLoading: hidesLoading } = useQuery({
    queryKey: ["pending-hide-requests"],
    queryFn: async () => {
      const res = await gql<{ pendingHideRequests: Review[] }>(
        PENDING_HIDE_REQUESTS_QUERY,
      );
      return res.pendingHideRequests;
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

  const resolvePromotion = useMutation({
    mutationFn: async ({
      requestId,
      approve,
    }: {
      requestId: string;
      approve: boolean;
    }) => {
      const res = await gql<{
        resolvePromotionRequest: { success: boolean; errors: string[] | null };
      }>(RESOLVE_PROMOTION_REQUEST_MUTATION, { requestId, approve });
      if (!res.resolvePromotionRequest.success) {
        throw new Error(
          res.resolvePromotionRequest.errors?.[0] || "Failed to resolve",
        );
      }
    },
    onSuccess: (_v, vars) => {
      toast({
        title: vars.approve
          ? "Promotion approved"
          : "Promotion request rejected",
      });
      queryClient.invalidateQueries({ queryKey: ["all-promotion-requests"] });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      queryClient.invalidateQueries({ queryKey: ["all-mentors"] });
    },
    onError: (err: any) =>
      toast({
        title: "Failed",
        description: err.message,
        variant: "destructive",
      }),
  });

  const resolveHideRequest = useMutation({
    mutationFn: async ({
      reviewId,
      approve,
    }: {
      reviewId: string;
      approve: boolean;
    }) => {
      const res = await gql<{
        resolveReviewHideRequest: { success: boolean; errors: string[] | null };
      }>(RESOLVE_REVIEW_HIDE_REQUEST_MUTATION, { reviewId, approve });
      if (!res.resolveReviewHideRequest.success) {
        throw new Error(
          res.resolveReviewHideRequest.errors?.[0] || "Failed to resolve",
        );
      }
    },
    onSuccess: (_v, vars) => {
      toast({
        title: vars.approve ? "Review hidden" : "Hide request rejected",
      });
      queryClient.invalidateQueries({ queryKey: ["pending-hide-requests"] });
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

  const pendingPromotions =
    promotionRequests?.filter((r) => r.status === "PENDING") ?? [];
  const pendingHides = hideRequests ?? [];

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

  const requestsBadge = pendingPromotions.length + pendingHides.length;

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
        <Box sx={{ position: { lg: "sticky" }, top: { lg: 165 } }}>
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
                      onClick={() => setTab("requests")}
                      sx={navBtnSx(tab === "requests")}
                      startIcon={<Inbox size={16} />}
                    >
                      Requests
                      {requestsBadge > 0 && (
                        <Chip
                          label={requestsBadge}
                          size="small"
                          sx={{
                            ml: "auto",
                            height: 18,
                            fontSize: "0.625rem",
                            fontWeight: 700,
                            ...reqChipSx.APPROVED,
                          }}
                        />
                      )}
                    </Button>
                    <Button
                      size="small"
                      component={RouterLink}
                      to="/mentors"
                      sx={navBtnSx(false)}
                      startIcon={<GraduationCap size={16} />}
                    >
                      Browse Mentors
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
                  gridTemplateColumns: {
                    xs: "repeat(2, 1fr)",
                    sm: "repeat(4, 1fr)",
                  },
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
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      sx={{ alignItems: { xs: "stretch", sm: "center" }, justifyContent: "space-between" }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        All Users
                      </Typography>
                      {selectedUserCategory === "admins" || selectedUserCategory === "all" ? (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<UserPlus size={14} />}
                          onClick={() => setAddAdminOpen(true)}
                          sx={{ textTransform: "none", px: 5, py: 0.7 }}
                        >
                          Add Admin
                        </Button>
                      ) : null}
                    </Stack>

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
                        <Box sx={{ display: { xs: "none", sm: "block" } }}>
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
                        <Stack spacing={1.5} sx={{ display: { xs: "flex", sm: "none" } }}>
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
                  gridTemplateColumns: {
                    xs: "repeat(2, 1fr)",
                    sm: "repeat(3, 1fr)",
                  },
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
                                justifyContent: "center",
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

          {tab === "requests" && (
            <>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, 1fr)",
                  },
                  gap: 2,
                }}
              >
                <StatCard
                  label="Mentor Promotions"
                  value={pendingPromotions.length}
                  loading={promotionsLoading}
                  icon={<GraduationCap className="h-7 w-7 text-primary" />}
                  isActive={selectedRequestCategory === "promotions"}
                  onClick={() => setSelectedRequestCategory("promotions")}
                />
                <StatCard
                  label="Hide Reviews"
                  value={pendingHides.length}
                  loading={hidesLoading}
                  icon={<EyeOff className="h-7 w-7 text-destructive" />}
                  isActive={selectedRequestCategory === "hides"}
                  onClick={() => setSelectedRequestCategory("hides")}
                />
              </Box>

              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    {selectedRequestCategory === "promotions" ? (
                      <>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Promotion Requests
                        </Typography>
                        {promotionsLoading ? (
                          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                            <CircularProgress size={24} />
                          </Box>
                        ) : !promotionRequests ||
                          promotionRequests.length === 0 ? (
                          <Box sx={{ textAlign: "center", py: 5, color: "text.secondary" }}>
                            No promotion requests.
                          </Box>
                        ) : (
                          <Stack spacing={1.5}>
                            {promotionRequests.map((req) => (
                              <Box
                                key={req.id}
                                sx={{
                                  border: 1,
                                  borderColor: "divider",
                                  borderRadius: 1.5,
                                  p: 2,
                                }}
                              >
                                <Stack spacing={1}>
                                  <Box 
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between"
                                    }}
                                  >
                                    <Box sx={{ minWidth: 0 }}>
                                      <Typography sx={{ fontWeight: 600 }}>
                                        {req.user.firstName} {req.user.lastName}
                                      </Typography>
                                      <Typography
                                        sx={{
                                          fontSize: "0.75rem",
                                          color: "text.secondary",
                                          wordBreak: "break-all",
                                        }}
                                      >
                                        {req.user.email}
                                      </Typography>
                                    </Box>
                                    <Chip
                                      label={req.status}
                                      size="small"
                                      sx={{
                                        height: 20,
                                        fontSize: "0.625rem",
                                        fontWeight: 600,
                                        flexShrink: 0,
                                        ...(reqChipSx[req.status] ?? {}),
                                      }}
                                    />
                                  </Box>
                                  <Stack
                                    direction="row"
                                    spacing={10}
                                  >
                                    <Box>
                                      <Typography
                                        sx={{
                                          fontSize: "0.7rem",
                                          textTransform: "uppercase",
                                          color: "text.secondary",
                                          letterSpacing: 0.5,
                                        }}
                                      >
                                        Occupation
                                      </Typography>
                                      <Typography sx={{ fontSize: "0.875rem" }}>
                                        {req.occupation}
                                      </Typography>
                                    </Box>
                                    <Box>
                                      <Typography
                                        sx={{
                                          fontSize: "0.7rem",
                                          textTransform: "uppercase",
                                          color: "text.secondary",
                                          letterSpacing: 0.5,
                                        }}
                                      >
                                        Expertise
                                      </Typography>
                                      <Typography sx={{ fontSize: "0.875rem" }}>
                                        {req.expertise}
                                      </Typography>
                                    </Box>
                                  </Stack>
                                  <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: "center" }}>
                                    <Typography
                                      sx={{
                                        fontSize: "0.75rem",
                                        color: "text.secondary",
                                      }}
                                    >
                                      Submitted at{" "}{new Date(req.createdAt).toLocaleString()}
                                    </Typography>
                                    {req.status === "PENDING" && (
                                      <Stack
                                        direction="row"
                                        spacing={1}
                                        sx={{
                                          justifyContent: { xs: "center", sm: "flex-end" },
                                        }}
                                      >
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          color="error"
                                          startIcon={<XCircle size={12} />}
                                          disabled={resolvePromotion.isPending}
                                          onClick={() =>
                                            resolvePromotion.mutate({
                                              requestId: req.id,
                                              approve: false,
                                            })
                                          }
                                          sx={{
                                            textTransform: "none",
                                            py: 0.25,
                                            minHeight: 0,
                                          }}
                                        >
                                          Reject
                                        </Button>
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          startIcon={<CheckCircle size={12} />}
                                          disabled={resolvePromotion.isPending}
                                          onClick={() =>
                                            resolvePromotion.mutate({
                                              requestId: req.id,
                                              approve: true,
                                            })
                                          }
                                          sx={{
                                            textTransform: "none",
                                            py: 0.25,
                                            minHeight: 0,
                                          }}
                                        >
                                          Approve
                                        </Button>
                                      </Stack>
                                    )}
                                  </Box>
                                </Stack>
                              </Box>
                            ))}
                          </Stack>
                        )}
                      </>
                    ) : (
                      <>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Mentor Review Hide Requests
                        </Typography>
                        {hidesLoading ? (
                          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                            <CircularProgress size={24} />
                          </Box>
                        ) : pendingHides.length === 0 ? (
                          <Box sx={{ textAlign: "center", py: 5, color: "text.secondary" }}>
                            No pending hide requests.
                          </Box>
                        ) : (
                          <Stack spacing={1.5}>
                            {pendingHides.map((r) => (
                              <Box
                                key={r.id}
                                sx={{
                                  border: 1,
                                  borderColor: "divider",
                                  borderRadius: 1.5,
                                  p: 2,
                                }}
                              >
                                <Stack spacing={1}>
                                  <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                                    {r.mentor.firstName} {r.mentor.lastName}{" "}
                                    requested to hide a review by{" "}
                                    {r.mentee.firstName} {r.mentee.lastName}
                                  </Typography>
                                  <Stack
                                    direction="row"
                                    spacing={0.25}
                                    sx={{ alignItems: "center" }}
                                  >
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star
                                        key={i}
                                        size={12}
                                        color={i < r.score ? "#d97706" : "#d1d5db"}
                                        fill={i < r.score ? "#d97706" : "none"}
                                      />
                                    ))}
                                  </Stack>
                                  <Typography
                                    sx={{
                                      fontSize: "0.875rem",
                                      color: "text.secondary",
                                    }}
                                  >
                                    {r.remark}
                                  </Typography>
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    sx={{
                                      justifyContent: { xs: "center", sm: "flex-end" },
                                      flexWrap: "wrap",
                                      rowGap: 1,
                                    }}
                                  >
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="error"
                                      startIcon={<XCircle size={12} />}
                                      disabled={resolveHideRequest.isPending}
                                      onClick={() =>
                                        resolveHideRequest.mutate({
                                          reviewId: r.id,
                                          approve: false,
                                        })
                                      }
                                      sx={{
                                        textTransform: "none",
                                        py: 0.25,
                                        minHeight: 0,
                                      }}
                                    >
                                      Reject (keep visible)
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      startIcon={<CheckCircle size={12} />}
                                      disabled={resolveHideRequest.isPending}
                                      onClick={() =>
                                        resolveHideRequest.mutate({
                                          reviewId: r.id,
                                          approve: true,
                                        })
                                      }
                                      sx={{
                                        textTransform: "none",
                                        py: 0.25,
                                        minHeight: 0,
                                      }}
                                    >
                                      Approve hide
                                    </Button>
                                  </Stack>
                                </Stack>
                              </Box>
                            ))}
                          </Stack>
                        )}
                      </>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </>
          )}
        </Stack>
      </Box>

      <AddAdminModal open={addAdminOpen} onOpenChange={setAddAdminOpen} />
    </Container>
  );
};

export default AdminDashboardPage;