import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gql } from "@/lib/graphql";
import { MY_SESSIONS_QUERY, UPDATE_SESSION_STATUS_MUTATION, ALL_REVIEWS_QUERY } from "@/lib/queries";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Field } from "@/components/ui/field";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, CheckCircle, GraduationCap, Loader2, MapPin, User, XCircle, Flag, Mail, Star, Binoculars, PenLine, Crown } from "lucide-react";
import { MentorshipSession, SessionStatus, Review } from "@/types";

type Tab = "sessions" | "reviews";
type SessionCategory = "all" | "pending" | "accepted" | "rejected" | "completed";
type ReviewCategory = "all" | "visible" | "hidden";

const MentorDashboardPage = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("sessions");
  const [selectedSessionCategory, setSelectedSessionCategory] = useState<SessionCategory>("all");
  const [selectedReviewCategory, setSelectedReviewCategory] = useState<ReviewCategory>("all");

  const { data: sessions, isLoading: sessionLoading } = useQuery({
    queryKey: ["my-sessions"],
    queryFn: async () => {
      const res = await gql<{ mySessions: MentorshipSession[] }>(MY_SESSIONS_QUERY);
      return res.mySessions;
    },
  });

  const { data: reviews, isLoading: reviewLoading } = useQuery({
    queryKey: ["all-reviews"],
    queryFn: async () => {
      const res = await gql<{ allReviews: Review[] }>(ALL_REVIEWS_QUERY);
      return res.allReviews;
    },
  });

  const mentorReviews = (reviews ?? []).filter((r) => r.mentor?.id === user.id);
  const avgScore = mentorReviews.length
    ? mentorReviews.reduce((s, r) => s + r.score, 0) / mentorReviews.length
    : 0;

  const updateStatus = useMutation({
    mutationFn: async ({ sessionId, status }: { sessionId: string; status: SessionStatus }) => {
      const res = await gql<{updateSessionStatus: { success: boolean; errors: string[] | null }}>(
        UPDATE_SESSION_STATUS_MUTATION, { sessionId, status }
      );
      if (!res.updateSessionStatus.success) {
        throw new Error(res.updateSessionStatus.errors?.[0] || "Update failed");
      }
    },
    onSuccess: (_v, variables) => {
      toast({
        title: "Session updated",
        description: `Marked as ${variables.status.toLowerCase()}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["my-sessions"] });
    },
    onError: (err: any) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  const counts = useMemo(() => {
    const all = sessions ?? [];
    return {
      total: all.length,
      pending: all.filter((s) => s.status === "PENDING").length,
      accepted: all.filter((s) => s.status === "ACCEPTED").length,
      rejected: all.filter((s) => s.status === "REJECTED").length,
      completed: all.filter((s) => s.status === "COMPLETED").length,
    };
  }, [sessions]);

  const getFilteredSessions = () => {
    if (!sessions) return [];
    switch (selectedSessionCategory) {
      case "pending":
        return sessions.filter((s) => s.status === "PENDING");
      case "accepted":
        return sessions.filter((s) => s.status === "ACCEPTED");
      case "rejected":
        return sessions.filter((s) => s.status === "REJECTED");
      case "completed":
        return sessions.filter((s) => s.status === "COMPLETED");
      default:
        return sessions;
    }
  };

  const filteredSessions = getFilteredSessions();

  return (
    <div className="container max-w-6xl mx-auto p-4 py-8">
      <div className="grid lg:grid-cols-[280px,1fr] gap-6 items-start">
        {/* Profile */}
        <aside className="lg:sticky lg:top-40">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-3">
                  <GraduationCap className="h-6 w-6 text-primary" /></div>
                <div>
                  <div className="font-semibold">{user?.firstName} {user?.lastName}</div>
                  <div className="text-xs text-muted-foreground">{user?.email}</div>
                  <Badge className="mt-1">{user?.role}</Badge>
                </div>
              </div>

              <div className="space-y-2 text-sm font-medium border-t pt-4">
                {user?.occupation && (
                  <Field label="Occupation" icon={<Briefcase className="h-3 w-3" />}>{user.occupation}</Field>
                )}
                {user?.expertise && <Field label="Expertise" icon={<Crown className="h-3 w-3" />}>{user.expertise}</Field>}
                {user?.address && (
                  <Field label="Address" icon={<MapPin className="h-3 w-3" />}>{user.address}</Field>
                )}
                {mentorReviews.length > 0 && (
                  <Field label="Rating" icon={<Star className="h-3 w-3 text-amber-500" />}>
                    <span>
                      {avgScore.toFixed(1)} ({mentorReviews.length} review{mentorReviews.length === 1 ? "" : "s"})
                    </span>
                  </Field>
                )}
                {user?.bio && <Field label="Bio" icon={<Binoculars className="h-3 w-3" />}>{user.bio}</Field>}
              </div>

              <div className="space-y-1 pt-2 border-t">
                <Button variant={tab === "sessions" ? "secondary" : "ghost"} size="sm" className="w-full justify-start"
                  onClick={() => setTab("sessions")}
                >
                  <PenLine className="h-4 w-4 mr-2" /> Sessions
                </Button>
                <Button variant={tab === "reviews" ? "secondary" : "ghost"} size="sm" className="w-full justify-start"
                  onClick={() => setTab("reviews")}
                >
                  <Star className="h-4 w-4 mr-2" /> Reviews
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                  <Link to="/mentors">
                    <GraduationCap className="h-4 w-4 mr-2" /> Browse Mentors
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Main */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Mentor Dashboard</h1>

          {tab === "sessions" && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <StatCard label="Total" value={counts.total} loading={sessionLoading} icon={<></>}
                  isActive={selectedSessionCategory === "all"}
                  onClick={() => setSelectedSessionCategory("all")}
                />
                <StatCard label="Pending" value={counts.pending} loading={sessionLoading} icon={<></>}
                  isActive={selectedSessionCategory === "pending"}
                  onClick={() => setSelectedSessionCategory("pending")}
                />
                <StatCard label="Accepted" value={counts.accepted} loading={sessionLoading} icon={<></>}
                  isActive={selectedSessionCategory === "accepted"}
                  onClick={() => setSelectedSessionCategory("accepted")}
                />
                <StatCard label="Rejected" value={counts.rejected} loading={sessionLoading} icon={<></>}
                  isActive={selectedSessionCategory === "rejected"}
                  onClick={() => setSelectedSessionCategory("rejected")}
                />
                <StatCard label="Completed" value={counts.completed} loading={sessionLoading} icon={<></>}
                  isActive={selectedSessionCategory === "completed"}
                  onClick={() => setSelectedSessionCategory("completed")}
                />
              </div>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h2 className="text-xl font-semibold">Session Requests</h2>

                  {sessionLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredSessions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">No sessions in this view.</div>
                  ) : (
                    <div className="space-y-3">
                      {filteredSessions.map((s) => {
                        const isPending = updateStatus.isPending;
                        return (
                          <div key={s.id} className="border rounded-lg p-4 space-y-3 hover:bg-secondary/20">
                            <div className="flex items-start justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-3">
                                <div className="rounded-full bg-muted p-2"><User className="h-4 w-4 text-primary" /></div>
                                <div>
                                  <div className="font-semibold">{s.mentee.firstName} {s.mentee.lastName}</div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Mail className="h-3 w-3" /> {s.mentee.email}
                                  </div>
                                </div>
                              </div>
                              <Badge variant={
                                s.status === 'PENDING' ? 'user' :
                                s.status === 'ACCEPTED' ? 'default' :
                                s.status === 'COMPLETED' ? 'admin' :
                                s.status === 'REJECTED' ? 'destructive' :
                                'secondary'
                              }>{s.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground whitespace-pre-line">{s.questions}</p>
                            <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
                              <span>Requested at {new Date(s.createdAt).toLocaleString()}</span>
                              <div className="flex gap-2">
                                {s.status === "PENDING" && (
                                  <>
                                    <Button size="sm" variant="outline" disabled={isPending}
                                      onClick={() => updateStatus.mutate({ sessionId: s.id, status: "ACCEPTED" })}
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" /> Accept
                                    </Button>
                                    <Button size="sm" variant="outline_destructive" disabled={isPending}
                                      onClick={() => updateStatus.mutate({ sessionId: s.id, status: "REJECTED" })}
                                    >
                                      <XCircle className="h-3 w-3 mr-1" /> Decline
                                    </Button>
                                  </>
                                )}
                                {s.status === "ACCEPTED" && (
                                  <Button size="sm" variant="outline_complete" disabled={isPending}
                                    onClick={() => updateStatus.mutate({ sessionId: s.id, status: "COMPLETED" })}
                                  >
                                    <Flag className="h-3 w-3 mr-1" /> Mark Completed
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {tab === "reviews" && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h2 className="text-xl font-semibold">My Reviews</h2>

                {reviewLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : mentorReviews.length === 0 ? (
                  <p className="text-center py-12 text-muted-foreground">No reviews yet.</p>
                ) : (
                  <div className="space-y-3">
                    {mentorReviews.map((r) => (
                      <div key={r.id} className="border-l-2 border-primary/40 pl-3 hover:bg-secondary/30">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{r.mentee.firstName} {r.mentee.lastName}</span>
                          <span className="flex items-center gap-1 text-amber-600">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < r.score ? "fill-current" : "text-gray-300"}`}/>
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
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorDashboardPage;
