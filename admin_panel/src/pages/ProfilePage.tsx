import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";

export default function ProfilePage() {
  const { data: me } = useQuery({
    queryKey: ["admin-me"],
    queryFn: () => apiGet<{ name: string; email: string; is_admin: boolean }>("/auth/me"),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Profile</h2>
      <div className="bg-card rounded-xl p-6 card-shadow max-w-lg space-y-2">
        <div className="text-sm text-muted-foreground">Name</div>
        <div className="font-medium">{me?.name ?? "-"}</div>
        <div className="text-sm text-muted-foreground mt-4">Email</div>
        <div className="font-medium">{me?.email ?? "-"}</div>
        <div className="text-sm text-muted-foreground mt-4">Role</div>
        <div className="font-medium">{me?.is_admin ? "Admin" : "User"}</div>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => {
            localStorage.removeItem("admin_access_token");
            window.location.href = "/login";
          }}
        >
          Log out
        </Button>
      </div>
    </div>
  );
}

