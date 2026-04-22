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
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { gql } from "@/lib/graphql";
import { CREATE_REVIEW_MUTATION } from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";
import { Star } from "lucide-react";
import { User } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mentor: User;
}

export function ReviewModal({ open, onOpenChange, mentor }: Props) {
  const [score, setScore] = useState(5);
  const [remark, setRemark] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await gql<{
        createReview: { success: boolean; errors: string[] | null; review?: any };
      }>(CREATE_REVIEW_MUTATION, { mentorId: mentor.id, remark, score });
      if (!res.createReview.success) {
        throw new Error(
          res.createReview.errors?.[0] || "Failed to submit review",
        );
      }
      return res.createReview;
    },
    onSuccess: () => {
      toast({ title: "Thanks for your feedback!" });
      queryClient.invalidateQueries({ queryKey: ["all-reviews"] });
      setRemark("");
      setScore(5);
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({
        title: "Could not submit review",
        description: err.message || "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remark.trim()) {
      toast({ title: "Please write a remark", variant: "destructive" });
      return;
    }
    mutation.mutate();
  };

  const handleClose = () => {
    setRemark("");
    setScore(5);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontSize: "1.125rem", fontWeight: 600 }}>
          Review {mentor.firstName} {mentor.lastName}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2, fontSize: "0.875rem" }}>
            Share how the session went so other learners can find great mentors.
          </DialogContentText>

          <Stack spacing={2}>
            <Stack spacing={1}>
              <Typography sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                Rating
              </Typography>
              <Stack direction="row" spacing={0.5}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <IconButton
                    key={n}
                    type="button"
                    onClick={() => setScore(n)}
                    aria-label={`Rate ${n}`}
                    size="small"
                    sx={{ p: 0.5 }}
                  >
                    <Star
                      size={28}
                      color={n <= score ? "rgba(217, 119, 6, 0.7)" : "#9ca3af"}
                      fill={n <= score ? "rgba(217, 119, 6, 0.7)" : "none"}
                    />
                  </IconButton>
                ))}
              </Stack>
            </Stack>

            <Stack spacing={1}>
              <Typography
                component="label"
                htmlFor="remark"
                sx={{ fontSize: "0.875rem", fontWeight: 500 }}
              >
                Remarks
              </Typography>
              <TextField
                id="remark"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                required
                multiline
                rows={4}
                fullWidth
                size="small"
                placeholder="What did you like? Any feedback for the mentor?"
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
            Submit Review
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
