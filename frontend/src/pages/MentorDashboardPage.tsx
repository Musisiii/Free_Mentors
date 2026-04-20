import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gql } from "@/lib/graphql";
import { MY_SESSIONS_QUERY, UPDATE_SESSION_STATUS_MUTATION } from "@/lib/queries";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Briefcase,
  CheckCircle,
  GraduationCap,
  Loader2,
  MapPin,
  User as UserIcon,
  XCircle,
  Flag,
  Mail,
} from "lucide-react";
import { MentorshipSession, SessionStatus } from "@/types";

const STATUS_STYLES: Record<SessionStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  ACCEPTED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const MentorDashboardPage = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"ALL" | SessionStatus>("ALL");

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["my-sessions"],
    queryFn: async () => {
      const res = await gql<{ mySessions: MentorshipSession[] }>(MY_SESSIONS_QUERY);
      return res.mySessions;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ sessionId, status }: { sessionId: string; status: SessionStatus }) => {
      const res = await gql<{
        updateSessionStatus: { success: boolean; errors: string[] | null };
      }>(UPDATE_SESSION_STATUS_MUTATION, { sessionId, status });
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
      completed: all.filter((s) => s.status === "COMPLETED").length,
    };
  }, [sessions]);

  const filtered = (sessions ?? []).filter((s) => filter === "ALL" || s.status === filter);

  return (
    <div className="container max-w-6xl mx-auto p-4 py-8">
      <div className="grid lg:grid-cols-[280px,1fr] gap-6 items-start">
        {/* Profile */}
        <aside className="lg:sticky lg:top-20">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-3">
                  <GraduationCap className="h-6 w-6 text-primary" />
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
                {user?.occupation && (
                  <Field label="Occupation" icon={<Briefcase className="h-3 w-3" />}>
                    {user.occupation}
                  </Field>
                )}
                {user?.expertise && <Field label="Expertise">{user.expertise}</Field>}
                {user?.address && (
                  <Field label="Address" icon={<MapPin className="h-3 w-3" />}>
                    {user.address}
                  </Field>
                )}
                {user?.bio && <Field label="Bio">{user.bio}</Field>}
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Main */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Mentor Dashboard</h1>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total" value={counts.total} loading={isLoading} />
            <StatCard label="Pending" value={counts.pending} loading={isLoading} highlight="amber" />
            <StatCard label="Accepted" value={counts.accepted} loading={isLoading} highlight="blue" />
            <StatCard label="Completed" value={counts.completed} loading={isLoading} highlight="emerald" />
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-xl font-semibold">Session Requests</h2>
                <div className="flex gap-1 flex-wrap">
                  {(["ALL", "PENDING", "ACCEPTED", "REJECTED", "COMPLETED"] as const).map((f) => (
                    <Button
                      key={f}
                      size="sm"
                      variant={filter === f ? "default" : "outline"}
                      onClick={() => setFilter(f)}
                    >
                      {f}
                    </Button>
                  ))}
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No sessions in this view.
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((s) => {
                    const isPending = updateStatus.isPending;
                    return (
                      <div key={s.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <div className="rounded-full bg-muted p-2">
                              <UserIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-semibold">
                                {s.mentee.firstName} {s.mentee.lastName}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {s.mentee.email}
                              </div>
                            </div>
                          </div>
                          <Badge className={STATUS_STYLES[s.status]}>{s.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {s.questions}
                        </p>
                        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
                          <span>Requested {new Date(s.createdAt).toLocaleString()}</span>
                          <div className="flex gap-2">
                            {s.status === "PENDING" && (
                              <>
                                <Button
                                  size="sm"
                                  disabled={isPending}
                                  onClick={() =>
                                    updateStatus.mutate({ sessionId: s.id, status: "ACCEPTED" })
                                  }
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" /> Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isPending}
                                  onClick={() =>
                                    updateStatus.mutate({ sessionId: s.id, status: "REJECTED" })
                                  }
                                >
                                  <XCircle className="h-3 w-3 mr-1" /> Decline
                                </Button>
                              </>
                            )}
                            {s.status === "ACCEPTED" && (
                              <Button
                                size="sm"
                                disabled={isPending}
                                onClick={() =>
                                  updateStatus.mutate({ sessionId: s.id, status: "COMPLETED" })
                                }
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
        </div>
      </div>
    </div>
  );
};

const Field = ({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div>
    <div className="text-xs text-muted-foreground flex items-center gap-1">
      {icon}
      {label}
    </div>
    <div className="font-medium">{children}</div>
  </div>
);

const StatCard = ({
  label,
  value,
  loading,
  highlight,
}: {
  label: string;
  value: number;
  loading?: boolean;
  highlight?: "amber" | "blue" | "emerald";
}) => {
  const color =
    highlight === "amber"
      ? "text-amber-600"
      : highlight === "blue"
        ? "text-blue-600"
        : highlight === "emerald"
          ? "text-emerald-600"
          : "text-foreground";
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className={`text-3xl font-bold ${color}`}>{loading ? "—" : value}</div>
      </CardContent>
    </Card>
  );
};

export default MentorDashboardPage;
