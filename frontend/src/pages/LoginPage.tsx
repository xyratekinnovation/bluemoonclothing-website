import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { toast } from "@/components/ui/sonner";
import { apiLogin } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const tokens = await apiLogin(email, password);
      localStorage.setItem("access_token", tokens.access_token);
      toast.success("Signed in");
      navigate("/account", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full border border-border rounded-md px-4 py-3 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-shadow";

  return (
    <Layout>
      <div className="container py-10 md:py-16 max-w-md">
        <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-2">Welcome back</h1>
        <p className="text-sm text-muted-foreground mb-8">Sign in to continue.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className={inputCls}
            type="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className={inputCls}
            type="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold-gradient text-primary-foreground py-3.5 rounded-md text-sm font-medium tracking-wide hover:opacity-90 transition-opacity disabled:opacity-70"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-muted-foreground mt-6">
          Don&apos;t have an account?{" "}
          <Link className="text-primary hover:underline" to="/register">
            Create one
          </Link>
        </p>
      </div>
    </Layout>
  );
}

