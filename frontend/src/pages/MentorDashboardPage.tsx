import { useMemo, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gql } from "@/lib/graphql";
import {
  MY_SESSIONS_QUERY,
  UPDATE_SESSION_STATUS_MUTATION,
  ALL_REVIEWS_QUERY,
  REQUEST_REVIEW_HIDE_MUTATION,
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
  Typography,
  useTheme,
} from "@mui/material";
import { Field } from "@/components/ui/field";
import { StatCard } from "@/components/ui/stat-card";
import { useToast } from "@/hooks/use-toast";
import {
  Briefcase,
  CheckCircle,
  GraduationCap,
  MapPin,
  User,
  XCircle,
  Flag,
  Mail,
  Star,
  Binoculars,
  PenLine,
  Crown,
  LogOut,
  Calendar,
  Clock,
  EyeOff,
} from "lucide-react";
import { MentorshipSession, SessionStatus, Review } from "@/types";
import { SessionRejectModal } from "@/components/sessions/SessionRejectModal";

type Tab = "sessions" | "reviews";
type SessionCategory = "all" | "pending" | "accepted" | "rejected" | "completed";

const statusChipSx: Record<string, any> = {
  PENDING: { bgcolor: "rgba(113, 63, 18, 0.5)", color: "#facc15" },
  ACCEPTED: { bgcolor: "rgba(58, 88, 65, 0.2)", color: "primary.main" },
  COMPLETED: { bgcolor: "rgba(30, 58, 138, 0.5)", color: "#60a5fa" },
  REJECTED: { bgcolor: "rgba(239, 68, 68, 0.15)", color: "#ef4444" },
};

const roleChipSx: Record<string, any> = {
  ADMIN: { bgcolor: "rgba(30, 58, 138, 0.5)", color: "#60a5fa" },
  MENTOR: { bgcolor: "rgba(58, 88, 65, 0.2)", color: "primary.main" },
  USER: { bgcolor: "rgba(113, 63, 18, 0.5)", color: "#facc15" },
};

const hideRequestChipSx: Record<string, any> = {
  PENDING: { bgcolor: "rgba(113, 63, 18, 0.5)", color: "#facc15" },
  APPROVED: { bgcolor: "rgba(58, 88, 65, 0.2)", color: "primary.main" },
  REJECTED: { bgcolor: "rgba(239, 68, 68, 0.15)", color: "#ef4444" },
};

