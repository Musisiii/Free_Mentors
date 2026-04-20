import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gql } from "@/lib/graphql";
import {
  ALL_USERS_QUERY,
  ALL_REVIEWS_QUERY,
  TOGGLE_MENTOR_STATUS_MUTATION,
  HIDE_REVIEW_MUTATION,
} from "@/lib/queries";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  GraduationCap,
  ShieldCheck,
  Star,
  Loader2,
  Eye,
  EyeOff,
  ArrowUpDown,
  Plus,
} from "lucide-react";
import { Review, User } from "@/types";
import { AddAdminDialog } from "@/components/admin/AddAdminDialog";

type Tab = "users" | "reviews";

const AdminDashboardPage = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("users");
  const [addAdminOpen, setAddAdminOpen] = useState(false);

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const res = await gql<{ allUsers: User[] }>(ALL_USERS_QUERY);
      return res.allUsers;
    },
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ["all-reviews-admin"],
    queryFn: async () => {
      // Admin gets all reviews; backend allReviews filters out hidden, so we
      // fall back to it. For full visibility we'd add an admin-only resolver.
      const res = await gql<{ allReviews: Review[] }>(ALL_REVIEWS_QUERY);
      return res.allReviews;
    },
  });

  const toggleMentor = useMutation({
    mutationFn: async (userId: string) => {
      const res = await gql<{
        toggleMentorStatus: { success: boolean; errors: string[] | null };
      }>(TOGGLE_MENTOR_STATUS_MUTATION, { userId });
      if (!res.toggleMentorStatus.success) {
        throw new Error(res.toggleMentorStatus.errors?.[0] || "Failed to update role");
      }
    },
    onSuccess: () => {
      toast({ title: "Role updated" });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      queryClient.invalidateQueries({ queryKey: ["all-mentors"] });
    },
    onError: (err: any) =>
      toast({ title: "Update failed", description: err.message, variant: "destructive" }),
  });

  const hideReview = useMutation({
    mutationFn: async (reviewId: string) => {
      const res = await gql<{ hideReview: { success: boolean; errors: string[] | null } }>(
        HIDE_REVIEW_MUTATION,
        { reviewId },
      );
      if (!res.hideReview.success) {
        throw new Error(res.hideReview.errors?.[0] || "Failed");
      }
    },
    onSuccess: () => {
      toast({ title: "Review visibility toggled" });
      queryClient.invalidateQueries({ queryKey: ["all-reviews-admin"] });
      queryClient.invalidateQueries({ queryKey: ["all-reviews"] });
    },
    onError: (err: any) =>
      toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  const totalUsers = users?.length ?? 0;
  const totalMentors = users?.filter((u) => u.role === "MENTOR").length ?? 0;
  const totalAdmins = users?.filter((u) => u.role === "ADMIN").length ?? 0;

  return (
    <div className="container max-w-6xl mx-auto p-4 py-8">
      <div className="grid lg:grid-cols-[280px,1fr] gap-6 items-start">
        <aside className="lg:sticky lg:top-20">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-3">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground">{user?.email}</div>
                  <Badge className="mt-1">ADMIN</Badge>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t">
                <Button
                  variant={tab === "users" ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setTab("users")}
                >
                  <Users className="h-4 w-4 mr-2" /> Users
                </Button>
                <Button
                  variant={tab === "reviews" ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setTab("reviews")}
                >
                  <Star className="h-4 w-4 mr-2" /> Reviews
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>

        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>

          <div className="grid grid-cols-3 gap-4">
            <StatCard icon={<Users className="h-7 w-7 text-blue-500" />} label="Users" value={totalUsers} loading={usersLoading} />
            <StatCard icon={<GraduationCap className="h-7 w-7 text-primary" />} label="Mentors" value={totalMentors} loading={usersLoading} />
            <StatCard icon={<ShieldCheck className="h-7 w-7 text-emerald-600" />} label="Admins" value={totalAdmins} loading={usersLoading} />
          </div>

          {tab === "users" && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">All Users</h2>
                  <Button size="sm" onClick={() => setAddAdminOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Add Admin
                  </Button>
                </div>

                {usersLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="overflow-x-auto border rounded-md">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr className="text-left">
                          <th className="p-3">Name</th>
                          <th className="p-3">Email</th>
                          <th className="p-3">Role</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users?.map((u) => (
                          <tr key={u.id} className="border-t hover:bg-muted/20">
                            <td className="p-3 font-medium">
                              {u.firstName} {u.lastName}
                            </td>
                            <td className="p-3 text-muted-foreground">{u.email}</td>
                            <td className="p-3">
                              <Badge
                                variant={
                                  u.role === "ADMIN"
                                    ? "default"
                                    : u.role === "MENTOR"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {u.role}
                              </Badge>
                            </td>
                            <td className="p-3 text-right">
                              {u.role !== "ADMIN" && u.id !== user?.id && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={toggleMentor.isPending}
                                  onClick={() => toggleMentor.mutate(u.id)}
                                >
                                  <ArrowUpDown className="h-3 w-3 mr-1" />
                                  {u.role === "MENTOR" ? "Demote to User" : "Promote to Mentor"}
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {tab === "reviews" && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h2 className="text-xl font-semibold">All Reviews</h2>
                {reviewsLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !reviews || reviews.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">No reviews yet.</div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((r) => (
                      <div key={r.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-sm">
                              <span className="font-semibold">
                                {r.mentee.firstName} {r.mentee.lastName}
                              </span>{" "}
                              <span className="text-muted-foreground">reviewed</span>{" "}
                              <span className="font-semibold">
                                {r.mentor.firstName} {r.mentor.lastName}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-amber-600 mt-1">
                              {Array.from({ length: r.score }).map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-current" />
                              ))}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={hideReview.isPending}
                            onClick={() => hideReview.mutate(r.id)}
                          >
                            {r.isHidden ? (
                              <>
                                <Eye className="h-3 w-3 mr-1" /> Unhide
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-3 w-3 mr-1" /> Hide
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">{r.remark}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AddAdminDialog open={addAdminOpen} onOpenChange={setAddAdminOpen} />
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

export default AdminDashboardPage;
