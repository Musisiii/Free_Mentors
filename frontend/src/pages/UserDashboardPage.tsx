import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { gql } from "@/lib/graphql";
import { MY_SESSIONS_QUERY } from "@/lib/queries";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import {
  BookOpen,
  GraduationCap,
  User as UserIcon,
  Briefcase,
  Star,
  Loader2,
} from "lucide-react";
import { MentorshipSession, SessionStatus } from "@/types";
import { ReviewModal } from "@/components/sessions/ReviewModal";

const STATUS_STYLES: Record<SessionStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  ACCEPTED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const UserDashboardPage = () => {
  const { user } = useAuthStore();
  const [reviewSession, setReviewSession] = useState<MentorshipSession | null>(null);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["my-sessions"],
    queryFn: async () => {
      const res = await gql<{ mySessions: MentorshipSession[] }>(MY_SESSIONS_QUERY);
      return res.mySessions;
    },
  });

  const completed = (sessions ?? []).filter((s) => s.status === "COMPLETED").length;
  const pending = (sessions ?? []).filter((s) => s.status === "PENDING").length;

  return (
    <div className="container max-w-6xl mx-auto p-4 py-8">
      <div className="grid lg:grid-cols-[280px,1fr] gap-6 items-start">
        {/* Profile */}
        <aside className="lg:sticky lg:top-20">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-3">
                  <UserIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground">{user?.email}</div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <Field label="Role">{user?.role}</Field>
                <Field label="Address">{user?.address || "Not set"}</Field>
                <Field label="Occupation">{user?.occupation || "Not set"}</Field>
                {user?.bio && <Field label="Bio">{user.bio}</Field>}
              </div>

              <Button asChild className="w-full" variant="outline">
                <Link to="/mentors">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Browse Mentors
                </Link>
              </Button>
            </CardContent>
          </Card>
        </aside>

        {/* Main */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Your Dashboard</h1>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={<BookOpen className="h-7 w-7 text-primary" />}
              label="Total Sessions"
              value={sessions?.length ?? 0}
              loading={isLoading}
            />
            <StatCard
              icon={<Star className="h-7 w-7 text-emerald-600" />}
              label="Completed"
              value={completed}
              loading={isLoading}
            />
            <StatCard
              icon={<Briefcase className="h-7 w-7 text-amber-600" />}
              label="Pending"
              value={pending}
              loading={isLoading}
            />
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">My Mentorship Sessions</h2>
                <Button asChild size="sm">
                  <Link to="/mentors">Find a Mentor</Link>
                </Button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !sessions || sessions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-10 w-10 mx-auto mb-3" />
                  <p className="mb-3">You haven't requested any sessions yet.</p>
                  <Button asChild>
                    <Link to="/mentors">Browse Mentors</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className="border rounded-lg p-4 space-y-2 hover:shadow-sm transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold">
                            {s.mentor.firstName} {s.mentor.lastName}
                          </div>
                          {s.mentor.occupation && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Briefcase className="h-3 w-3" /> {s.mentor.occupation}
                            </div>
                          )}
                        </div>
                        <Badge className={STATUS_STYLES[s.status]}>{s.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">{s.questions}</p>
                      <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                        <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                        <div className="flex gap-2">
                          <Button asChild size="sm" variant="ghost">
                            <Link to={`/mentors/${s.mentor.id}`}>View Mentor</Link>
                          </Button>
                          {s.status === "COMPLETED" && (
                            <Button size="sm" onClick={() => setReviewSession(s)}>
                              <Star className="h-3 w-3 mr-1" /> Review
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {reviewSession && (
        <ReviewModal
          open={!!reviewSession}
          onOpenChange={(v) => !v && setReviewSession(null)}
          mentor={reviewSession.mentor}
        />
      )}
    </div>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  loading?: boolean;
}) => (
  <Card>
    <CardContent className="pt-6 flex items-center justify-between">
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-3xl font-bold">{loading ? "—" : value}</div>
      </div>
      {icon}
    </CardContent>
  </Card>
);

export default UserDashboardPage;
