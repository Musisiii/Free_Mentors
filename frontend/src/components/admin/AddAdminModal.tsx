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
import { ADD_ADMIN_MUTATION } from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const empty = { firstName: "", lastName: "", email: "", address: "" };

export function AddAdminModal({ open, onOpenChange }: Props) {
  const [form, setForm] = useState(empty);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await gql<{
        addAdmin: { success: boolean; errors: string[] | null };
      }>(ADD_ADMIN_MUTATION, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
      });
      if (!res.addAdmin.success) {
        throw new Error(res.addAdmin.errors?.[0] || "Failed to add admin");
      }
    },
    onSuccess: () => {
      toast({
        title: "Admin created",
        description: "Default password is Password123!",
      });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      setForm(empty);
      onOpenChange(false);
    },
    onError: (err: any) =>
      toast({
        title: "Could not add admin",
        description: err.message,
        variant: "destructive",
      }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      toast({
        title: "Missing required fields",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate();
  };

  const handleClose = () => {
    setForm(empty);
    onOpenChange(false);
  };

  const update =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontSize: "1.125rem", fontWeight: 600 }}>
          Add a new admin
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2, fontSize: "0.875rem" }}>
            The new admin's password will be set to{" "}
            <Box component="span" sx={{ fontFamily: "monospace" }}>
              Password123!
            </Box>{" "}
            — they can change it after their first login.
          </DialogContentText>
          <Stack spacing={2}>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <Stack spacing={1}>
                <Typography component="label" htmlFor="firstName" sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                  First Name
                </Typography>
                <TextField
                  id="firstName"
                  value={form.firstName}
                  onChange={update("firstName")}
                  required
                  size="small"
                  fullWidth
                />
              </Stack>
              <Stack spacing={1}>
                <Typography component="label" htmlFor="lastName" sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                  Last Name
                </Typography>
                <TextField
                  id="lastName"
                  value={form.lastName}
                  onChange={update("lastName")}
                  required
                  size="small"
                  fullWidth
                />
              </Stack>
            </Box>
            <Stack spacing={1}>
              <Typography component="label" htmlFor="email" sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                Email
              </Typography>
              <TextField
                id="email"
                type="email"
                value={form.email}
                onChange={update("email")}
                required
                size="small"
                fullWidth
              />
            </Stack>
            <Stack spacing={1}>
              <Typography component="label" htmlFor="address" sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                Address
              </Typography>
              <TextField
                id="address"
                value={form.address}
                onChange={update("address")}
                size="small"
                fullWidth
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
            Create admin
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}