import { useState } from "react";
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

export function SessionRequestModal({ open, onOpenChange, mentor }: Props) {
  const [questions, setQuestions] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await gql<{
        createSession: {
          success: boolean;
          errors: string[] | null;
          session: MentorshipSession | null;
        };
      }>(CREATE_SESSION_MUTATION, { mentorId: mentor.id, questions });
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
    mutation.mutate();
  };

  const handleClose = () => {
    setQuestions("");
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
            Briefly describe the topic and any specific questions you'd like to
            discuss. The mentor will accept or decline your request based on
            their availability and expertise.
          </DialogContentText>
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
