import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { gql } from "@/lib/graphql";
import { MY_SESSIONS_QUERY, ALL_REVIEWS_QUERY } from "@/lib/queries";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { StatCard } from "@/components/ui/stat-card";
import { BookOpen, Briefcase, GraduationCap, Loader2, MapPin, User, Star, Binoculars, PenLine } from "lucide-react";
import { MentorshipSession, User as UserT, Review } from "@/types";
import { MentorDetailModal } from "@/components/mentor/MentorDetailModal";

type Tab = "sessions" | "reviews";
type SessionCategory = "all" | "pending" | "accepted" | "rejected" | "completed";

const UserDashboardPage = () => {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>("sessions");
  const [selectedSessionCategory, setSelectedSessionCategory] = useState<SessionCategory>("all");
  const [selectedMentor, setSelectedMentor] = useState<UserT | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

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

  const userReviews = (reviews ?? []).filter((r) => r.mentee?.id === user.id);

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
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">{user?.firstName} {user?.lastName}</div>
                  <div className="text-xs text-muted-foreground">{user?.email}</div>
                  <Badge variant="user">{user?.role}</Badge>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <Field label="Occupation" icon={<Briefcase className="h-3 w-3" />}>{user?.occupation || "Not set"}</Field>
                <Field label="Address" icon={<MapPin className="h-3 w-3" />}>{user?.address}</Field>
                {user?.bio && (
                  <Field label="Bio" icon={<Binoculars className="h-3 w-3" />}>{user.bio}</Field>
                )}
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
        <div className="space-y-6 min-h-[calc(100vh-8rem)]">
          <h1 className="text-3xl font-bold">User Dashboard</h1>

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
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold mb-4">My Mentorship Sessions</h2>

                  {sessionLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : !filteredSessions || filteredSessions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <BookOpen className="h-10 w-10 mx-auto mb-3" />
                      <p className="mb-3">No sessions found in this category.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {filteredSessions.map((s) => (
                        <div key={s.id} className="border rounded-lg p-4 space-y-2 hover:bg-secondary/30">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-semibold">{s.mentor.firstName} {s.mentor.lastName}</div>
                              {s.mentor.occupation && (
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Briefcase className="h-3 w-3" /> {s.mentor.occupation}
                                </div>
                              )}
                            </div>
                            <Badge variant={
                              s.status === 'PENDING' ? 'user' :
                              s.status === 'ACCEPTED' ? 'default' :
                              s.status === 'COMPLETED' ? 'admin' :
                              s.status === 'REJECTED' ? 'destructive' :
                              'secondary'
                            }>{s.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-3">{s.questions}</p>
                          <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                            <span>Requested at {new Date(s.createdAt).toLocaleString()}</span>
                            <div className="flex gap-2">
                              <Button size="sm" variant="secondary"
                                onClick={() => { setSelectedMentor(s.mentor); if (s.status === "COMPLETED") setIsComplete(true); setModalOpen(true); }}
                              >
                                View Mentor
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
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
                ) : userReviews.length === 0 ? (
                  <p className="text-center py-12 text-muted-foreground">You haven't left any reviews yet.</p>
                ) : (
                  <div className="space-y-3">
                    {userReviews.map((r) => (
                      <div key={r.id} className="border-l-2 border-primary/40 pl-3 hover:bg-secondary/30">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{r.mentor.firstName} {r.mentor.lastName}</span>
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
      
      <MentorDetailModal mentor={selectedMentor} isComplete={isComplete} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
};

export default UserDashboardPage;
