import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Shield, Users, TrendingUp } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

const LandingPage = () => {
  const { isAuthenticated, user } = useAuthStore();

  const dashboardPath =
    user?.role === "ADMIN"
      ? "/dashboard/admin"
      : user?.role === "MENTOR"
        ? "/dashboard/mentor"
        : "/dashboard/user";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section
        className="container relative py-24 md:py-32 space-y-8 bg-cover bg-center"
        style={{ backgroundImage: `url('/images/auth-bg.jpg')` }}
      >
        <div className="absolute inset-0 bg-black/40" aria-hidden />
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="text-center md:text-left space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
                Connect with{" "}
                <span className="text-primary">Expert Mentors</span>
              </h1>
              <p className="text-xl text-white/90 max-w-2xl">
                Accelerate your learning journey with personalized guidance from experienced
                professionals in your field.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
                <Button size="lg" asChild>
                  <Link to={isAuthenticated ? dashboardPath : "/register"}>
                    {isAuthenticated ? "Open Dashboard" : "Create Account"}
                  </Link>
                </Button>
                {isAuthenticated && (
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/mentors">Browse Mentors</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">Why Choose Free Mentors?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A simple, free platform to connect with experienced professionals.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="p-3 bg-primary/10 rounded-lg w-fit">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Expert Guidance</h3>
              <p className="text-muted-foreground">
                Connect with experienced mentors who can guide you through your learning journey.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="p-3 bg-primary/10 rounded-lg w-fit">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Safe & Secure</h3>
              <p className="text-muted-foreground">
                Your data is protected with industry-standard authentication and encrypted
                connections.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="p-3 bg-primary/10 rounded-lg w-fit">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Community Driven</h3>
              <p className="text-muted-foreground">
                Join thousands of learners accelerating their careers with mentor guidance.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="p-3 bg-primary/10 rounded-lg w-fit">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Always Improving</h3>
              <p className="text-muted-foreground">
                We continuously update the platform with new features based on user feedback.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* About */}
      <section className="container py-10 space-y-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">About Free Mentors</h2>
          </div>

          <div className="space-y-6 text-muted-foreground">
            <p className="text-lg leading-relaxed">
              Free Mentors was founded with a simple mission: to make mentorship more accessible
              and effective for everyone. We believe that everyone deserves access to guidance
              that can accelerate their personal and professional growth.
            </p>

            <div className="grid md:grid-cols-3 gap-8 pt-8">
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold text-primary">2K+</div>
                <div className="text-sm">Active Users</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold text-primary">300+</div>
                <div className="text-sm">Experienced Mentors</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold text-primary">90%</div>
                <div className="text-sm">User Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="py-16 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Start Your Mentorship Journey?
            </h2>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Join thousands of learners who have accelerated their careers with Free Mentors.
            </p>
            <div className="flex justify-center pt-2">
              <Button size="lg" variant="secondary" asChild>
                <Link to={isAuthenticated ? "/mentors" : "/register"}>
                  {isAuthenticated ? "Find a Mentor" : "Get Started Free"}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default LandingPage;
