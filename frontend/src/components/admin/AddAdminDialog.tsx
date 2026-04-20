import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { gql } from "@/lib/graphql";
import { ADD_ADMIN_MUTATION } from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function AddAdminDialog({ open, onOpenChange }: Props) {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await gql<{ addAdmin: { success: boolean; errors: string[] | null } }>(
        ADD_ADMIN_MUTATION,
        { email: email.trim() },
      );
      if (!res.addAdmin.success) {
        throw new Error(res.addAdmin.errors?.[0] || "Failed to promote user");
      }
    },
    onSuccess: () => {
      toast({ title: "Admin added", description: `${email} now has admin access.` });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      setEmail("");
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({ title: "Could not add admin", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <DialogTitle>Promote user to Admin</DialogTitle>
          </div>
          <DialogDescription>
            Enter the email of an existing user. They will be granted admin privileges.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!email.trim()) return;
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Promote to Admin
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
