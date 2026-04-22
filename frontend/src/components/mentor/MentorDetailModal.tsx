import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { gql } from "@/lib/graphql";
import { ALL_REVIEWS_QUERY } from "@/lib/queries";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Briefcase,
  GraduationCap,
  MapPin,
  MessageSquarePlus,
  PenLine,
  Star,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Review, User } from "@/types";
import { SessionRequestModal } from "@/components/sessions/SessionRequestModal";
import { ReviewModal } from "../sessions/ReviewModal";

interface MentorDetailModalProps {
  mentor: User | null;
  isComplete?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MentorDetailModal = ({
  mentor,
  isComplete,
  open,
  onOpenChange,
}: MentorDetailModalProps) => {
  const theme = useTheme();
  const { user } = useAuthStore();
  const [requestOpen, setRequestOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const { data: reviews } = useQuery({
    queryKey: ["all-reviews"],
    queryFn: async () => {
      const res = await gql<{ allReviews: Review[] }>(ALL_REVIEWS_QUERY);
      return res.allReviews;
    },
  });

  if (!mentor) return null;

  const mentorReviews = (reviews ?? []).filter((r) => r.mentor?.id === mentor.id);
  const avgScore = mentorReviews.length
    ? mentorReviews.reduce((s, r) => s + r.score, 0) / mentorReviews.length
    : 0;

  const isSelf = user?.id === mentor.id;

  return (
    <>
      <Dialog
        open={open}
        onClose={() => onOpenChange(false)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { maxHeight: "90vh" } } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "1.125rem",
            fontWeight: 600,
          }}
        >
          <span>Mentor Details</span>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={3}>
            {isSelf && (
              <Typography
                sx={{
                  fontSize: "0.875rem",
                  color: "text.secondary",
                  fontStyle: "italic",
                }}
              >
                This is your own mentor profile.
              </Typography>
            )}

            <Card>
              <CardContent>
                <Stack spacing={2} sx={{ pt: 0.5 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 2,
                    }}
                  >
                    <Box>
                      <Typography
                        component="h1"
                        sx={{ fontSize: "1.5rem", fontWeight: 700 }}
                      >
                        {mentor.firstName} {mentor.lastName}
                      </Typography>
                      <Typography sx={{ color: "text.secondary" }}>
                        {mentor.email}
                      </Typography>
                    </Box>
                    <Chip
                      label="MENTOR"
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        bgcolor: "rgba(58, 88, 65, 0.2)",
                        color: "primary.main",
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "grid",
                      gap: 2,
                      gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                      fontSize: "0.875rem",
                    }}
                  >
                    {mentor.occupation && (
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <Briefcase
                          size={16}
                          color={theme.palette.text.secondary}
                        />
                        <Typography sx={{ fontSize: "0.875rem" }}>
                          {mentor.occupation}
                        </Typography>
                      </Stack>
                    )}

                    {mentor.expertise && (
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <GraduationCap
                          size={16}
                          color={theme.palette.text.secondary}
                        />
                        <Typography sx={{ fontSize: "0.875rem" }}>
                          {mentor.expertise}
                        </Typography>
                      </Stack>
                    )}

                    {mentor.address && (
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <MapPin
                          size={16}
                          color={theme.palette.text.secondary}
                        />
                        <Typography sx={{ fontSize: "0.875rem" }}>
                          {mentor.address}
                        </Typography>
                      </Stack>
                    )}

                    {mentorReviews.length > 0 && (
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <Star size={16} color="#f59e0b" />
                        <Typography sx={{ fontSize: "0.875rem" }}>
                          {avgScore.toFixed(1)} ({mentorReviews.length} review
                          {mentorReviews.length === 1 ? "" : "s"})
                        </Typography>
                      </Stack>
                    )}
                  </Box>

                  {mentor.bio && (
                    <Box>
                      <Typography
                        component="h2"
                        sx={{ fontWeight: 600, mb: 0.5 }}
                      >
                        About
                      </Typography>
                      <Typography
                        sx={{
                          color: "text.secondary",
                          whiteSpace: "pre-line",
                        }}
                      >
                        {mentor.bio}
                      </Typography>
                    </Box>
                  )}

                  {!isSelf && user?.role === "USER" && (
                    <Box>
                      <Button
                        variant="contained"
                        onClick={() => setRequestOpen(true)}
                        startIcon={<MessageSquarePlus size={16} />}
                        sx={{ width: { xs: "100%", md: "auto" } }}
                      >
                        Request Mentorship Session
                      </Button>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Stack spacing={2} sx={{ pt: 0.5 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 2,
                    }}
                  >
                    <Typography
                      component="h2"
                      sx={{ fontWeight: 600, fontSize: "1.125rem" }}
                    >
                      Reviews
                    </Typography>
                    {isComplete && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setReviewOpen(true)}
                        startIcon={<PenLine size={14} />}
                      >
                        Leave a Review
                      </Button>
                    )}
                  </Box>

                  {mentorReviews.length === 0 ? (
                    <Typography
                      sx={{ fontSize: "0.875rem", color: "text.secondary" }}
                    >
                      No reviews yet.
                    </Typography>
                  ) : (
                    <Stack spacing={2.5}>
                      {mentorReviews.map((r) => (
                        <Box
                          key={r.id}
                          sx={{
                            borderLeft: 2,
                            borderColor: "rgba(58, 88, 65, 0.4)",
                            pl: 1.5,
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ alignItems: "center" }}
                          >
                            <Typography
                              sx={{
                                fontSize: "0.875rem",
                                fontWeight: 500,
                              }}
                            >
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
                                  color="#d97706"
                                  fill={i < r.score ? "#d97706" : "none"}
                                  style={{
                                    color: i < r.score ? "#d97706" : "#d1d5db",
                                  }}
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
          </Stack>
        </DialogContent>
      </Dialog>

      <SessionRequestModal
        open={requestOpen}
        onOpenChange={setRequestOpen}
        mentor={mentor}
      />

      {isComplete && (
        <ReviewModal
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          mentor={mentor}
        />
      )}
    </>
  );
};
