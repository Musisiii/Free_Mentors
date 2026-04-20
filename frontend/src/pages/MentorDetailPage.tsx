import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { gql } from "@/lib/graphql";
import { MENTOR_DETAIL_QUERY, ALL_REVIEWS_QUERY } from "@/lib/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Briefcase,
  GraduationCap,
  MapPin,
  MessageSquarePlus,
  Star,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Review, User } from "@/types";
import { SessionRequestModal } from "@/components/sessions/SessionRequestModal";

const MentorDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [requestOpen, setRequestOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["mentor", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await gql<{ mentorDetail: User | null }>(MENTOR_DETAIL_QUERY, { id });
      return res.mentorDetail;
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ["all-reviews"],
    queryFn: async () => {
      const res = await gql<{ allReviews: Review[] }>(ALL_REVIEWS_QUERY);
      return res.allReviews;
    },
  });

  const mentorReviews = (reviews ?? []).filter((r) => r.mentor?.id === id);
  const avgScore = mentorReviews.length
    ? mentorReviews.reduce((s, r) => s + r.score, 0) / mentorReviews.length
    : 0;

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-4 py-8">
        <Card className="h-64 animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container max-w-4xl mx-auto p-4 py-8">
        <Card className="p-12 text-center">
          <p className="text-destructive mb-4">Mentor not found.</p>
          <Button asChild>
            <Link to="/mentors">Back to mentors</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const mentor = data;
  const isSelf = user?.id === mentor.id;

  return (
    <div className="container max-w-4xl mx-auto p-4 py-8 space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {mentor.firstName} {mentor.lastName}
              </h1>
              <p className="text-muted-foreground">{mentor.email}</p>
            </div>
            <Badge>MENTOR</Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-sm">
            {mentor.occupation && (
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>{mentor.occupation}</span>
              </div>
            )}
            {mentor.expertise && (
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span>{mentor.expertise}</span>
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
                  {avgScore.toFixed(1)} ({mentorReviews.length} review
                  {mentorReviews.length === 1 ? "" : "s"})
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
              <MessageSquarePlus className="h-4 w-4 mr-2" />
              Request Mentorship Session
            </Button>
          )}
          {isSelf && (
            <p className="text-sm text-muted-foreground italic">
              This is your own mentor profile.
            </p>
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
                    <span className="font-medium">
                      {r.mentee.firstName} {r.mentee.lastName}
                    </span>
                    <span className="flex items-center gap-1 text-amber-600">
                      {Array.from({ length: r.score }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-current" />
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

      <SessionRequestModal
        open={requestOpen}
        onOpenChange={setRequestOpen}
        mentor={mentor}
      />
    </div>
  );
};

export default MentorDetailPage;