const MentorDashboardPage = () => {
  const theme = useTheme();
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const handleLogout = () => {
    clearAuth();
    toast({ title: `See you next time ${user?.firstName} ${user?.lastName}!` });
    navigate("/login");
  };
  const [tab, setTab] = useState<Tab>("sessions");
  const [selectedSessionCategory, setSelectedSessionCategory] =
    useState<SessionCategory>("all");
  const [rejectSession, setRejectSession] = useState<MentorshipSession | null>(
    null,
  );
  const [rejectOpen, setRejectOpen] = useState(false);

  const { data: sessions, isLoading: sessionLoading } = useQuery({
    queryKey: ["my-sessions"],
    queryFn: async () => {
      const res = await gql<{ mySessions: MentorshipSession[] }>(MY_SESSIONS_QUERY);
      return res.mySessions;
    },
  });

  const { data: reviews, isLoading: reviewLoading } = useQuery({
    queryKey: ["all-reviews"],
    queryFn: async () => {
      const res = await gql<{ allReviews: Review[] }>(ALL_REVIEWS_QUERY);
      return res.allReviews;
    },
  });

  const mentorReviews = (reviews ?? []).filter((r) => r.mentor?.id === user?.id && r.isHidden === false);
  const visibleMentorReviews = mentorReviews.filter((r) => !r.isHidden);
  const avgScore = visibleMentorReviews.length
    ? visibleMentorReviews.reduce((s, r) => s + r.score, 0) /
      visibleMentorReviews.length
    : 0;

  const updateStatus = useMutation({
    mutationFn: async ({
      sessionId,
      status,
    }: {
      sessionId: string;
      status: SessionStatus;
    }) => {
      const res = await gql<{
        updateSessionStatus: { success: boolean; errors: string[] | null };
      }>(UPDATE_SESSION_STATUS_MUTATION, { sessionId, status });
      if (!res.updateSessionStatus.success) {
        throw new Error(res.updateSessionStatus.errors?.[0] || "Update failed");
      }
    },
    onSuccess: (_v, variables) => {
      toast({
        title: "Session updated",
        description: `Marked as ${variables.status.toLowerCase()}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["my-sessions"] });
    },
    onError: (err: any) => {
      toast({
        title: "Update failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const requestHide = useMutation({
    mutationFn: async (reviewId: string) => {
      const res = await gql<{
        requestReviewHide: { success: boolean; errors: string[] | null };
      }>(REQUEST_REVIEW_HIDE_MUTATION, { reviewId });
      if (!res.requestReviewHide.success) {
        throw new Error(
          res.requestReviewHide.errors?.[0] || "Failed to request hide",
        );
      }
    },
    onSuccess: () => {
      toast({
        title: "Review Hide Requested",
        description: "An admin will review your request shortly.",
      });
      queryClient.invalidateQueries({ queryKey: ["all-reviews"] });
    },
    onError: (err: any) =>
      toast({
        title: "Could not submit",
        description: err.message,
        variant: "destructive",
      }),
  });

  const counts = useMemo(() => {
    const all = sessions ?? [];
    return {
      total: all.length,
      pending: all.filter((s) => s.status === "PENDING").length,
      accepted: all.filter((s) => s.status === "ACCEPTED").length,
      rejected: all.filter((s) => s.status === "REJECTED").length,
      completed: all.filter((s) => s.status === "COMPLETED").length,
    };
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    switch (selectedSessionCategory) {
      case "pending":
        return sessions.filter((s) => s.status === "PENDING");
      case "accepted":
        return sessions.filter((s) => s.status === "ACCEPTED");
      case "rejected":
        return sessions.filter((s) => s.status === "REJECTED");
      case "completed":
        return sessions.filter((s) => s.status === "COMPLETED");
      default:
        return sessions;
    }
  }, [sessions, selectedSessionCategory]);

  const navBtnSx = (active: boolean) => ({
    width: "100%",
    justifyContent: "flex-start",
    bgcolor: active ? "secondary.main" : "transparent",
    color: active ? "secondary.contrastText" : "text.primary",
    "&:hover": {
      bgcolor: active ? "secondary.main" : "rgba(0,0,0,0.04)",
    },
  });

  return (
    <Container maxWidth="lg" sx={{ p: 2, py: 4 }}>
      <Box
        sx={{
          display: "grid",
          gap: 3,
          alignItems: "start",
          gridTemplateColumns: { xs: "1fr", lg: "280px 1fr" },
        }}
      >
        {/* Profile sidebar */}
        <Box
          component="aside"
          sx={{ position: { lg: "sticky" }, top: { lg: 165 } }}
        >
          <Card>
            <CardContent>
              <Stack spacing={2} sx={{ pt: 0.5 }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      flexShrink: 0,
                      borderRadius: "50%",
                      bgcolor: "rgba(58, 88, 65, 0.1)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <GraduationCap
                      size={24}
                      color={theme.palette.primary.main}
                    />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>
                      {user?.firstName} {user?.lastName}
                    </Typography>
                    <Typography
                      sx={{ fontSize: "0.75rem", color: "text.secondary" }}
                    >
                      {user?.email}
                    </Typography>
                    <Chip
                      label={user?.role}
                      size="small"
                      sx={{
                        mt: 0.5,
                        height: 20,
                        fontSize: "0.625rem",
                        fontWeight: 600,
                        ...(roleChipSx[user?.role ?? "MENTOR"] ?? {}),
                      }}
                    />
                  </Box>
                </Stack>

                <Stack
                  spacing={1}
                  sx={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    borderTop: 1,
                    borderColor: "divider",
                    pt: 2,
                  }}
                >
                  {user?.occupation && (
                    <Field label="Occupation" icon={<Briefcase size={12} />}>
                      {user.occupation}
                    </Field>
                  )}
                  {user?.expertise && (
                    <Field label="Expertise" icon={<Crown size={12} />}>
                      {user.expertise}
                    </Field>
                  )}
                  {user?.address && (
                    <Field label="Address" icon={<MapPin size={12} />}>
                      {user.address}
                    </Field>
                  )}
                  {visibleMentorReviews.length > 0 && (
                    <Field
                      label="Rating"
                      icon={<Star size={12} color="#f59e0b" />}
                    >
                      <span>
                        {avgScore.toFixed(1)} ({visibleMentorReviews.length}{" "}
                        review{visibleMentorReviews.length === 1 ? "" : "s"})
                      </span>
                    </Field>
                  )}
                  {user?.bio && (
                    <Field label="Bio" icon={<Binoculars size={12} />}>
                      {user.bio}
                    </Field>
                  )}
                </Stack>

                <Stack
                  spacing={0.5}
                  sx={{ pt: 1, borderTop: 1, borderColor: "divider" }}
                >
                  <Button
                    size="small"
                    startIcon={<PenLine size={16} />}
                    onClick={() => setTab("sessions")}
                    sx={navBtnSx(tab === "sessions")}
                  >
                    Sessions
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Star size={16} />}
                    onClick={() => setTab("reviews")}
                    sx={navBtnSx(tab === "reviews")}
                  >
                    Reviews
                  </Button>
                  <Button
                    size="small"
                    component={RouterLink}
                    to="/mentors"
                    startIcon={<GraduationCap size={16} />}
                    sx={navBtnSx(false)}
                  >
                    Browse Mentors
                  </Button>
                </Stack>

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

        {/* Main column */}
        <Stack spacing={3}>
          <Typography
            component="h1"
            sx={{ fontSize: "1.875rem", fontWeight: 700 }}
          >
            Mentor Dashboard
          </Typography>

          {tab === "sessions" && (
            <>
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: {
                    xs: "repeat(2, 1fr)",
                    sm: "repeat(5, 1fr)",
                  },
                }}
              >
                <StatCard
                  label="Total"
                  value={counts.total}
                  loading={sessionLoading}
                  icon={<></>}
                  isActive={selectedSessionCategory === "all"}
                  onClick={() => setSelectedSessionCategory("all")}
                />
                <StatCard
                  label="Pending"
                  value={counts.pending}
                  loading={sessionLoading}
                  icon={<></>}
                  isActive={selectedSessionCategory === "pending"}
                  onClick={() => setSelectedSessionCategory("pending")}
                />
                <StatCard
                  label="Accepted"
                  value={counts.accepted}
                  loading={sessionLoading}
                  icon={<></>}
                  isActive={selectedSessionCategory === "accepted"}
                  onClick={() => setSelectedSessionCategory("accepted")}
                />
                <StatCard
                  label="Rejected"
                  value={counts.rejected}
                  loading={sessionLoading}
                  icon={<></>}
                  isActive={selectedSessionCategory === "rejected"}
                  onClick={() => setSelectedSessionCategory("rejected")}
                />
                <StatCard
                  label="Completed"
                  value={counts.completed}
                  loading={sessionLoading}
                  icon={<></>}
                  isActive={selectedSessionCategory === "completed"}
                  onClick={() => setSelectedSessionCategory("completed")}
                />
              </Box>

              <Card>
                <CardContent>
                  <Stack spacing={2} sx={{ pt: 0.5 }}>
                    <Typography
                      component="h2"
                      sx={{ fontSize: "1.25rem", fontWeight: 600 }}
                    >
                      Session Requests
                    </Typography>

                    {sessionLoading ? (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          py: 6,
                        }}
                      >
                        <CircularProgress
                          size={24}
                          sx={{ color: "text.secondary" }}
                        />
                      </Box>
                    ) : filteredSessions.length === 0 ? (
                      <Typography
                        sx={{
                          textAlign: "center",
                          py: 6,
                          color: "text.secondary",
                        }}
                      >
                        No sessions in this view.
                      </Typography>
                    ) : (
                      <Stack spacing={1.5}>
                        {filteredSessions.map((s) => {
                          const isPending = updateStatus.isPending;
                          return (
                            <Box
                              key={s.id}
                              sx={{
                                border: 1,
                                borderColor: "divider",
                                borderRadius: 1.5,
                                p: 2,
                                "&:hover": { bgcolor: "rgba(0,0,0,0.03)" },
                              }}
                            >
                              <Stack spacing={1.5}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    justifyContent: "space-between",
                                    flexWrap: "wrap",
                                    gap: 1,
                                  }}
                                >
                                  <Stack
                                    direction="row"
                                    spacing={{ xs: 0, sm: 1.5 }}
                                    sx={{ alignItems: "center", minWidth: 0 }}
                                  >
                                    <Box
                                      sx={{
                                        width: 36,
                                        height: 36,
                                        flexShrink: 0,
                                        borderRadius: "50%",
                                        bgcolor: "rgba(0,0,0,0.05)",
                                        display: { xs: "none", sm: "inline-flex" },
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <User
                                        size={16}
                                        color={theme.palette.primary.main}
                                      />
                                    </Box>
                                    <Box sx={{ minWidth: 0 }}>
                                      <Typography sx={{ fontWeight: 600 }}>
                                        {s.mentee.firstName} {s.mentee.lastName}
                                      </Typography>
                                      <Stack
                                        direction="row"
                                        spacing={0.5}
                                        sx={{
                                          fontSize: "0.75rem",
                                          color: "text.secondary",
                                          alignItems: "center",
                                        }}
                                      >
                                        <Mail size={12} />
                                        <span style={{ wordBreak: "break-all" }}>
                                          {s.mentee.email}
                                        </span>
                                      </Stack>
                                    </Box>
                                  </Stack>
                                  <Chip
                                    label={s.status}
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: "0.625rem",
                                      fontWeight: 600,
                                      flexShrink: 0,
                                      ...(statusChipSx[s.status] ?? {}),
                                    }}
                                  />
                                </Box>

                                {s.scheduledAt && (
                                  <Stack
                                    direction="row"
                                    spacing={5}
                                    sx={{
                                      fontSize: "0.75rem",
                                      color: "text.secondary",
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <Stack
                                      direction="row"
                                      spacing={0.5}
                                      sx={{ alignItems: "center" }}
                                    >
                                      <Calendar size={12} />
                                      <span>
                                        {new Date(s.scheduledAt).toLocaleString()}
                                      </span>
                                    </Stack>
                                    <Stack
                                      direction="row"
                                      spacing={0.5}
                                      sx={{ alignItems: "center" }}
                                    >
                                      <Clock size={12} />
                                      <span>{s.durationMinutes ?? 30} min</span>
                                    </Stack>
                                  </Stack>
                                )}

                                <Typography
                                  sx={{
                                    fontSize: "0.875rem",
                                    color: "text.secondary",
                                    whiteSpace: "pre-line",
                                  }}
                                >
                                  {s.questions}
                                </Typography>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: {
                                      xs: "center",
                                      sm: "space-between",
                                    },
                                    flexWrap: "wrap",
                                    gap: 1,
                                    pt: 0.5,
                                    fontSize: "0.75rem",
                                    color: "text.secondary",
                                  }}
                                >
                                  <span>
                                    Requested at{" "}
                                    {new Date(s.createdAt).toLocaleString()}
                                  </span>
                                  <Stack direction="row" spacing={1}>
                                    {s.status === "PENDING" && (
                                      <>
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          disabled={isPending}
                                          startIcon={<CheckCircle size={12} />}
                                          onClick={() =>
                                            updateStatus.mutate({
                                              sessionId: s.id,
                                              status: "ACCEPTED",
                                            })
                                          }
                                          sx={{ textTransform: "none", py: 0.25, minHeight: 0 }}
                                        >
                                          Accept
                                        </Button>
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          color="error"
                                          disabled={isPending}
                                          startIcon={<XCircle size={12} />}
                                          onClick={() => {
                                            setRejectSession(s);
                                            setRejectOpen(true);
                                          }}
                                          sx={{ textTransform: "none", py: 0.25, minHeight: 0 }}
                                        >
                                          Decline
                                        </Button>
                                      </>
                                    )}
                                    {s.status === "ACCEPTED" && (
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        color="info"
                                        disabled={isPending}
                                        startIcon={<Flag size={12} />}
                                        onClick={() =>
                                          updateStatus.mutate({
                                            sessionId: s.id,
                                            status: "COMPLETED",
                                          })
                                        }
                                        sx={{ textTransform: "none", py: 0.25, minHeight: 0 }}
                                      >
                                        Mark Completed
                                      </Button>
                                    )}
                                  </Stack>
                                </Box>
                              </Stack>
                            </Box>
                          );
                        })}
                      </Stack>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </>
          )}

          {tab === "reviews" && (
            <Card>
              <CardContent>
                <Stack spacing={2} sx={{ pt: 0.5 }}>
                  <Typography
                    component="h2"
                    sx={{ fontSize: "1.25rem", fontWeight: 600 }}
                  >
                    My Reviews
                  </Typography>

                  {reviewLoading ? (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        py: 6,
                      }}
                    >
                      <CircularProgress
                        size={24}
                        sx={{ color: "text.secondary" }}
                      />
                    </Box>
                  ) : mentorReviews.length === 0 ? (
                    <Typography
                      sx={{
                        textAlign: "center",
                        py: 6,
                        color: "text.secondary",
                      }}
                    >
                      No reviews yet.
                    </Typography>
                  ) : (
                    <Stack spacing={1.5}>
                      {mentorReviews.map((r) => (
                        <Box
                          key={r.id}
                          sx={{
                            borderLeft: 2,
                            borderColor: "rgba(58, 88, 65, 0.4)",
                            pl: 1.5,
                            "&:hover": { bgcolor: "rgba(0,0,0,0.03)" },
                          }}
                        >
                          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Stack
                              direction="row"
                              spacing={1}
                              sx={{ alignItems: "center", flexWrap: "wrap" }}
                            >
                              <Typography
                                sx={{ fontSize: "0.875rem", fontWeight: 500 }}
                              >
                                {r.mentor.firstName} {r.mentor.lastName}
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
                            </Stack>
                            {r.hideRequestStatus === "PENDING" ? (
                              <Chip label="Requested" color="secondary" size="small" />
                            ) : (
                            <Button variant="outlined" color="error" sx={{ py: 0.25 }} onClick={() => requestHide.mutate(r.id)}>
                              <EyeOff size={15} color='#ef4444' />
                            </Button>
                            )}
                          </Box>
                          <Typography
                            sx={{
                              fontSize: "0.875rem",
                              color: "text.secondary",
                              mt: 0.5,
                            }}
                          >
                            {r.remark}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      </Box>

      <SessionRejectModal
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        session={rejectSession}
      />
    </Container>
  );
};

export default MentorDashboardPage;