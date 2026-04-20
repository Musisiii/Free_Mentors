import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { gql } from "@/lib/graphql";
import { LOGIN_MUTATION } from "@/lib/queries";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, GraduationCap } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { User } from "@/types";

interface LoginResponse {
  login: {
    token: string | null;
    success: boolean;
    errors: string[] | null;
    user: User | null;
  };
}

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { toast } = useToast();

  const testAccounts = [
    { label: "Admin", email: "admin@freementors.com" },
    { label: "Mentor", email: "mentor1.free@freementors.com" },
    { label: "User", email: "user1.free@freementors.com" },
  ];
  const testPassword = "Password123!";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await gql<LoginResponse>(LOGIN_MUTATION, { email: email.trim(), password });
      const result = data.login;
      if (!result.success || !result.token || !result.user) {
        toast({
          title: "Login failed",
          description: result.errors?.[0] || "Invalid credentials",
          variant: "destructive",
        });
        return;
      }
      setAuth(result.user, result.token);
      toast({
        title: "Welcome back!",
        description: `Logged in as ${result.user.firstName} ${result.user.lastName}`,
      });
      const paths: Record<string, string> = {
        ADMIN: "/dashboard/admin",
        MENTOR: "/dashboard/mentor",
        USER: "/dashboard/user",
      };
      navigate(paths[result.user.role] || "/", { replace: true });
    } catch (err: any) {
      toast({
        title: "Login failed",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fillTestAccount = (testEmail: string) => {
    setEmail(testEmail);
    setPassword(testPassword);
  };

  return (
    <div
      className="min-h-[calc(100vh-7rem)] flex items-center justify-center p-4 relative auth-bg"
        style={{ backgroundImage: `url('/images/pic4.png')` }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary rounded-lg">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">Enter your email to access your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="your@email.com" value={email} required
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput id="password" placeholder="••••••••" value={password} required
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="text-xs text-center text-foreground/80 space-y-1 mt-2 border-t pt-3">
              <p className="font-medium">Test accounts (click to fill):</p>
              <div className="space-y-0.5">
                {testAccounts.map((account) => (
                  <button key={account.email} type="button" className="block mx-auto hover:text-primary"
                    onClick={() => fillTestAccount(account.email)}
                  >
                    <span className="text-muted-foreground">{account.label}:</span>{" "}{account.email}
                  </button>
                ))}
              </div>
              <p>
                <span className="text-muted-foreground">Password:</span> {testPassword}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sign In
            </Button>
            <p className="text-sm text-center text-muted-foreground">Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline font-medium">Register here</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;
