import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gql } from "@/lib/graphql";
import { ALL_USERS_QUERY, ALL_REVIEWS_QUERY, TOGGLE_MENTOR_STATUS_MUTATION, HIDE_REVIEW_MUTATION } from "@/lib/queries";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, GraduationCap, ShieldCheck, Star, Loader2, Eye, EyeOff, ArrowUp, ArrowDown, PenLine } from "lucide-react";
import { Review, User } from "@/types";
import { StatCard } from "@/components/ui/stat-card";

type Tab = "users" | "reviews";
type UserCategory = "all" | "mentees" | "mentors" | "admins";
type ReviewCategory = "all" | "visible" | "hidden";

const AdminDashboardPage = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("users");
  const [selectedUserCategory, setSelectedUserCategory] = useState<UserCategory>("all");
  const [selectedReviewCategory, setSelectedReviewCategory] = useState<ReviewCategory>("all");

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
  const totalMentees = users?.filter((u) => u.role === "USER").length ?? 0;
  const totalMentors = users?.filter((u) => u.role === "MENTOR").length ?? 0;
  const totalAdmins = users?.filter((u) => u.role === "ADMIN").length ?? 0;

  const getFilteredUsers = () => {
    if (!users) return [];
    switch (selectedUserCategory) {
      case "mentees":
        return users.filter((u) => u.role === "USER");
      case "mentors":
        return users.filter((u) => u.role === "MENTOR");
      case "admins":
        return users.filter((u) => u.role === "ADMIN");
      case "all":
      default:
        return users;
    }
  };

  const filteredUsers = getFilteredUsers();

  const getFilteredReviews = () => {
    if (!reviews) return [];
    switch (selectedReviewCategory) {
      case "visible":
        return reviews.filter((r) => !r.isHidden);
      case "hidden":
        return reviews.filter((r) => r.isHidden);
      case "all":
      default:
        return reviews;
    }
  };

  const filteredReviews = getFilteredReviews();

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
                  <Badge variant={ user?.role === "ADMIN" ? "admin" : user?.role === "MENTOR" ? "default" : "user" } className="mt-1">
                    {user?.role}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t">
                <Button variant={tab === "users" ? "secondary" : "ghost"} size="sm" className="w-full justify-start"
                  onClick={() => setTab("users")}
                >
                  <Users className="h-4 w-4 mr-2" /> Users
                </Button>
                <Button variant={tab === "reviews" ? "secondary" : "ghost"} size="sm" className="w-full justify-start"
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

          {tab === "users" && (
            <>
              <div className="grid grid-cols-4 gap-4">
                <StatCard  label="Total System Users"  value={totalUsers} loading={usersLoading}
                  icon={<Users className="h-7 w-7 text-gray-500" />} 
                  isActive={selectedUserCategory === "all"}
                  onClick={() => setSelectedUserCategory("all")}
                />
                <StatCard label="Mentees" value={totalMentees} loading={usersLoading}
                  icon={<PenLine className="h-7 w-7 text-yellow-700" />} 
                  isActive={selectedUserCategory === "mentees"}
                  onClick={() => setSelectedUserCategory("mentees")}
                />
                <StatCard label="Mentors" value={totalMentors} loading={usersLoading}
                  icon={<GraduationCap className="h-7 w-7 text-primary" />} 
                  isActive={selectedUserCategory === "mentors"}
                  onClick={() => setSelectedUserCategory("mentors")}
                />
                <StatCard label="Admins" value={totalAdmins} loading={usersLoading}
                  icon={<ShieldCheck className="h-7 w-7 text-blue-700" />} 
                  isActive={selectedUserCategory === "admins"}
                  onClick={() => setSelectedUserCategory("admins")}
                />
              </div>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h2 className="text-xl font-semibold">All Users</h2>

                  {usersLoading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto border rounded-md">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr className="text-center">
                            <th className="p-3 pl-10 text-start">Name</th>
                            <th className="p-3 pl-20 text-start">Email</th>
                            <th className="p-3">Role</th>
                            {selectedUserCategory !== 'admins' && (<th className="p-3">Action</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers?.map((u) => (
                            <tr key={u.id} className="border-t hover:bg-muted/20">
                              <td className="p-3 font-medium">{u.firstName} {u.lastName}
                                {u.id === user?.id && (<span className="text-xs text-muted-foreground"> (You)</span>)}
                              </td>
                              <td className="p-3 text-muted-foreground">{u.email}</td>
                              <td className="p-3 text-center">
                                <Badge variant={ u.role === "ADMIN" ? "admin" : u.role === "MENTOR" ? "default" : "user" }>
                                  {u.role}
                                </Badge>
                              </td>
                              {selectedUserCategory !== 'admins' && (
                                <td className="p-3 text-center">
                                  {u.role !== "ADMIN" ? u.id !== user?.id && u.role === "MENTOR" ? (
                                    <Button size="sm" variant="outline_user" disabled={toggleMentor.isPending}
                                      onClick={() => toggleMentor.mutate(u.id)}
                                    >
                                      <><ArrowDown className="h-3 w-3 mr-1" />Demote</>
                                    </Button>
                                  ) : (
                                    <Button size="sm" variant="outline" disabled={toggleMentor.isPending}
                                      onClick={() => toggleMentor.mutate(u.id)}
                                    >
                                      <><ArrowUp className="h-3 w-3 mr-1" />Promote</>
                                    </Button>
                                  ) : (<></>)}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {tab === "reviews" && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <StatCard label="All Reviews" value={reviews?.length ?? 0} loading={reviewsLoading}
                  icon={<Star className="h-7 w-7 text-amber-600" />}
                  isActive={selectedReviewCategory === "all"}
                  onClick={() => setSelectedReviewCategory("all")}
                />
                <StatCard label="Visible Reviews" loading={reviewsLoading}
                  value={reviews?.filter((r) => !r.isHidden).length ?? 0}
                  icon={<Eye className="h-7 w-7 text-primary" />}
                  isActive={selectedReviewCategory === "visible"}
                  onClick={() => setSelectedReviewCategory("visible")}
                />
                <StatCard label="Hidden Reviews" loading={reviewsLoading}
                  icon={<EyeOff className="h-7 w-7 text-destructive" />}
                  value={reviews?.filter((r) => r.isHidden).length ?? 0}
                  isActive={selectedReviewCategory === "hidden"}
                  onClick={() => setSelectedReviewCategory("hidden")}
                />
              </div>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h2 className="text-xl font-semibold">
                    {selectedReviewCategory === "all"
                      ? "All Reviews" : selectedReviewCategory === "visible"
                        ? "Visible Reviews" : "Hidden Reviews"
                    }
                  </h2>
                  {reviewsLoading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : !filteredReviews || filteredReviews.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      {selectedReviewCategory === "all"
                        ? "No reviews yet." : selectedReviewCategory === "hidden"
                          ? "No hidden reviews." : "No visible reviews."
                      }
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredReviews.map((r) => (
                        <div key={r.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-sm font-semibold">{r.mentee.firstName} {r.mentee.lastName}
                                <span className=" text-muted-foreground font-normal"> reviewed Mentor </span>{r.mentor.firstName} {r.mentor.lastName}
                              </div>
                              <div className="flex items-center gap-1 text-amber-600 mt-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`h-3 w-3 ${i < r.score ? "fill-current" : "text-gray-300"}`} />
                                ))}
                              </div>
                            </div>
                              {r.isHidden ? (
                                <Button size="sm" variant="outline_destructive" disabled={hideReview.isPending} onClick={() => hideReview.mutate(r.id)}>
                                    <Eye className="h-3 w-3 mr-1" /> Unhide
                                </Button>
                              ) : (
                                <Button size="sm" variant="outline" disabled={hideReview.isPending} onClick={() => hideReview.mutate(r.id)}>
                                  <EyeOff className="h-3 w-3 mr-1" /> Hide
                                </Button>
                              )}
                          </div>
                          <p className="text-sm text-muted-foreground">{r.remark}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
