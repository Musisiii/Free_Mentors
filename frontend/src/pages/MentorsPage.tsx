import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";
import { gql } from "@/lib/graphql";
import { ALL_MENTORS_QUERY } from "@/lib/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Briefcase, MapPin, GraduationCap, ArrowLeft } from "lucide-react";
import { User } from "@/types";
import { MentorDetailModal } from "@/components/mentor/MentorDetailModal";

const MentorsPage = () => {
  const [search, setSearch] = useState("");
  const [selectedMentor, setSelectedMentor] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const dashboardPath =
    user?.role === "ADMIN"
      ? "/dashboard/admin"
      : user?.role === "MENTOR"
        ? "/dashboard/mentor"
        : "/dashboard/user";
      
  const { data, isLoading, error } = useQuery({
    queryKey: ["all-mentors"],
    queryFn: async () => {
      const res = await gql<{ allMentors: User[] }>(ALL_MENTORS_QUERY);
      return res.allMentors;
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter((m) => {
      return [m.firstName, m.lastName, m.expertise, m.occupation, m.address, m.bio]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q));
    });
  }, [data, search]);

  return (
    <div className="container max-w-6xl mx-auto p-4 py-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <Button asChild variant="secondary" size="sm">
            <Link to={dashboardPath}><ArrowLeft className="h-4 w-4" />Back to Dashboard</Link>
          </Button>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, expertise, occupation…" className="pl-9" value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Browse Mentors</h1>
        <p className="text-muted-foreground">Find a mentor whose expertise matches your goals.</p>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => ( <Card key={i} className="animate-pulse h-48" /> ))}
        </div>
      )}

      {error && (
        <Card className="p-6 text-center text-destructive">Failed to load mentors. Please try again.</Card>
      )}

      {!isLoading && filtered.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground">
          <GraduationCap className="h-10 w-10 mx-auto mb-3" />We don't have any mentors matching your search yet.
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((mentor) => (
          <Card key={mentor.id} className="hover:shadow-md hover:border-primary transition-shadow cursor-pointer"
            onClick={() => { setSelectedMentor(mentor); setModalOpen(true) }}>
            <CardContent className="pt-6 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-lg">{mentor.firstName} {mentor.lastName}</div>
                    <div className="text-xs text-muted-foreground">{mentor.email}</div>
                  </div>
                  <Badge variant="default" className="text-[10px]">MENTOR</Badge>
                </div>

                {mentor.occupation && (
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" /><span>{mentor.occupation}</span>
                  </div>
                )}

                {mentor.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" /><span>{mentor.address}</span>
                  </div>
                )}

                {mentor.expertise && (
                  <div className="text-xs text-muted-foreground">Expertise:
                    <span className="text-sm font-medium text-foreground"> {mentor.expertise}</span>
                  </div>
                )}
              </CardContent>
          </Card>
        ))}
      </div>

      <MentorDetailModal mentor={selectedMentor} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
};

export default MentorsPage;
