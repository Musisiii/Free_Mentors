import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { gql } from "@/lib/graphql";
import { REGISTER_MUTATION, LOGIN_MUTATION } from "@/lib/queries";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, GraduationCap } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { User } from "@/types";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    address: "",
    occupation: "",
    bio: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { toast } = useToast();

  const update = (k: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || 
      !formData.address.trim() || !formData.occupation.trim()) {
      toast({ title: "Error", description: "Required form data missing", variant: "destructive" });
      return;
    }
    if (formData.password.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const reg = await gql<{ register: { success: boolean; errors: string[] | null; user: User | null } }>(
        REGISTER_MUTATION,
        {
          email: formData.email.trim(),
          password: formData.password,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          address: formData.address.trim(),
          bio: formData.bio.trim(),
          occupation: formData.occupation.trim(),
        },
      );
      if (!reg.register.success || !reg.register.user) {
        toast({
          title: "Registration failed",
          description: reg.register.errors?.[0] || "Could not create account",
          variant: "destructive",
        });
        return;
      }

      // Auto-login so the user lands on their dashboard.
      const login = await gql<{ login: { token: string | null; success: boolean; errors: string[] | null; user: User | null } }>(
        LOGIN_MUTATION, { email: formData.email.trim(), password: formData.password },
      );
      if (login.login.success && login.login.token && login.login.user) {
        setAuth(login.login.user, login.login.token);
        toast({ title: "Welcome to Free Mentors!", description: "Your account has been created." });
        navigate("/dashboard/user", { replace: true });
      } else {
        toast({ title: "Account created", description: "Please log in to continue." });
        navigate("/login", { replace: true });
      }
    } catch (err: any) {
      toast({
        title: "Registration failed",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-[calc(100vh-7rem)] flex items-center justify-center p-4 relative auth-bg"
      style={{ backgroundImage: `url('/images/pic4.png')` }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <Card className="w-full max-w-lg relative z-10 my-6">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary rounded-lg">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Create an account</CardTitle>
          <CardDescription className="text-center">Join Free Mentors and connect with experienced professionals</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="John" value={formData.firstName} required onChange={update("firstName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Doe" value={formData.lastName} required onChange={update("lastName")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="your@email.com" value={formData.email} required onChange={update("email")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput id="password" placeholder="••••••••" value={formData.password} required onChange={update("password")} />
              <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="City, Country" value={formData.address} required onChange={update("address")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input id="occupation" placeholder="Software Engineer" value={formData.occupation} required onChange={update("occupation")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio (optional)</Label>
              <Textarea id="bio" placeholder="Tell us a bit about yourself and what you're looking for in a mentor"
                value={formData.bio} onChange={update("bio")} rows={3}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Account
            </Button>
            <p className="text-sm text-center text-muted-foreground">Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default RegisterPage;
