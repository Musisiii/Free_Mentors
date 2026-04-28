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
import { UPDATE_SESSION_STATUS_MUTATION } from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";
import { MentorshipSession } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  session: MentorshipSession | null;
}

export function SessionRejectModal({ open, onOpenChange, session }: Props) {
  const [reason, setReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error("No session selected");
      const res = await gql<{
        updateSessionStatus: { success: boolean; errors: string[] | null };
      }>(UPDATE_SESSION_STATUS_MUTATION, {
        sessionId: session.id,
        status: "REJECTED",
        rejectReason: reason.trim(),
      });
      if (!res.updateSessionStatus.success) {
        throw new Error(
          res.updateSessionStatus.errors?.[0] || "Failed to reject session",
        );
      }
    },
    onSuccess: () => {
      toast({ title: "Session declined" });
      queryClient.invalidateQueries({ queryKey: ["my-sessions"] });
      setReason("");
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({
        title: "Could not decline",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast({
        title: "Please provide a reason",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate();
  };

  const handleClose = () => {
    setReason("");
    onOpenChange(false);
  };

  if (!session) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontSize: "1.125rem", fontWeight: 600 }}>
          Decline session with {session.mentee.firstName} {session.mentee.lastName}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2, fontSize: "0.875rem" }}>
            Would you like to share a brief reason for declining this session request?
          </DialogContentText>
          <Stack spacing={1}>
            <Typography
              component="label"
              htmlFor="reason"
              sx={{ fontSize: "0.875rem", fontWeight: 500 }}
            >
              Reason(Optional)
            </Typography>
            <TextField
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required={false}
              multiline
              rows={2}
              fullWidth
              size="small"
              placeholder="e.g: this topic isn't in my expertise,..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button type="button" variant="outlined" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="outlined"
            color="error"
            disabled={mutation.isPending}
            startIcon={
              mutation.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : null
            }
          >
            Decline
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}