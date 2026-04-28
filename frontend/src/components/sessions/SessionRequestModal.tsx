import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { gql } from "@/lib/graphql";
import { CREATE_SESSION_MUTATION } from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";
import { MentorshipSession, User } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mentor: User;
}

// Build a default scheduled-at value 30 minutes from now, formatted for
// <input type="datetime-local">.
function defaultScheduledAt(): string {
  const d = new Date(Date.now() + 30 * 60 * 1000);
  d.setSeconds(0, 0);
  const tzOffsetMin = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tzOffsetMin * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

export function SessionRequestModal({ open, onOpenChange, mentor }: Props) {
  const [questions, setQuestions] = useState("");
  const [scheduledAt, setScheduledAt] = useState<string>(defaultScheduledAt());
  const [duration, setDuration] = useState<number>(30);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const minDateTime = (() => {
    const d = new Date(Date.now() + 31 * 60 * 1000);
    d.setSeconds(0, 0);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60 * 1000);
    return local.toISOString().slice(0, 16);
  })();

  const mutation = useMutation({
    mutationFn: async () => {
      const iso = new Date(scheduledAt).toISOString();
      const res = await gql<{
        createSession: {
          success: boolean;
          errors: string[] | null;
          session: MentorshipSession | null;
        };
      }>(CREATE_SESSION_MUTATION, {
        mentorId: mentor.id,
        questions,
        scheduledAt: iso,
        durationMinutes: duration,
      });
      if (!res.createSession.success) {
        throw new Error(
          res.createSession.errors?.[0] || "Failed to create session",
        );
      }
      return res.createSession.session;
    },
    onSuccess: () => {
      toast({
        title: "Session requested!",
        description: `Your request was sent to ${mentor.firstName} ${mentor.lastName}.`,
      });
      setQuestions("");
      setScheduledAt(defaultScheduledAt());
      setDuration(30);
      queryClient.invalidateQueries({ queryKey: ["my-sessions"] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({
        title: "Could not send request",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questions.trim()) {
      toast({
        title: "Please describe what you'd like to discuss",
        variant: "destructive",
      });
      return;
    }
    if (!scheduledAt) {
      toast({ title: "Please pick a date and time", variant: "destructive" });
      return;
    }
    const picked = new Date(scheduledAt);
    const minTime = Date.now() + 30 * 60 * 1000;
    if (picked.getTime() < minTime) {
      setScheduledAt(minDateTime);
      return;
    }
    mutation.mutate();
  };

  const handleClose = () => {
    setQuestions("");
    setScheduledAt(defaultScheduledAt());
    setDuration(30);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontSize: "1.125rem", fontWeight: 600 }}>
          Request a session with {mentor.firstName} {mentor.lastName}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2, fontSize: "0.875rem" }}>
            Pick a date, time and duration. The mentor will accept or decline
            based on their availability.
          </DialogContentText>
          <Stack spacing={2}>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <Stack spacing={1}>
                <Typography
                  component="label"
                  htmlFor="scheduledAt"
                  sx={{ fontSize: "0.875rem", fontWeight: 500 }}
                >
                  Date & time
                </Typography>
                <TextField
                  id="scheduledAt"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => {
                    const value = e.target.value;
                    setScheduledAt(value < minDateTime ? minDateTime : value);
                  }}
                  required
                  size="small"
                />
              </Stack>
              <Stack spacing={1}>
                <Typography
                  component="label"
                  htmlFor="duration"
                  sx={{ fontSize: "0.875rem", fontWeight: 500 }}
                >
                  Duration (minutes)
                </Typography>
                <TextField
                  id="duration"
                  select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  size="small"
                >
                  {DURATION_OPTIONS.map((m) => (
                    <MenuItem key={m} value={m}>
                      {m} min
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            </Box>

            <Stack spacing={1}>
              <Typography
                component="label"
                htmlFor="questions"
                sx={{ fontSize: "0.875rem", fontWeight: 500 }}
              >
                Topic & questions
              </Typography>
              <TextField
                id="questions"
                value={questions}
                onChange={(e) => setQuestions(e.target.value)}
                required
                multiline
                rows={5}
                fullWidth
                size="small"
                placeholder="e.g. I'd love guidance on transitioning into backend engineering. What roadmap would you recommend?"
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button type="button" variant="outlined" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending}
            startIcon={
              mutation.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : null
            }
          >
            Send Request
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}