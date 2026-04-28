import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
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
import { CREATE_PROMOTION_REQUEST_MUTATION } from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function PromotionRequestModal({ open, onOpenChange }: Props) {
  const user = useAuthStore((s) => s.user);
  const [expertise, setExpertise] = useState("");
  const [occupation, setOccupation] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setOccupation(user?.occupation || "");
    }
  }, [open, user?.occupation]);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await gql<{
        createPromotionRequest: { success: boolean; errors: string[] | null };
      }>(CREATE_PROMOTION_REQUEST_MUTATION, {
        expertise: expertise.trim(),
        occupation: occupation.trim(),
      });
      if (!res.createPromotionRequest.success) {
        throw new Error(
          res.createPromotionRequest.errors?.[0] || "Failed to submit request",
        );
      }
    },
    onSuccess: () => {
      toast({
        title: "Request submitted",
        description: "An admin will review your request shortly.",
      });
      queryClient.invalidateQueries({ queryKey: ["my-promotion-request"] });
      setExpertise("");
      setOccupation("");
      onOpenChange(false);
    },
    onError: (err: any) =>
      toast({
        title: "Could not submit",
        description: err.message,
        variant: "destructive",
      }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expertise.trim()) {
      toast({ title: "Please describe your expertise", variant: "destructive" });
      return;
    }
    if (!occupation.trim()) {
      toast({ title: "Please enter your occupation", variant: "destructive" });
      return;
    }
    mutation.mutate();
  };

  const handleClose = () => {
    setExpertise("");
    setOccupation("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontSize: "1.125rem", fontWeight: 600 }}>
          Request mentor promotion
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2, fontSize: "0.875rem" }}>
            Tell us what you'd like to mentor on. An admin will review your
            request and approve or reject it.
          </DialogContentText>
          <Stack spacing={2}>
            <Stack spacing={1}>
              <Typography
                component="label"
                htmlFor="expertise"
                sx={{ fontSize: "0.875rem", fontWeight: 500 }}
              >
                Your expertise
              </Typography>
              <TextField
                id="expertise"
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
                required
                size="small"
                fullWidth
                placeholder="e.g. Frontend Engineering, Personal Finance, Public Speaking"
              />
            </Stack>
            <Stack spacing={1}>
              <Typography
                component="label"
                htmlFor="occupation"
                sx={{ fontSize: "0.875rem", fontWeight: 500 }}
              >
                Your occupation
              </Typography>
              <TextField
                id="occupation"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                required
                size="small"
                fullWidth
                placeholder="e.g. Senior Software Engineer, CFO, Voice Coach"
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
            Submit request
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}