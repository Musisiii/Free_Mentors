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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { gql } from "@/lib/graphql";
import { CREATE_SESSION_MUTATION } from "@/lib/queries";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
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
        createSession: { success: boolean; errors: string[] | null; session: MentorshipSession | null };
      }>(CREATE_SESSION_MUTATION, { mentorId: mentor.id, questions });
      if (!res.createSession.success) {
        throw new Error(res.createSession.errors?.[0] || "Failed to create session");
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
      toast({ title: "Could not send request", description: err.message, variant: "destructive" });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Request a session with {mentor.firstName} {mentor.lastName}
          </DialogTitle>
          <DialogDescription>
            Briefly describe the topic and any specific questions you'd like to discuss. The
            mentor will accept or decline your request.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="questions">Topic & questions</Label>
            <Textarea
              id="questions"
              rows={5}
              placeholder="e.g. I'd love guidance on transitioning into backend engineering. What roadmap would you recommend?"
              value={questions}
              onChange={(e) => setQuestions(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
