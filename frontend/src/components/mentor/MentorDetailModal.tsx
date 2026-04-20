import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { gql } from "@/lib/graphql";
import { ALL_REVIEWS_QUERY } from "@/lib/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Briefcase, GraduationCap, MapPin, MessageSquarePlus, Star, X } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Review, User } from "@/types";
import { SessionRequestModal } from "@/components/sessions/SessionRequestModal";

interface MentorDetailModalProps {
  mentor: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MentorDetailModal = ({ mentor, open, onOpenChange }: MentorDetailModalProps) => {
  const { user } = useAuthStore();
  const [requestOpen, setRequestOpen] = useState(false);

  const { data: reviews } = useQuery({
    queryKey: ["all-reviews"],
    queryFn: async () => {
      const res = await gql<{ allReviews: Review[] }>(ALL_REVIEWS_QUERY);
      return res.allReviews;
    },
  });

  if (!mentor) return null;

  const mentorReviews = (reviews ?? []).filter((r) => r.mentor?.id === mentor.id);
  const avgScore = mentorReviews.length
    ? mentorReviews.reduce((s, r) => s + r.score, 0) / mentorReviews.length
    : 0;

  const isSelf = user?.id === mentor.id;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between"><span>Mentor Details</span></DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {isSelf && (<p className="text-sm text-muted-foreground italic">This is your own mentor profile.</p>)}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">{mentor.firstName} {mentor.lastName}</h1>
                    <p className="text-muted-foreground">{mentor.email}</p>
                  </div>
                  <Badge>MENTOR</Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  {mentor.occupation && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" /><span>{mentor.occupation}</span>
                    </div>
                  )}

                  {mentor.expertise && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" /><span>{mentor.expertise}</span>
                    </div>
                  )}

                  {mentor.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{mentor.address}</span>
                    </div>
                  )}

                  {mentorReviews.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500" />
                      <span>
                        {avgScore.toFixed(1)} ({mentorReviews.length} review{mentorReviews.length === 1 ? "" : "s"})
                      </span>
                    </div>
                  )}
                </div>

                {mentor.bio && (
                  <div>
                    <h2 className="font-semibold mb-1">About</h2>
                    <p className="text-muted-foreground whitespace-pre-line">{mentor.bio}</p>
                  </div>
                )}

                {!isSelf && user?.role === "USER" && (
                  <Button onClick={() => setRequestOpen(true)} className="w-full md:w-auto">
                    <MessageSquarePlus className="h-4 w-4 mr-2" />Request Mentorship Session
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <h2 className="font-semibold text-lg">Reviews</h2>
                {mentorReviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No reviews yet.</p>
                ) : (
                  <div className="space-y-3">
                    {mentorReviews.map((r) => (
                      <div key={r.id} className="border-l-2 border-primary/40 pl-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{r.mentee.firstName} {r.mentee.lastName}</span>
                          <span className="flex items-center gap-1 text-amber-600">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < r.score ? "fill-current" : "text-gray-300"}`} />
                            ))}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{r.remark}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      <SessionRequestModal open={requestOpen} onOpenChange={setRequestOpen} mentor={mentor} />
    </>
  );
};