import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiLogin } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const tokens = await apiLogin(email, password);
      localStorage.setItem("admin_access_token", tokens.access_token);
      const me = await apiGet<{ is_admin: boolean }>("/auth/me");
      if (!me.is_admin) {
        localStorage.removeItem("admin_access_token");
        toast({
          title: "Not an admin",
          description: "This account is not an administrator. In Supabase SQL run: UPDATE users SET is_admin = true WHERE email = 'your@email.com';",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Signed in" });
      navigate("/", { replace: true });
    } catch (err) {
      toast({
        title: "Login failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8 card-shadow">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Bluemoon Admin</h1>
          <p className="text-sm text-muted-foreground">Sign in with an admin account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-muted"
            />
          </div>
          <Button type="submit" className="w-full gold-gradient text-primary-foreground" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
