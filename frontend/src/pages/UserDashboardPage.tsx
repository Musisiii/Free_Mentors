import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { gql } from "@/lib/graphql";
import {
  MY_SESSIONS_QUERY,
  ALL_REVIEWS_QUERY,
  MY_PROMOTION_REQUEST_QUERY,
} from "@/lib/queries";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
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
import {
  BookOpen,
  Briefcase,
  GraduationCap,
  MapPin,
  User,
  Star,
  Binoculars,
  PenLine,
  LogOut,
  Crown,
  Calendar,
  Clock,
} from "lucide-react";
import {
  MentorshipSession,
  User as UserT,
  Review,
  PromotionRequest,
} from "@/types";
import { MentorDetailModal } from "@/components/mentor/MentorDetailModal";
import { PromotionRequestModal } from "@/components/user/PromotionRequestModal";

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

const promoChipSx: Record<string, any> = {
  PENDING: { bgcolor: "rgba(58, 88, 65, 0.2)", color: "primary.main" },
  REJECTED: { bgcolor: "rgba(239, 68, 68, 0.15)", color: "#ef4444" },
};

const UserDashboardPage = () => {
  const theme = useTheme();
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const handleLogout = () => {
    clearAuth();
    toast({ title: `See you next time ${user?.firstName} ${user?.lastName}!` });
    navigate("/login");
  };
  const [tab, setTab] = useState<Tab>("sessions");
  const [selectedSessionCategory, setSelectedSessionCategory] =
    useState<SessionCategory>("all");
  const [selectedMentor, setSelectedMentor] = useState<UserT | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [promotionModalOpen, setPromotionModalOpen] = useState(false);

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

  const { data: promotionRequest } = useQuery({
    queryKey: ["my-promotion-request"],
    queryFn: async () => {
      const res = await gql<{ myPromotionRequest: PromotionRequest | null }>(
        MY_PROMOTION_REQUEST_QUERY,
      );
      return res.myPromotionRequest;
    },
  });

  const userReviews = (reviews ?? []).filter((r) => r.mentee?.id === user?.id);

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

  const showPromotionCard =
    !promotionRequest || promotionRequest.status === "REJECTED";

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
        <Box component="aside" sx={{ position: { lg: "sticky" }, top: { lg: 160 } }}>
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
                    <User size={24} color={theme.palette.primary.main} />
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
                    <Stack
                      direction="row"
                      spacing={0.5}
                      sx={{ mt: 0.5, flexWrap: "wrap", gap: 0.5 }}
                    >
                      <Chip
                        label={user?.role}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.625rem",
                          fontWeight: 600,
                          ...(roleChipSx[user?.role ?? "USER"] ?? {}),
                        }}
                      />
                      {promotionRequest?.status === "PENDING" && (
                        <Chip
                          label="PROMOTION PENDING"
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.575rem",
                            fontWeight: 600,
                            ...promoChipSx.PENDING,
                          }}
                        />
                      )}
                      {promotionRequest?.status === "REJECTED" && (
                        <Chip
                          label="PROMOTION REJECTED"
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.575rem",
                            fontWeight: 600,
                            ...promoChipSx.REJECTED,
                          }}
                        />
                      )}
                    </Stack>
                  </Box>
                </Stack>

                <Stack spacing={1} sx={{ fontSize: "0.875rem" }}>
                  {user?.occupation && (
                    <Field label="Occupation" icon={<Briefcase size={12} />}>
                      {user.occupation}
                    </Field>
                  )}
                  <Field label="Address" icon={<MapPin size={12} />}>
                    {user?.address}
                  </Field>
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
        <Stack spacing={3} sx={{ minHeight: "calc(100vh - 8rem)" }}>
          <Box sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}>
            <Typography component="h1" sx={{ fontSize: "1.875rem", fontWeight: 700 }}>
              User Dashboard
            </Typography>
            {showPromotionCard && (
              <Button
                size="large"
                variant="contained"
                color="primary"
                onClick={() => setPromotionModalOpen(true)}
                sx={{
                  textTransform: "none",
                  minHeight: 0,
                  alignSelf: { xs: "stretch", sm: "auto" },
                }}
              >
                Become a Mentor
              </Button>
            )}
          </Box>

          {promotionRequest?.status === "PENDING" && (
            <Card sx={{ borderLeft: 7, borderColor: "primary.main" }}>
              <CardContent sx={{ py: "12px !important" }}>
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{ flexWrap: "wrap", alignItems: "center" }}
                >
                  <GraduationCap size={18} color={theme.palette.primary.main} />
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: "0.875rem", fontWeight: 600 }}>
                      Promotion Request Pending
                    </Typography>
                    <Typography
                      sx={{ fontSize: "0.75rem", color: "text.secondary" }}
                    >
                      submitted at{" "}{new Date(promotionRequest.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          )}
          {promotionRequest?.status === "REJECTED" && (
            <Card sx={{ borderLeft: 7, borderColor: "#ef4444" }}>
              <CardContent sx={{ py: "12px !important" }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{ flexWrap: "wrap", alignItems: { xs: "flex-start", sm: "center" } }}
                >
                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{ flex: 1, minWidth: 0, alignItems: "center" }}
                  >
                    <Crown size={18} color="#ef4444" />
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: "0.875rem", fontWeight: 600 }}>
                        Your last promotion request was rejected
                      </Typography>
                      <Typography
                        sx={{ fontSize: "0.75rem", color: "text.secondary" }}
                      >
                        You can submit a new request anytime.
                      </Typography>
                    </Box>
                  </Stack>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setPromotionModalOpen(true)}
                    sx={{ alignSelf: { xs: "stretch", sm: "auto" } }}
                  >
                    Try again
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}

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
                  <Typography
                    component="h2"
                    sx={{ fontSize: "1.25rem", fontWeight: 600, mb: 2 }}
                  >
                    My Mentorship Sessions
                  </Typography>

                  {sessionLoading ? (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        py: 6,
                      }}
                    >
                      <CircularProgress size={24} sx={{ color: "text.secondary" }} />
                    </Box>
                  ) : filteredSessions.length === 0 ? (
                    <Box
                      sx={{
                        textAlign: "center",
                        py: 6,
                        color: "text.secondary",
                      }}
                    >
                      <BookOpen
                        size={40}
                        style={{ display: "block", margin: "0 auto 12px" }}
                      />
                      <Typography sx={{ mb: 1.5 }}>
                        No sessions found in this category.
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: "grid",
                        gap: 2,
                        gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                      }}
                    >
                      {filteredSessions.map((s) => (
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
                          <Stack spacing={1}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: { xs: 1, sm: 1.5 },
                              }}
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
                              <Box
                                sx={{
                                  flex: 1,
                                  minWidth: 0,
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "flex-start",
                                  gap: 1,
                                }}
                              >
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography sx={{ fontWeight: 600 }}>
                                    {s.mentor.firstName} {s.mentor.lastName}
                                  </Typography>
                                  {s.mentor.occupation && (
                                    <Stack
                                      direction="row"
                                      spacing={0.5}
                                      sx={{
                                        alignItems: "center",
                                        fontSize: "0.75rem",
                                        color: "text.secondary",
                                      }}
                                    >
                                      <Briefcase size={12} />
                                      <span>{s.mentor.occupation}</span>
                                    </Stack>
                                  )}
                                </Box>
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
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {s.questions}
                            </Typography>

                            {s.status === "REJECTED" && s.rejectReason && (
                              <Box
                                sx={{
                                  mt: 0.5,
                                  p: 1,
                                  borderRadius: 1,
                                  bgcolor: "rgba(239, 68, 68, 0.08)",
                                  borderLeft: 2,
                                  borderColor: "#ef4444",
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: "0.7rem",
                                    color: "#ef4444",
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    letterSpacing: 0.5,
                                  }}
                                >
                                  Reason from mentor
                                </Typography>
                                <Typography
                                  sx={{
                                    fontSize: "0.8rem",
                                    color: "text.secondary",
                                    mt: 0.25,
                                  }}
                                >
                                  {s.rejectReason}
                                </Typography>
                              </Box>
                            )}

                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: { xs: "column", sm: "row" },
                                justifyContent: "space-between",
                                alignItems: { xs: "flex-start", sm: "center" },
                                gap: 1,
                                pt: 1,
                                fontSize: "0.75rem",
                                color: "text.secondary",
                              }}
                            >
                              <span>
                                Requested at{" "}
                                {new Date(s.createdAt).toLocaleString()}
                              </span>
                              <Button
                                size="small"
                                variant="contained"
                                color="secondary"
                                onClick={() => {
                                  setSelectedMentor(s.mentor);
                                  setIsComplete(s.status === "COMPLETED");
                                  setModalOpen(true);
                                }}
                                sx={{
                                  textTransform: "none",
                                  py: 0.25,
                                  minHeight: 0,
                                  alignSelf: { xs: "stretch", sm: "auto" },
                                }}
                              >
                                View Mentor
                              </Button>
                            </Box>
                          </Stack>
                        </Box>
                      ))}
                    </Box>
                  )}
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
                      <CircularProgress size={24} sx={{ color: "text.secondary" }} />
                    </Box>
                  ) : userReviews.length === 0 ? (
                    <Typography
                      sx={{
                        textAlign: "center",
                        py: 6,
                        color: "text.secondary",
                      }}
                    >
                      You haven't left any reviews yet.
                    </Typography>
                  ) : (
                    <Stack spacing={1.5}>
                      {userReviews.map((r) => (
                        <Box
                          key={r.id}
                          sx={{
                            borderLeft: 2,
                            borderColor: "rgba(58, 88, 65, 0.4)",
                            pl: 1.5,
                            "&:hover": { bgcolor: "rgba(0,0,0,0.03)" },
                          }}
                        >
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

      <MentorDetailModal
        mentor={selectedMentor}
        isComplete={isComplete}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
      <PromotionRequestModal
        open={promotionModalOpen}
        onOpenChange={setPromotionModalOpen}
      />
    </Container>
  );
};

export default UserDashboardPage;