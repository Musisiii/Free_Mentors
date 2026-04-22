import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { gql } from "@/lib/graphql";
import { CREATE_REVIEW_MUTATION } from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Star } from "lucide-react";
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
      try {
        console.log("Submitting review with:", { mentorId: mentor.id, remark, score });
        const res = await gql<{
          createReview: { success: boolean; errors: string[] | null; review?: any };
        }>(CREATE_REVIEW_MUTATION, { mentorId: mentor.id, remark, score });
        console.log("Review response:", res);
        if (!res.createReview.success) {
          throw new Error(res.createReview.errors?.[0] || "Failed to submit review");
        }
        return res.createReview;
      } catch (error: any) {
        console.error("Review mutation error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Thanks for your feedback!" });
      queryClient.invalidateQueries({ queryKey: ["all-reviews"] });
      setRemark("");
      setScore(5);
      onOpenChange(false);
    },
    onError: (err: any) => {
      const errorMsg = err.message || "An unknown error occurred";
      console.error("Toast error:", errorMsg);
      toast({ title: "Could not submit review", description: errorMsg, variant: "destructive" });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review {mentor.firstName} {mentor.lastName}</DialogTitle>
          <DialogDescription>Share how the session went so other learners can find great mentors.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setScore(n)} className="p-1" aria-label={`Rate ${n}`}>
                  <Star className={`h-7 w-7 ${n <= score ? "fill-amber-600/70 text-amber-600/30" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="remark">Remarks</Label>
            <Textarea id="remark" rows={4} value={remark} onChange={(e) => setRemark(e.target.value)} required
              placeholder="What did you like? Any feedback for the mentor?"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit Review
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
