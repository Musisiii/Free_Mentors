import { useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";
import { gql } from "@/lib/graphql";
import { ALL_MENTORS_QUERY } from "@/lib/queries";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Search,
  Briefcase,
  MapPin,
  GraduationCap,
  ArrowLeft,
} from "lucide-react";
import { User } from "@/types";
import { MentorDetailModal } from "@/components/mentor/MentorDetailModal";

const MentorsPage = () => {
  const theme = useTheme();
  const [search, setSearch] = useState("");
  const [selectedMentor, setSelectedMentor] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const dashboardPath =
    user?.role === "ADMIN"
      ? "/dashboard/admin"
      : user?.role === "MENTOR"
        ? "/dashboard/mentor"
        : "/dashboard/user";

  const { data, isLoading, error } = useQuery({
    queryKey: ["all-mentors"],
    queryFn: async () => {
      const res = await gql<{ allMentors: User[] }>(ALL_MENTORS_QUERY);
      return res.allMentors;
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter((m) =>
      [m.firstName, m.lastName, m.expertise, m.occupation, m.address, m.bio]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q)),
    );
  }, [data, search]);

  return (
    <Container maxWidth="lg" sx={{ p: 2, py: 4 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { md: "flex-end" },
          justifyContent: { md: "space-between" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Button
            variant="contained"
            color="secondary"
            size="small"
            component={RouterLink}
            to={dashboardPath}
            startIcon={<ArrowLeft size={16} />}
          >
            Back to Dashboard
          </Button>
        </Box>
        <TextField
          placeholder="Search by name, expertise, occupation…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ width: { xs: "100%", md: 320 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} color={theme.palette.text.secondary} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography component="h1" sx={{ fontSize: "1.875rem", fontWeight: 700 }}>
          Browse Mentors
        </Typography>
        <Typography sx={{ color: "text.secondary" }}>
          Find a mentor whose expertise matches your goals.
        </Typography>
      </Box>

      {isLoading && (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            },
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Card
              key={i}
              sx={{
                height: 192,
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "@keyframes pulse": {
                  "0%, 100%": { opacity: 1 },
                  "50%": { opacity: 0.5 },
                },
              }}
            />
          ))}
        </Box>
      )}

      {error && (
        <Card sx={{ p: 3, textAlign: "center", color: "error.main" }}>
          Failed to load mentors. Please try again.
        </Card>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <Card sx={{ p: 6, textAlign: "center", color: "text.secondary" }}>
          <GraduationCap
            size={40}
            style={{ display: "block", margin: "0 auto 12px" }}
          />
          We don't have any mentors matching your search yet.
        </Card>
      )}

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(3, 1fr)",
          },
        }}
      >
        {filtered.map((mentor) => (
          <Card
            key={mentor.id}
            onClick={() => {
              setSelectedMentor(mentor);
              setModalOpen(true);
            }}
            sx={{
              cursor: "pointer",
              transition: "box-shadow 150ms, border-color 150ms",
              "&:hover": {
                boxShadow: 3,
                borderColor: "primary.main",
              },
            }}
          >
            <CardContent>
              <Stack spacing={1.5} sx={{ pt: 0.5 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 1,
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: "1.125rem" }}>
                      {mentor.firstName} {mentor.lastName}
                    </Typography>
                    <Typography
                      sx={{ fontSize: "0.75rem", color: "text.secondary" }}
                    >
                      {mentor.email}
                    </Typography>
                  </Box>
                  <Chip
                    label="MENTOR"
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: "0.625rem",
                      fontWeight: 600,
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                    }}
                  />
                </Box>

                {mentor.occupation && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Briefcase
                      size={16}
                      color={theme.palette.text.secondary}
                    />
                    <Typography sx={{ fontSize: "0.875rem" }}>
                      {mentor.occupation}
                    </Typography>
                  </Stack>
                )}

                {mentor.address && (
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ color: "text.secondary" }}
                  >
                    <MapPin size={16} />
                    <Typography sx={{ fontSize: "0.875rem" }}>
                      {mentor.address}
                    </Typography>
                  </Stack>
                )}

                {mentor.expertise && (
                  <Typography
                    sx={{ fontSize: "0.75rem", color: "text.secondary" }}
                  >
                    Expertise:{" "}
                    <Box
                      component="span"
                      sx={{
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        color: "text.primary",
                      }}
                    >
                      {mentor.expertise}
                    </Box>
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>

      <MentorDetailModal
        mentor={selectedMentor}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </Container>
  );
};

export default MentorsPage;
