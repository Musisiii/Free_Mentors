import { Link, NavLink, useNavigate, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ui/theme-toggle";
import { useAuthStore } from "@/stores/authStore";
import { GraduationCap, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const MainLayout = () => {
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    clearAuth();
    toast({ title: "Logged out", description: "See you next time!" });
    navigate("/");
  };

  const dashboardPath =
    user?.role === "ADMIN"
      ? "/dashboard/admin"
      : user?.role === "MENTOR"
        ? "/dashboard/mentor"
        : "/dashboard/user";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Free Mentors</span>
          </Link>

          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1 text-sm">
              <NavLink
                to={dashboardPath}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md hover:bg-muted ${isActive ? "text-primary font-semibold" : "text-foreground/80"}`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/mentors"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md hover:bg-muted ${isActive ? "text-primary font-semibold" : "text-foreground/80"}`
                }
              >
                Browse Mentors
              </NavLink>
            </nav>
          )}

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link to="/login">Login</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t py-3 text-center">
        <p className="text-sm text-muted-foreground">
          © 2026 Free Mentors. Connecting learners with experienced mentors.
        </p>
      </footer>
    </div>
  );
};
